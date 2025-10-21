#!/bin/bash
# Master Credentials Launcher - Loads all secrets at once

echo "🔐 Loading environment credentials..."

# Local Credentials (contains all real secrets)
if [[ -f "scripts/credentials/local.sh" ]]; then
    source scripts/credentials/local.sh
    echo "✅ Local credentials loaded (GitHub, AWS, etc.)"
elif [[ -f "scripts/credentials/github.sh" ]]; then
    # Fallback to old github.sh for backwards compatibility
    source scripts/credentials/github.sh
    echo "✅ GitHub credentials loaded (legacy)"
    echo "⚠️  Consider migrating to local.sh (see scripts/credentials/github.sh.example)"
fi

# AWS Credentials (placeholder for future)
if [[ -f "scripts/credentials/aws.sh" ]]; then
    source scripts/credentials/aws.sh
    echo "✅ AWS credentials loaded"
fi

# Database Credentials (placeholder for future)
if [[ -f "scripts/credentials/database.sh" ]]; then
    source scripts/credentials/database.sh
    echo "✅ Database credentials loaded"
fi

# Redis Credentials (placeholder for future)
if [[ -f "scripts/credentials/redis.sh" ]]; then
    source scripts/credentials/redis.sh
    echo "✅ Redis credentials loaded"
fi

# Stripe Credentials (placeholder for future)
if [[ -f "scripts/credentials/stripe.sh" ]]; then
    source scripts/credentials/stripe.sh
    echo "✅ Stripe credentials loaded"
fi

echo "🎯 All available credentials loaded and ready!"
