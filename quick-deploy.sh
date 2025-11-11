#!/bin/bash

###############################################################################
# MANGU Publishing - Quick Deploy Script
# 
# For when you already have infrastructure and just want to deploy code
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Quick Deployment Script${NC}\n"

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

if [[ "$CURRENT_BRANCH" != "main" ]]; then
    echo -e "${YELLOW}⚠️  You're on branch: $CURRENT_BRANCH${NC}"
    read -p "Switch to main? [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout main
        git pull origin main
        echo -e "${GREEN}✅ Switched to main${NC}"
    fi
fi

# Get version
echo -e "${BLUE}Enter version tag (e.g., v1.0.1):${NC}"
read -p "Version: " VERSION

if [[ -z "$VERSION" ]]; then
    echo -e "${YELLOW}No version provided, using v1.0.0${NC}"
    VERSION="v1.0.0"
fi

# Confirm
echo -e "\n${YELLOW}This will:${NC}"
echo "  1. Create tag: $VERSION"
echo "  2. Push to GitHub"
echo "  3. Trigger deployment via GitHub Actions"
echo ""

read -p "Continue? [y/N]: " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cancelled${NC}"
    exit 0
fi

# Tag and push
git tag -a "$VERSION" -m "Deploy $VERSION" 2>/dev/null || echo "Tag exists"
git push origin "$VERSION"

echo -e "\n${GREEN}✅ Deployment triggered!${NC}"
echo -e "${BLUE}Watch progress: https://github.com/redinc23/mangu_publishing-site/actions${NC}\n"

