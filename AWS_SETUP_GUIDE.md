# AWS SDK Setup Guide for Mangu Publishing

## ✅ Current Status

Your AWS SDK is **already installed and configured**! Here's what you have:

### Installed AWS Packages:
```json
"@aws-sdk/client-dynamodb": "^3.400.0"
"@aws-sdk/lib-dynamodb": "^3.400.0"
"@aws-sdk/client-s3": "^3.400.0"
"@aws-sdk/client-ses": "^3.400.0"
```

### Configuration Files Ready:
- ✅ `server/src/config/dynamoDB.js` - DynamoDB client configured
- ✅ `server/.env` - AWS credentials placeholders ready
- ✅ `client/.env` - AWS Cognito placeholders ready

## 🔧 What You Need To Do

### Option A: Use AWS (Recommended for Production)

#### Step 1: Get AWS Credentials

1. **Sign in to AWS Console**: https://console.aws.amazon.com
2. **Create IAM User**:
   - Go to IAM → Users → Add User
   - User name: `mangu-publishing-dev`
   - Access type: ☑ Programmatic access
   - Permissions: Attach policies:
     - `AmazonDynamoDBFullAccess`
     - `AmazonS3FullAccess`
     - `AmazonSESFullAccess`
     - `AmazonCognitoPowerUser`
   - Save the **Access Key ID** and **Secret Access Key**

#### Step 2: Update server/.env

Edit `/Users/redinc23gmail.com/projects/mangu2-publishing/server/.env`:

```bash
# Replace these lines:
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_HERE
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY_HERE

# With your actual credentials:
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

#### Step 3: Set Up AWS Services

**DynamoDB Tables** (if using DynamoDB instead of PostgreSQL):
```bash
# Run this in your terminal
cd server
node scripts/setupTables.js
```

**S3 Buckets** (for file storage):
1. Go to S3 → Create bucket
2. Bucket name: `mangu-media-dev`
3. Region: `us-east-1`
4. Update in `server/.env`: `S3_BUCKET_MEDIA=mangu-media-dev`

**Cognito User Pool** (for authentication):
1. Go to Cognito → Manage User Pools → Create
2. Pool name: `mangu-users-dev`
3. Copy the Pool ID (e.g., `us-east-1_abc123xyz`)
4. Create App Client → Copy Client ID
5. Update both `.env` files with these values

### Option B: Use Local PostgreSQL (Simpler for Development)

If you don't want to set up AWS right now, you can use local PostgreSQL:

```bash
# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb mangu_db

# Run migrations
psql mangu_db < server/src/database/init.sql
psql mangu_db < server/src/database/seed.sql
```

Your `server/.env` already has PostgreSQL configured:
```env
DATABASE_URL=postgresql://mangu_user:local_dev_password@localhost:5432/mangu_db
```

### Option C: Disable AWS Features (Quickest Start)

To start the app without AWS or database:

**In `server/.env`, comment out or set empty:**
```env
# AWS Configuration (commented out)
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=

# Disable Redis
DISABLE_REDIS=1
```

Then modify `server/src/index.js` to skip database init (or handle the error gracefully).

## 🧪 Test Your AWS Setup

### Test DynamoDB Connection:
```bash
cd server
node -e "import('./src/config/dynamoDB.js').then(m => console.log('✅ DynamoDB connected!'))"
```

### Test S3 Connection:
```bash
cd server
# Create test file: test-s3.js
# Run: node test-s3.js
```

## 📋 Current Configuration Summary

### Server (.env):
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_HERE  ← NEEDS UPDATE
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY_HERE  ← NEEDS UPDATE

COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_CHANGEME  ← NEEDS UPDATE
COGNITO_APP_CLIENT_ID=CHANGEME  ← NEEDS UPDATE

S3_BUCKET_MEDIA=mangu-media-dev  ← NEEDS UPDATE (create bucket)
```

### Client (.env):
```env
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_CHANGEME  ← NEEDS UPDATE
VITE_COGNITO_CLIENT_ID=CHANGEME  ← NEEDS UPDATE
```

## 🚀 Quick Start (Without AWS Setup)

If you want to start the app immediately without AWS:

```bash
# 1. Use PostgreSQL (recommended)
brew install postgresql@15
brew services start postgresql@15
createdb mangu_db

# 2. Start the app
./start-all.sh
```

The app will use PostgreSQL for data and work without AWS features.

## 🎯 Recommended Development Flow

1. **Start Now**: Use PostgreSQL locally
2. **Test App**: Make sure everything works
3. **Add AWS Later**: When ready for production features

## 🆘 Need Help?

**AWS Credentials Issues:**
- Make sure IAM user has proper permissions
- Check credentials are copied correctly (no extra spaces)
- Verify region is set to `us-east-1`

**DynamoDB Issues:**
- Ensure tables are created
- Check AWS region matches
- Verify IAM permissions include DynamoDB

**Cognito Issues:**
- User Pool must be created first
- App Client must be created in the User Pool
- Copy IDs exactly (they're case-sensitive)

## ✅ Ready to Go!

Your AWS SDK is installed and ready. Choose your path:
- 🚀 **Quick**: Use PostgreSQL → `./start-all.sh`
- ☁️ **Production**: Set up AWS credentials → Update `.env` files
- 🔬 **Test**: Run without database → Modify error handling

---

**Next Step**: Choose one of the options above and start your app! 🎉

