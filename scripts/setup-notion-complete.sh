#!/bin/bash
set -e

echo "🚀 Automated Notion AI Setup"
echo "============================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

ENV_FILE="server/.env"

# Create .env if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${BLUE}Creating server/.env file...${NC}"
    touch "$ENV_FILE"
    echo "# Notion AI Integration" >> "$ENV_FILE"
    echo "" >> "$ENV_FILE"
fi

echo -e "${BLUE}Step 1: Checking dependencies...${NC}"
cd server
if ! npm list @notionhq/client > /dev/null 2>&1; then
    echo -e "${YELLOW}Installing @notionhq/client...${NC}"
    npm install @notionhq/client
fi
cd ..

echo -e "${GREEN}✅ Dependencies checked${NC}"
echo ""

echo -e "${BLUE}Step 2: Opening Notion integration page...${NC}"
echo "Please:"
echo "  1. Copy your API key (starts with 'secret_')"
echo "  2. Create a database and share it with your integration"
echo "  3. Copy the Database ID from the URL"
echo ""

# Try to open browser (works on macOS, Linux, Windows)
if command -v open > /dev/null; then
    open "https://www.notion.so/my-integrations" 2>/dev/null || true
elif command -v xdg-open > /dev/null; then
    xdg-open "https://www.notion.so/my-integrations" 2>/dev/null || true
elif command -v start > /dev/null; then
    start "https://www.notion.so/my-integrations" 2>/dev/null || true
fi

echo -e "${YELLOW}Waiting for you to get your credentials...${NC}"
echo ""
read -p "Enter your Notion API Key (or press Enter to skip): " API_KEY

if [ -n "$API_KEY" ]; then
    # Remove existing
    sed -i.bak '/^NOTION_API_KEY=/d' "$ENV_FILE" 2>/dev/null || sed -i '/^NOTION_API_KEY=/d' "$ENV_FILE" 2>/dev/null || true
    echo "NOTION_API_KEY=$API_KEY" >> "$ENV_FILE"
    echo -e "${GREEN}✅ API key saved${NC}"
else
    echo -e "${YELLOW}⚠️  Skipped API key${NC}"
fi

echo ""
read -p "Enter your Notion Database ID (or press Enter to skip): " DB_ID

if [ -n "$DB_ID" ]; then
    # Remove existing
    sed -i.bak '/^NOTION_DATABASE_ID=/d' "$ENV_FILE" 2>/dev/null || sed -i '/^NOTION_DATABASE_ID=/d' "$ENV_FILE" 2>/dev/null || true
    echo "NOTION_DATABASE_ID=$DB_ID" >> "$ENV_FILE"
    echo -e "${GREEN}✅ Database ID saved${NC}"
else
    echo -e "${YELLOW}⚠️  Skipped Database ID${NC}"
fi

echo ""
echo -e "${BLUE}Step 3: Verifying setup...${NC}"
npm run verify-notion

echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo "Next: Start your server with 'cd server && npm run dev'"
