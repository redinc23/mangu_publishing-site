#!/bin/bash
# Scheduled Auto-Push Script
# Run this via cron or systemd timer

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTO_PUSH_SCRIPT="${SCRIPT_DIR}/auto-push.sh"
LOG_FILE="${SCRIPT_DIR}/../logs/auto-push.log"
LOCK_FILE="${SCRIPT_DIR}/../logs/auto-push.lock"

# Create logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log with timestamp
log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $*" | tee -a "$LOG_FILE"
}

# Function to check if already running
check_lock() {
  if [ -f "$LOCK_FILE" ]; then
    local pid=$(cat "$LOCK_FILE")
    if ps -p "$pid" > /dev/null 2>&1; then
      log "⚠️  Another instance is already running (PID: $pid)"
      exit 1
    else
      log "🧹 Removing stale lock file"
      rm -f "$LOCK_FILE"
    fi
  fi
  echo $$ > "$LOCK_FILE"
}

# Function to cleanup lock
cleanup() {
  rm -f "$LOCK_FILE"
}

# Set up trap for cleanup
trap cleanup EXIT

# Main execution
main() {
  log "🤖 Starting scheduled auto-push..."
  
  # Check lock
  check_lock
  
  # Run auto-push script
  if bash "$AUTO_PUSH_SCRIPT" >> "$LOG_FILE" 2>&1; then
    log "✅ Auto-push completed successfully"
  else
    log "❌ Auto-push failed with exit code $?"
    exit 1
  fi
  
  log "✅ Scheduled auto-push finished"
}

# Run main function
main "$@"

