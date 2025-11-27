#!/bin/bash
set -euo pipefail

# Image promotion script
# Usage: ./promote.sh --environment production

AWS_REGION="${AWS_REGION:-us-west-2}"
PROJECT_NAME="mangu-publishing"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

# Parse arguments
ENVIRONMENT=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

if [[ -z "$ENVIRONMENT" ]]; then
    echo "Usage: $0 --environment <production|staging>"
    exit 1
fi

log "🚀 Promoting images for environment: $ENVIRONMENT"

# This script is typically called from GitHub Actions with ECR credentials already configured
# Add your promotion logic here based on environment

case "$ENVIRONMENT" in
    production)
        log "Production promotion logic"
        # Tag images as stable and production-timestamped
        ;;
    staging)
        log "Staging auto-promotion logic"
        # Tag images as staging
        ;;
    *)
        log "Unknown environment: $ENVIRONMENT"
        exit 1
        ;;
esac

log "✅ Promotion complete"
