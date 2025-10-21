# Project Context for AI Agents

## Required Setup for All Operations

### Credentials

**ALWAYS** load credentials before performing Git operations, deployments, or AWS interactions:

```bash
source scripts/credentials/github.sh
```

Or load all credentials:
```bash
source scripts/launch_credentials.sh
```

This sets the following environment variables:
- `GITHUB_USER`
- `GITHUB_TOKEN`
- `GITHUB_EMAIL`

### Available Credentials Files

- `scripts/credentials/github.sh` - GitHub authentication
- `scripts/credentials/aws.sh` - AWS credentials (when created)
- `scripts/credentials/database.sh` - Database credentials (when created)
- `scripts/credentials/redis.sh` - Redis credentials (when created)

## Common Operations

### Git Operations
```bash
source scripts/credentials/github.sh && git push
```

### Deployments
```bash
source scripts/launch_credentials.sh && ./scripts/deploy_now.sh
```

## Security Notes

- All credential files are in `.gitignore`
- Permissions are locked to 600/700
- Never commit credentials to version control
