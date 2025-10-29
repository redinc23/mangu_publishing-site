#!/usr/bin/env bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║      AWS Credentials Setup for Mangu Publishing     ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

echo -e "${YELLOW}📖 Full guide available in: GET_AWS_CREDENTIALS.md${NC}"
echo ""

# Check if .env file exists
if [ ! -f "server/.env" ]; then
    echo -e "${RED}❌ server/.env file not found!${NC}"
    exit 1
fi

echo -e "${BLUE}Current AWS Configuration in server/.env:${NC}"
echo ""
grep -E "AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|AWS_REGION" server/.env || echo "No AWS configuration found"
echo ""

echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}   Follow these steps to get your AWS credentials:${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo ""

echo "1️⃣  Go to: ${BLUE}https://console.aws.amazon.com${NC}"
echo "2️⃣  Search for: ${BLUE}IAM${NC} in the search bar"
echo "3️⃣  Click: ${BLUE}Users${NC} → ${BLUE}Create user${NC}"
echo "4️⃣  User name: ${BLUE}mangu-publishing-app${NC}"
echo "5️⃣  Attach policies:"
echo "    - AmazonDynamoDBFullAccess"
echo "    - AmazonS3FullAccess"
echo "    - AmazonSESFullAccess"
echo "    - AmazonCognitoPowerUser"
echo "6️⃣  Create access key → Choose 'Application running outside AWS'"
echo "7️⃣  ${RED}IMPORTANT:${NC} Download or copy the credentials NOW!"
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""

read -p "Have you created the IAM user and got your credentials? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}No problem! Follow the steps above first.${NC}"
    echo -e "${YELLOW}Run this script again when you have your credentials.${NC}"
    echo ""
    echo -e "${BLUE}📖 Detailed guide: cat GET_AWS_CREDENTIALS.md${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}Great! Let's add your credentials...${NC}"
echo ""

# Get Access Key ID
echo -e "${BLUE}Enter your AWS Access Key ID:${NC}"
echo "(It looks like: AKIAIOSFODNN7EXAMPLE)"
read -r AWS_KEY_ID

# Get Secret Access Key
echo ""
echo -e "${BLUE}Enter your AWS Secret Access Key:${NC}"
echo "(It's a long string - paste it carefully!)"
read -r AWS_SECRET_KEY

# Validate inputs
if [ -z "$AWS_KEY_ID" ] || [ -z "$AWS_SECRET_KEY" ]; then
    echo ""
    echo -e "${RED}❌ Credentials cannot be empty!${NC}"
    exit 1
fi

# Update server/.env file
echo ""
echo -e "${YELLOW}Updating server/.env...${NC}"

# Backup original
cp server/.env server/.env.backup

# Update the credentials
sed -i.tmp "s/AWS_ACCESS_KEY_ID=.*/AWS_ACCESS_KEY_ID=$AWS_KEY_ID/" server/.env
sed -i.tmp "s/AWS_SECRET_ACCESS_KEY=.*/AWS_SECRET_ACCESS_KEY=$AWS_SECRET_KEY/" server/.env
rm server/.env.tmp

echo -e "${GREEN}✅ Credentials added to server/.env${NC}"
echo -e "${YELLOW}📦 Backup saved as: server/.env.backup${NC}"
echo ""

# Show updated config (masked)
echo -e "${BLUE}Updated configuration:${NC}"
echo "AWS_ACCESS_KEY_ID=${AWS_KEY_ID:0:5}...${AWS_KEY_ID: -4}"
echo "AWS_SECRET_ACCESS_KEY=${AWS_SECRET_KEY:0:5}...****"
echo "AWS_REGION=$(grep AWS_REGION server/.env | cut -d= -f2)"
echo ""

# Test connection
echo -e "${YELLOW}Testing AWS connection...${NC}"
echo ""

# Create a simple test script
cat > /tmp/test-aws.mjs << 'EOF'
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

try {
  const command = new ListTablesCommand({});
  const response = await client.send(command);
  console.log("✅ AWS Connection successful!");
  console.log("📊 DynamoDB tables:", response.TableNames?.length || 0);
  if (response.TableNames?.length > 0) {
    console.log("   Tables:", response.TableNames.join(", "));
  }
} catch (error) {
  console.log("❌ Connection failed:", error.message);
  console.log("💡 This might be okay if you haven't created DynamoDB tables yet.");
}
EOF

# Source the .env and run test
export AWS_REGION=$(grep AWS_REGION server/.env | cut -d= -f2)
export AWS_ACCESS_KEY_ID="$AWS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$AWS_SECRET_KEY"

cd server && node /tmp/test-aws.mjs && cd ..

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}              🎉 Setup Complete! 🎉${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo "1️⃣  Start your app:"
echo "   ${YELLOW}./start-all.sh${NC}"
echo ""
echo "2️⃣  Set up additional AWS services (optional):"
echo "   - S3 Bucket (for file storage)"
echo "   - Cognito User Pool (for authentication)"
echo "   - DynamoDB Tables (if using DynamoDB)"
echo ""
echo "   📖 See: GET_AWS_CREDENTIALS.md for details"
echo ""
echo -e "${YELLOW}💡 Tip: Your credentials are in server/.env${NC}"
echo -e "${YELLOW}   Keep this file secure and don't commit it to git!${NC}"
echo ""

