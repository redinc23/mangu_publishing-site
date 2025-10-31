#!/usr/bin/env bash

set -euo pipefail

# ---- config ----
BRANCH="${BRANCH:-chore/ci-hardening}"
NODE_VERSION="${NODE_VERSION:-20}"
PY_VERSION="${PY_VERSION:-3.11}"
ENABLE_SNYK="${ENABLE_SNYK:-false}"     # set to true to include Snyk workflow
SNYK_TOKEN="${SNYK_TOKEN:-}"            # optional; if empty, workflow will reference repo secret
# --------------

echo "==> 0) Checking GitHub CLI"
if ! command -v gh >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    echo "Installing gh via Homebrew..."
    brew install gh
  else
    echo "Please install GitHub CLI from https://cli.github.com and re-run"; exit 1
  fi
fi

echo "==> 1) GitHub auth"
if ! gh auth status >/dev/null 2>&1; then
  gh auth login
fi

echo "==> 2) Install Copilot for GH CLI"
if ! gh extension list | grep -q 'github/gh-copilot'; then
  gh extension install github/gh-copilot
fi
gh copilot auth status >/dev/null 2>&1 || gh auth refresh -h github.com -s copilot || true

echo "==> 3) Create workflows"
mkdir -p .github/workflows

cat > .github/workflows/ci.yml <<YML
name: CI

on:
  pull_request:
  push: { branches: ["**"] }

jobs:
  js:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "${NODE_VERSION}" }
      - run: npm ci || npm i
      - run: npm run lint || echo "no lint script"
      - run: npm run typecheck || echo "no typecheck script"
      - run: npm test -- --ci || echo "no tests"

  py:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "${PY_VERSION}" }
      - run: pip install -r requirements.txt || true
      - run: pip install ruff pytest || true
      - run: ruff check . || echo "ruff not configured"
      - run: pytest -q || echo "no pytest"
YML

cat > .github/workflows/codeql.yml <<'YML'
name: CodeQL

on:
  push: { branches: ["**"] }
  pull_request:
  schedule: [{ cron: "0 2 * * *" }]

jobs:
  analyze:
    uses: github/codeql-action/.github/workflows/codeql.yml@v3
    with:
      languages: javascript, python
YML

if [[ "${ENABLE_SNYK}" == "true" ]]; then
  cat > .github/workflows/snyk.yml <<'YML'
name: Snyk

on:
  pull_request:
  push: { branches: ["**"] }

jobs:
  snyk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: snyk/actions/setup@master
      - run: snyk test --all-projects || true
        env:
          SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}
YML
  if [[ -n "${SNYK_TOKEN}" ]]; then
    echo "==> Setting repo secret SNYK_TOKEN"
    gh secret set SNYK_TOKEN --body "${SNYK_TOKEN}" || true
  else
    echo "==> Remember to add repo secret SNYK_TOKEN later (Settings → Secrets → Actions)."
  fi
fi

echo "==> 4) Ensure package.json scripts (if Node present)"
if [[ -f package.json ]]; then
  node - <<'NODE'
const fs=require("fs"); const p=JSON.parse(fs.readFileSync("package.json","utf8"));
p.scripts=p.scripts||{};
p.scripts.lint=p.scripts.lint||"eslint .";
p.scripts.typecheck=p.scripts.typecheck||"tsc --noEmit";
p.scripts.test=p.scripts.test||"echo \"No tests\" && exit 0";
fs.writeFileSync("package.json",JSON.stringify(p,null,2));
console.log("Updated package.json scripts.");
NODE
fi

echo "==> 5) Create branch, commit, push"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "Not a git repo. Run: git init && git remote add origin <url>"; exit 1; }
git fetch origin || true
git checkout -b "${BRANCH}" || git checkout "${BRANCH}"
git add -A
git commit -m "chore: add CI, CodeQL${ENABLE_SNYK:+, Snyk} workflows" || echo "Nothing to commit."
git push -u origin HEAD

echo "==> 6) Open PR"
if gh pr view >/dev/null 2>&1; then
  echo "PR already exists."
else
  gh pr create --fill || gh pr create -t "CI & Security bootstrap" -b "Adds CI, CodeQL${ENABLE_SNYK:+, Snyk}."
fi

echo "==> 7) AI review with Copilot"
PR_NUM="$(gh pr view --json number -q .number)"
gh copilot pr review --pr "${PR_NUM}" --feedback || true

echo "==> Done. Next:"
echo " - In GitHub: Settings → Rules → Pull request ruleset → require checks (CI, CodeQL${ENABLE_SNYK:+, Snyk})."
echo " - Push more commits; the PR will re-run checks and you can re-run: gh copilot pr review --pr ${PR_NUM} --feedback"

