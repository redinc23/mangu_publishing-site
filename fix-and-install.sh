#!/usr/bin/env bash
set -e

echo "🔧 Fixing npm cache permissions and installing dependencies..."
echo ""

# Fix npm cache permissions
echo "1. Fixing npm cache..."
sudo chown -R $(whoami) "$HOME/.npm"

# Clean npm cache
echo "2. Cleaning npm cache..."
npm cache clean --force

# Install root dependencies
echo "3. Installing root dependencies..."
npm install

# Install server dependencies
echo "4. Installing server dependencies..."
cd server && npm install && cd ..

# Install client dependencies
echo "5. Installing client dependencies..."
cd client && npm install && cd ..

echo ""
echo "✅ All done! Dependencies installed successfully."
echo ""
echo "🚀 Now you can run:"
echo "   ./start-all.sh"
echo ""

