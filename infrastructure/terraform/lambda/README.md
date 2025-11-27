# CloudFront Cache Invalidation Lambda

This Lambda function handles CloudFront cache invalidation triggered by SNS events.

## Build Requirements

Before running `terraform apply`, install Lambda dependencies:

```bash
cd infrastructure/terraform/lambda
npm install --production
```

This creates `node_modules/` with the required `@aws-sdk/client-cloudfront` package.

## Terraform Build Process

Terraform automatically packages the Lambda function using the `archive_file` data source:
- **Source**: `lambda/index.js`, `lambda/package.json`, and `lambda/node_modules/`
- **Output**: `lambda/.build/cache-invalidation.zip` (gitignored)
- **Trigger**: Terraform regenerates the zip when source files change

## Deployment

1. Install dependencies (one-time or when package.json changes):
   ```bash
   npm install --production
   ```

2. Apply Terraform:
   ```bash
   cd ../
   terraform init
   terraform plan
   terraform apply
   ```

The Lambda will be automatically updated when:
- `index.js` changes
- `package.json` changes
- Dependencies are updated

## Function Details

- **Runtime**: Node.js 18.x
- **Handler**: `index.handler`
- **Timeout**: 60 seconds
- **Trigger**: SNS topic for cache invalidation events
- **Permissions**: CloudFront invalidation, CloudWatch Logs

## Usage

Publish a message to the SNS topic to trigger invalidation:

```json
{
  "paths": ["/assets/*", "/index.html"],
  "type": "selective"
}
```

Or use default full invalidation by publishing an empty message.
