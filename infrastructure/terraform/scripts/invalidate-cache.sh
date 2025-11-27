#!/bin/bash
set -e

# CloudFront Cache Invalidation Script
# Usage: ./invalidate-cache.sh [paths] [environment]
# Examples:
#   ./invalidate-cache.sh "/*" production          # Invalidate everything
#   ./invalidate-cache.sh "/static/*" production   # Invalidate static assets
#   ./invalidate-cache.sh "/api/* /assets/*" prod  # Multiple paths

PATHS="${1:-/*}"
ENVIRONMENT="${2:-production}"
REGION="${AWS_REGION:-us-east-1}"

echo "🔄 CloudFront Cache Invalidation"
echo "================================="
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo "Paths: $PATHS"
echo ""

# Get distribution ID from Terraform output
cd "$(dirname "$0")/.."
DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null || echo "")

if [ -z "$DISTRIBUTION_ID" ]; then
    echo "❌ Error: Could not get CloudFront distribution ID"
    echo "   Make sure Terraform has been applied"
    exit 1
fi

echo "Distribution ID: $DISTRIBUTION_ID"
echo ""

# Create invalidation
echo "Creating invalidation..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths $PATHS \
    --query 'Invalidation.Id' \
    --output text)

if [ $? -eq 0 ]; then
    echo "✅ Invalidation created successfully"
    echo "   Invalidation ID: $INVALIDATION_ID"
    echo ""
    echo "Monitor progress:"
    echo "  aws cloudfront get-invalidation --distribution-id $DISTRIBUTION_ID --id $INVALIDATION_ID"
else
    echo "❌ Failed to create invalidation"
    exit 1
fi
