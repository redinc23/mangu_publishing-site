#!/usr/bin/env bash
# ===== Dev bring-up from main (one-shot) =====
set -euo pipefail

log() { printf "\n%s %s\n" "$1" "$2"; }

log "🔐" "Loading local credentials (or creating a stub)…"
if [ ! -f scripts/credentials/local.sh ]; then
  mkdir -p scripts/credentials
  cat > scripts/credentials/local.sh <<'ENV'
# Fill these with REAL values; this file is gitignored.
export GITHUB_TOKEN="REPLACE_ME"
export GITHUB_USER="REPLACE_ME"
export AWS_ACCESS_KEY_ID="REPLACE_ME"
export AWS_SECRET_ACCESS_KEY="REPLACE_ME"
export AWS_REGION="us-east-1"
# Add any others your app needs:
# export STRIPE_SECRET_KEY="REPLACE_ME"
# export DEEPSEEK_API_KEY="REPLACE_ME"
ENV
  chmod 600 scripts/credentials/local.sh
  echo "Created scripts/credentials/local.sh — update with real values after first run."
fi
# shellcheck disable=SC1091
source scripts/credentials/local.sh || true

log "🌿" "Ensuring we’re on main…"
# If working tree is dirty and prevents checkout, stash it temporarily
if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
  STASHED=0
  if ! git checkout -q main 2>/dev/null; then
    log "🧺" "Stashing local changes to switch branches…"
    git stash -u -m "auto-stash: dev bring-up $(date +%F-%T)" && STASHED=1
  fi
  git checkout main
  [ "$STASHED" = "1" ] && log "ℹ️" "Your work was stashed. Re-apply later with: git stash pop"
else
  git checkout main
fi
git pull --ff-only || true

log "🔎" "Checking Docker & Node…"
if ! command -v docker >/dev/null 2>&1; then
  echo "❌ Docker CLI not found. Install Docker Desktop and re-run."
  exit 1
fi
docker --version || true
node -v || { echo "❌ Node not installed. Install Node (LTS) and re-run."; exit 1; }
npm -v || { echo "❌ npm not installed. Install Node/npm and re-run."; exit 1; }

# Try to ensure Docker daemon is up (macOS)
if ! docker info >/dev/null 2>&1; then
  if [ "$(uname)" = "Darwin" ] && command -v open >/dev/null 2>&1; then
    log "🐳" "Starting Docker Desktop… (waiting up to 60s)"
    open -a Docker
    for i in {1..60}; do
      docker info >/dev/null 2>&1 && break
      sleep 1
    done
  fi
fi
docker info >/dev/null 2>&1 || { echo "❌ Docker daemon not reachable. Start Docker and re-run."; exit 1; }

log "🧱" "Starting shared services (Postgres, Redis, Adminer, Mailhog)…"
./start-dev.sh

log "📡" "Waiting for containers to be healthy (up to ~20s)…"
for svc in mangu-pg redis; do
  for i in {1..20}; do
    if docker ps --format '{{.Names}}' | grep -q "$svc"; then
      break
    fi
    sleep 1
  done
done
docker ps --format ' - {{.Names}} | {{.Status}}'

log "📦" "Installing npm deps (safe to re-run)…"
npm --prefix server install
npm --prefix client install

log "🚀" "Starting API & UI…"
# Start both in the background if we can't auto-open terminals
started_bg=0
if command -v osascript >/dev/null 2>&1 && [ "$(uname)" = "Darwin" ]; then
  osascript <<'OSA' >/dev/null 2>&1 || true
tell application "Terminal"
  do script "cd '$(pwd)'; source scripts/credentials/local.sh; npm --prefix server run dev"
  do script "cd '$(pwd)'; source scripts/credentials/local.sh; npm --prefix client run dev"
end tell
OSA
else
  # Fallback: background both processes here
  ( source scripts/credentials/local.sh; npm --prefix server run dev ) >/tmp/server.dev.log 2>&1 & disown || true
  ( source scripts/credentials/local.sh; npm --prefix client run dev ) >/tmp/client.dev.log 2>&1 & disown || true
  started_bg=1
fi

log "🧪" "Health checks (retrying for ~20s)…"
api_ok=0
ui_ok=0
for i in {1..20}; do
  curl -fsS http://localhost:5000 >/dev/null 2>&1 && api_ok=1 || true
  curl -fsS http://localhost:5173 >/dev/null 2>&1 && ui_ok=1 || true
  [ "$api_ok" -eq 1 ] && [ "$ui_ok" -eq 1 ] && break
  sleep 1
done

[ "$api_ok" -eq 1 ] && echo "✅ API reachable at http://localhost:5000" || echo "⚠️ API not up yet"
[ "$ui_ok" -eq 1 ] && echo "✅ UI reachable at  http://localhost:5173" || echo "⚠️ UI not up yet"

log "🧰" "Optional deeper check…"
if [ -x ./test-setup.sh ]; then
  ./test-setup.sh || true
else
  echo " (./test-setup.sh not found/executable — skipping)"
fi

if [ "$started_bg" -eq 1 ]; then
  echo
  echo "📜 Logs (tail in another shell if needed):"
  echo "  tail -f /tmp/server.dev.log"
  echo "  tail -f /tmp/client.dev.log"
fi

echo
echo "🎉 Done. API: http://localhost:5000   UI: http://localhost:5173"
