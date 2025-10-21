#!/bin/bash
# Check if credentials are loaded, prompt to load if not

check_github_creds() {
    if [[ -z "$GITHUB_USER" ]] || [[ -z "$GITHUB_TOKEN" ]]; then
        echo "⚠️  GitHub credentials not loaded!"
        echo ""
        echo "Run this command first:"
        echo "  source scripts/credentials/github.sh"
        echo ""
        return 1
    fi
    echo "✅ GitHub credentials loaded"
    return 0
}

# Run check if script is executed (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    check_github_creds
fi
