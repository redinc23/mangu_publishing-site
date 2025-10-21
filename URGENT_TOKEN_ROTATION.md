# 🚨 URGENT: Rotate GitHub Personal Access Token

**Date**: October 18, 2025
**Status**: ⚠️ **ACTION REQUIRED**

---

## Background

Your GitHub Personal Access Token was previously stored in a file that may have been exposed. While the file has been removed and is now properly gitignored, **you must rotate this token immediately**.

---

## Steps to Rotate

### 1. Revoke the Old Token

1. Go to: https://github.com/settings/tokens
2. Find your exposed token (check your `scripts/credentials/local.sh` file for the current one)
3. Click **"Delete"** or **"Revoke"**

### 2. Generate a New Token

1. Go to: https://github.com/settings/tokens/new
2. **Name**: `MacBook Development - Oct 2025`
3. **Expiration**: 90 days (recommended)
4. **Scopes** - Select:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
   - ✅ `read:org` (Read org and team membership - optional)
5. Click **"Generate token"**
6. **COPY THE TOKEN** immediately (you won't see it again!)

### 3. Update Your Local Credentials

```bash
# Edit your local credentials file
nano scripts/credentials/local.sh

# Replace the old token with your new one:
export GITHUB_TOKEN="ghp_YOUR_NEW_TOKEN_HERE"

# Save and close (Ctrl+X, Y, Enter)
```

### 4. Test the New Token

```bash
# Load the new credentials
source scripts/credentials/local.sh

# Test with a simple git operation
git fetch

# If successful, you're all set!
```

---

## Why This Is Important

- The old token may have been exposed in git history or logs
- Anyone with the token can access your repositories
- Rotating immediately limits the window of potential misuse
- This is a security best practice

---

## Verification Checklist

- [ ] Old token revoked at https://github.com/settings/tokens
- [ ] New token generated with proper scopes
- [ ] New token added to `scripts/credentials/local.sh`
- [ ] Tested with `source scripts/credentials/local.sh && git fetch`
- [ ] Old token no longer works

---

## After Rotation

Once you've rotated the token:

1. Delete this reminder file:
   ```bash
   rm URGENT_TOKEN_ROTATION.md
   ```

2. Set a calendar reminder to rotate again in 90 days

3. Continue with normal development

---

**Current Token Location**: Check `scripts/credentials/local.sh` (gitignored)

**Last Updated**: October 18, 2025
