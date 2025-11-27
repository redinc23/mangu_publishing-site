# UI Auto-Improver Agent

The agent inspects UI diffs (`client/**`) and asks an LLM to propose incremental improvements. When run inside CI it applies the returned patch, pushes a branch, and opens a pull request automatically.

## Environment variables

Set these in `.env` for local runs or as GitHub Action secrets/variables.

| Name | Required | Description |
| ---- | -------- | ----------- |
| `OPENAI_API_KEY` | Yes (OpenAI provider) | API key for the OpenAI account. |
| `GH_TOKEN` | Recommended | Personal access token with `repo` scope used to push branches and open PRs. Falls back to `GITHUB_TOKEN` in CI. |
| `AGENT_PROVIDER` | Optional | Defaults to `openai`. Future providers can be plugged in here. |
| `AGENT_MODEL` | Optional | Defaults to `gpt-4o-mini`. Override to target a different model. |

The workflow also supplies these runtime values:

- `BASE_SHA`, `HEAD_SHA`, `TARGET_BRANCH`, `DEFAULT_BRANCH`
- `GITHUB_TOKEN` (GitHub-provided token with `contents` and `pull-requests` permissions)

## Local dry run

1. `cd agent`
2. `npm install`
3. Export `BASE_SHA` and `HEAD_SHA` (for example: `git rev-parse HEAD~1` and `git rev-parse HEAD`)
4. Run `node run.js` to generate improvements and see the resulting branch locally.

## GitHub Action integration

The workflow `.github/workflows/ui-agent.yml` triggers on pushes that touch `client/**`. It:

1. Checks out the repository with full history.
2. Installs Node 20 and the agent dependencies.
3. Runs `node agent/run.js`.
4. Pushes a new `ui-agent/*` branch and opens a PR against the source branch.

Ensure the secrets below are populated before enabling the workflow:

- `OPENAI_API_KEY`
- `UI_AGENT_GH_TOKEN` (optional, overrides `GITHUB_TOKEN`)

