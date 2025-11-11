# Create New Notion Integration

## Quick Steps:

1. **Go to**: https://www.notion.so/my-integrations
2. **Click**: "+ New integration"
3. **Name it**: `MANGU Publishing` (or any name you'll remember)
4. **Select workspace**: Choose your workspace
5. **Click**: "Submit"
6. **Copy the token**: It starts with `secret_` or `ntn_`
7. **Update your .env**:
   ```bash
   # Replace the old API key with the new one
   sed -i '' 's/^NOTION_API_KEY=.*/NOTION_API_KEY=YOUR_NEW_TOKEN_HERE/' server/.env
   ```
8. **Share your database**:
   - Open: https://www.notion.so/cc324cc3822b4144959b8c5eb7f32d77
   - Click "Share" → "Invite" → Look for "MANGU Publishing"
   - Add it

Then run: `npm run verify-notion`

