#!/bin/bash
set -e

# Deploy Custom Error Pages to S3/CloudFront
# Usage: ./deploy-error-pages.sh [environment]

ENVIRONMENT="${1:-production}"
REGION="${AWS_REGION:-us-east-1}"
PROJECT_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
CLIENT_PUBLIC="$PROJECT_ROOT/client/public"

echo "📄 Deploying Custom Error Pages"
echo "================================"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo ""

# Get S3 bucket name from Terraform output
cd "$(dirname "$0")/.."
BUCKET_NAME=$(terraform output -raw static_assets_bucket_name 2>/dev/null || echo "")

if [ -z "$BUCKET_NAME" ]; then
    echo "❌ Error: Could not get static assets bucket name"
    echo "   Make sure Terraform has been applied"
    exit 1
fi

echo "Bucket: $BUCKET_NAME"
echo ""

# Check if error pages exist
if [ ! -f "$CLIENT_PUBLIC/error.html" ]; then
    echo "❌ Error: error.html not found at $CLIENT_PUBLIC/error.html"
    exit 1
fi

if [ ! -f "$CLIENT_PUBLIC/maintenance.html" ]; then
    echo "❌ Error: maintenance.html not found at $CLIENT_PUBLIC/maintenance.html"
    exit 1
fi

# Upload error pages
echo "Uploading error.html..."
aws s3 cp "$CLIENT_PUBLIC/error.html" "s3://$BUCKET_NAME/error.html" \
    --content-type "text/html" \
    --cache-control "max-age=300" \
    --metadata-directive REPLACE

echo "Uploading maintenance.html..."
aws s3 cp "$CLIENT_PUBLIC/maintenance.html" "s3://$BUCKET_NAME/maintenance.html" \
    --content-type "text/html" \
    --cache-control "max-age=60" \
    --metadata-directive REPLACE

echo ""
echo "✅ Error pages deployed successfully"
echo ""
echo "Test URLs:"
echo "  https://your-domain.com/error.html"
echo "  https://your-domain.com/maintenance.html"
