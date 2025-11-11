#!/bin/bash

echo "🔧 MANGU Publishing - Quick Fix Script"
echo "======================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Run this script from the project root${NC}"
    exit 1
fi

echo "📋 Step 1: Installing Yarn (needed for workspace)"
if ! command -v yarn &> /dev/null; then
    echo "   Installing yarn globally..."
    npm install -g yarn
    echo -e "${GREEN}   ✅ Yarn installed${NC}"
else
    echo -e "${GREEN}   ✅ Yarn already installed${NC}"
fi

echo ""
echo "📋 Step 2: Installing dependencies with Yarn"
yarn install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ Dependencies installed${NC}"
else
    echo -e "${RED}   ❌ Dependency installation failed${NC}"
    exit 1
fi

echo ""
echo "📋 Step 3: Verifying server can start"
echo "   Testing database connection..."
psql -d mangu -c "SELECT 1" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ Database accessible${NC}"
else
    echo -e "${YELLOW}   ⚠️  Database not running - start PostgreSQL first${NC}"
fi

echo ""
echo "📋 Step 4: Checking vite installation"
if [ -f "node_modules/.bin/vite" ]; then
    echo -e "${GREEN}   ✅ Vite installed correctly${NC}"
else
    echo -e "${YELLOW}   ⚠️  Vite not found in node_modules/.bin/${NC}"
    echo "   Attempting to fix..."
    yarn workspace mangu-client add -D vite@^4.5.14
fi

echo ""
echo "========================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "🚀 To start the application:"
echo ""
echo "   Option 1 - Both at once:"
echo "   $ yarn dev"
echo ""
echo "   Option 2 - Separate terminals:"
echo "   Terminal 1: $ ./start-server.sh"
echo "   Terminal 2: $ cd client && npm run dev"
echo ""
echo "📡 Server will be at: http://localhost:3001"
echo "🌐 Client will be at: http://localhost:5173"
echo ""
echo "📖 See DEEP_DIVE_FIX.md for detailed analysis"
