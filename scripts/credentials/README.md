# Credentials Setup

## Quick Start

### First Time Setup

1. **Create your local credentials file:**
   ```bash
   cp scripts/credentials/github.sh.example scripts/credentials/local.sh
   ```

2. **Edit `local.sh` with your real credentials:**
   ```bash
   nano scripts/credentials/local.sh
   # or use your preferred editor
   ```

3. **Add your secrets:**
   - GitHub Personal Access Token
   - AWS credentials
   - API keys
   - etc.

### Daily Usage

Before running any Git operations or deployment commands, load your credentials:

```bash
# Load all credentials
source scripts/launch_credentials.sh

# Or load directly
source scripts/credentials/local.sh
```

## File Structure

- **`local.sh`** - Your real secrets (gitignored, NEVER committed)
- **`github.sh.example`** - Template with placeholders (safe to commit)
- **`github.sh`** - Legacy file (deprecated, use `local.sh` instead)

## Security

- All credential files are `.gitignore`d
- Permissions are set to 600 (read/write for owner only)
- NEVER commit these files to version control

## For AI Agents

If you need credentials to proceed with any operation, run:
```bash
source scripts/credentials/github.sh
```

This will set the required environment variables for GitHub operations.
