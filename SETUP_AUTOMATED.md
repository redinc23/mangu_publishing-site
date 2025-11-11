# 🤖 Fully Automated Notion Setup

## Just Run This:

```bash
npm run setup-notion-auto
```

**That's it!** The script will:
1. ✅ Create `server/.env` file automatically
2. ✅ Install `@notionhq/client` package automatically  
3. ✅ Open Notion integrations page in your browser
4. ✅ Prompt you for credentials (just paste them)
5. ✅ Save everything automatically
6. ✅ Verify the setup works

## What You Need to Do:

The script opens Notion for you, but you still need to:
1. Click "+ New integration" in Notion
2. Copy the API key (starts with `secret_`)
3. Create a database and share it with your integration
4. Copy the Database ID from the URL

Then just paste them when the script asks!

## Other Commands:

```bash
# Verify your setup
npm run verify-notion

# Interactive setup (alternative)
npm run setup-notion

# Bash script version
npm run setup-notion-complete
```

## After Setup:

```bash
# Start server
cd server && npm run dev

# Check it works
curl http://localhost:5000/api/notion/status
```

That's it! The script does everything else for you. 🚀

