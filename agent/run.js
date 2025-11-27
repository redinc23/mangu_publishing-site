import { promises as fs } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import simpleGit from 'simple-git';
import OpenAI from 'openai';
import { Octokit } from '@octokit/rest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(repoRoot, '.env') });

const git = simpleGit(repoRoot);

const log = (message, extra = undefined) => {
  const stamp = new Date().toISOString();
  if (extra) {
    console.log(`[${stamp}] ${message}`, extra);
  } else {
    console.log(`[${stamp}] ${message}`);
  }
};

const readPromptTemplate = async () => {
  const promptPath = path.join(__dirname, 'prompt.txt');
  return fs.readFile(promptPath, 'utf8');
};

const resolveEventContext = async () => {
  const env = process.env;
  let baseSha = env.BASE_SHA || env.GITHUB_BASE_SHA || env.GITHUB_EVENT_BEFORE || '';
  let headSha = env.HEAD_SHA || env.GITHUB_SHA || '';
  let targetBranch = env.GITHUB_REF_NAME || env.GITHUB_HEAD_REF || '';
  let defaultBranch = env.GITHUB_BASE_REF || env.DEFAULT_BRANCH || 'main';

  const eventPath = env.GITHUB_EVENT_PATH;
  if (eventPath) {
    try {
      const raw = await fs.readFile(eventPath, 'utf8');
      const event = JSON.parse(raw);
      if (event.pull_request) {
        baseSha = baseSha || event.pull_request.base?.sha || '';
        headSha = headSha || event.pull_request.head?.sha || '';
        targetBranch = targetBranch || event.pull_request.base?.ref || '';
        defaultBranch = targetBranch || defaultBranch;
      } else {
        baseSha = baseSha || event.before || '';
        headSha = headSha || event.after || '';
        if (event.ref?.startsWith('refs/heads/')) {
          targetBranch = targetBranch || event.ref.replace('refs/heads/', '');
        }
      }
    } catch (error) {
      log('Failed to parse GITHUB_EVENT_PATH', error);
    }
  }

  if (!baseSha || !headSha) {
    throw new Error('Unable to determine BASE_SHA and HEAD_SHA for diff generation.');
  }

  if (!targetBranch) {
    targetBranch = defaultBranch;
  }

  return {
    baseSha,
    headSha,
    targetBranch,
  };
};

const collectUiDiffs = async (baseSha, headSha) => {
  const nameOnly = await git.diff([
    '--name-only',
    '--diff-filter=AM',
    `${baseSha}..${headSha}`,
  ]);
  const files = nameOnly
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && line.startsWith('client/'));

  if (!files.length) {
    log('No UI files changed; exiting.');
    return { files: [], diffText: '' };
  }

  const parts = await Promise.all(
    files.map(async (filePath) => {
      const diff = await git.diff([
        '--unified=3',
        `${baseSha}..${headSha}`,
        '--',
        filePath,
      ]);
      const header = `### File: ${filePath}\n`;
      const truncated = truncateDiff(diff);
      return `${header}\n${truncated}`.trim();
    }),
  );

  const diffText = parts.join('\n\n');
  return { files, diffText };
};

const truncateDiff = (diff, maxChars = 12000) => {
  if (diff.length <= maxChars) return diff;
  const head = diff.slice(0, Math.floor(maxChars / 2));
  const tail = diff.slice(-Math.floor(maxChars / 2));
  return `${head}\n...\n${tail}`;
};

const buildPrompt = async (diffText) => {
  const template = await readPromptTemplate();
  return template.replace('{{DIFF}}', diffText || 'No diff available.');
};

const callProvider = async (prompt) => {
  const provider = (process.env.AGENT_PROVIDER || 'openai').toLowerCase();
  const model = process.env.AGENT_MODEL || 'gpt-4o-mini';

  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required for OpenAI provider.');
    }

    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({
      model,
      input: prompt,
    });

    const output =
      response.output_text ||
      response.content?.map((item) => ('text' in item ? item.text : '')).join('\n') ||
      '';

    return output.trim();
  }

  throw new Error(`Unsupported AGENT_PROVIDER: ${provider}`);
};

const extractPatch = (llmOutput) => {
  const match = /```patch\s*([\s\S]*?)```/m.exec(llmOutput);
  if (!match) {
    throw new Error('LLM response did not contain a fenced ```patch block.');
  }

  const patch = match[1].trim();
  if (!patch) {
    log('Patch block is empty.');
  }

  return patch;
};

const applyPatch = async (patch) => {
  if (!patch || !patch.trim()) {
    log('Empty patch received; skipping apply.');
    return false;
  }

  try {
    await git.applyPatch(patch);
    log('Patch applied successfully.');
    return true;
  } catch (error) {
    log('Failed to apply patch.', error);
    throw error;
  }
};

const createBranchName = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const random = createHash('sha1').update(String(Math.random())).digest('hex').slice(0, 6);
  return `ui-agent/${timestamp}-${random}`;
};

const commitAndPush = async (branchName) => {
  const status = await git.status();
  if (!status.files.length) {
    log('No changes detected after patch application; aborting.');
    return null;
  }

  await git.checkoutLocalBranch(branchName);
  await git.add('.');
  await git.commit('UI Agent enhancements');
  await git.push(['--set-upstream', 'origin', branchName]);

  log(`Branch pushed: ${branchName}`);
  return branchName;
};

const openPullRequest = async (branchName, targetBranch) => {
  const repoFull = process.env.GITHUB_REPOSITORY;
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;

  if (!repoFull) {
    throw new Error('GITHUB_REPOSITORY is required to open a PR.');
  }
  if (!token) {
    throw new Error('GH_TOKEN (or GITHUB_TOKEN) is required to open a PR.');
  }

  const [owner, repo] = repoFull.split('/');
  const octokit = new Octokit({ auth: token });

  const title = 'UI Agent: automated improvements';
  const body = [
    '## Summary',
    '- Automated improvements generated by UI agent.',
    '',
    '## Validation',
    '- [ ] Tests added or updated',
    '- [ ] Verified locally',
    '',
    '> This PR was created automatically by the UI improvement agent.',
  ].join('\n');

  await octokit.pulls.create({
    owner,
    repo,
    title,
    head: branchName,
    base: targetBranch,
    body,
  });

  log(`Pull request opened against ${targetBranch}.`);
};

const ensureCleanWorkingTree = async () => {
  const status = await git.status();
  if (status.files.length) {
    throw new Error('Working tree is not clean before running agent.');
  }
};

const main = async () => {
  try {
    await ensureCleanWorkingTree();

    const { baseSha, headSha, targetBranch } = await resolveEventContext();
    log(`Base SHA: ${baseSha}`);
    log(`Head SHA: ${headSha}`);
    log(`Target branch: ${targetBranch}`);

    const { files, diffText } = await collectUiDiffs(baseSha, headSha);
    if (!files.length) {
      return;
    }

    const prompt = await buildPrompt(diffText);

    log('Calling LLM provider...');
    const llmOutput = await callProvider(prompt);
    if (!llmOutput) {
      log('LLM returned empty response; aborting.');
      return;
    }

    const patch = extractPatch(llmOutput);
    const applied = await applyPatch(patch);
    if (!applied) {
      return;
    }

    const branchName = createBranchName();
    const pushedBranch = await commitAndPush(branchName);
    if (!pushedBranch) {
      return;
    }

    await openPullRequest(pushedBranch, targetBranch);
  } catch (error) {
    console.error('Agent run failed:', error);
    process.exitCode = 1;
  }
};

await main();

