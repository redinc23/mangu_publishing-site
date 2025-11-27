#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AGENT_DIR="${ROOT_DIR}/agent"

BASE_SHA="${1:-$(git -C "${ROOT_DIR}" rev-parse HEAD~1)}"
HEAD_SHA="${2:-$(git -C "${ROOT_DIR}" rev-parse HEAD)}"
TARGET_BRANCH="${TARGET_BRANCH:-$(git -C "${ROOT_DIR}" rev-parse --abbrev-ref HEAD)}"
DEFAULT_BRANCH="${DEFAULT_BRANCH:-main}"

echo "Running UI agent dry run from ${BASE_SHA} -> ${HEAD_SHA}"

if [[ ! -d "${AGENT_DIR}/node_modules" ]]; then
  echo "Installing agent dependencies…"
  (cd "${AGENT_DIR}" && npm install)
fi

(cd "${AGENT_DIR}" && \
  BASE_SHA="${BASE_SHA}" \
  HEAD_SHA="${HEAD_SHA}" \
  TARGET_BRANCH="${TARGET_BRANCH}" \
  DEFAULT_BRANCH="${DEFAULT_BRANCH}" \
  node run.js)

