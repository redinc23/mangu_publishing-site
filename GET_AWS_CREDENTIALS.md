# 🔐 Get AWS Credentials - Step by Step Guide

## Before You Start
- ☐ Have your AWS account ready (sign up at https://aws.amazon.com/free if needed)
- ☐ Browser open to https://console.aws.amazon.com
- ☐ This guide open next to your browser

---

## Step 1: Open IAM Service

1. Sign in to AWS Console: https://console.aws.amazon.com
2. In the search bar at the top, type **"IAM"**
3. Click on **"IAM"** (Identity and Access Management)

**You should see the IAM Dashboard**

---

## Step 2: Create a New User

1. In the left sidebar, click **"Users"**
2. Click the **"Create user"** button (orange button, top right)

**Enter user details:**
- **User name**: `mangu-publishing-app`
- ☑ Check **"Provide user access to the AWS Management Console"** (optional, but useful)
- Click **"Next"**

---

## Step 3: Set Permissions

**Option A: Use Policies Directly (Recommended for Development)**

1. Select **"Attach policies directly"**
2. Search and check these policies:
   - ☑ `AmazonDynamoDBFullAccess`
   - ☑ `AmazonS3FullAccess`
   - ☑ `AmazonSESFullAccess`
   - ☑ `AmazonCognitoPowerUser`
3. Click **"Next"**

**Option B: Create Custom Policy (Recommended for Production)**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:*",
        "s3:*",
        "ses:*",
        "cognito-idp:*"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## Step 4: Review and Create

1. Review your settings
2. Click **"Create user"**

**✅ User created successfully!**

---

## Step 5: Create Access Keys

This is the most important part - pay close attention!

1. Click on the user name you just created (`mangu-publishing-app`)
2. Click the **"Security credentials"** tab
3. Scroll down to **"Access keys"** section
4. Click **"Create access key"**

**Select use case:**
- Choose **"Application running outside AWS"**
- Click **"Next"**

**Set description (optional):**
- Description tag: `Mangu Publishing Development`
- Click **"Create access key"**

---

## Step 6: SAVE YOUR CREDENTIALS! ⚠️

**YOU WILL ONLY SEE THESE ONCE!**

You'll see a screen with:
- **Access key ID**: Something like `AKIAIOSFODNN7EXAMPLE`
- **Secret access key**: Something like `wJalrXUtnFEMI/K7MDENG/bPxRfiCY`

### Save them now:

**Option 1: Download CSV (Safest)**
- Click **"Download .csv file"**
- Save it somewhere secure (like your password manager)

**Option 2: Copy to Clipboard**
- Copy **Access key ID** → paste in notepad
- Copy **Secret access key** → paste in notepad
- ⚠️ Keep this file secure and don't share it!

**Click "Done"**

---

## Step 7: Add Credentials to Your App

Now let's add these to your project!

### For Server (.env file):

1. Open: `/Users/redinc23gmail.com/projects/mangu2-publishing/server/.env`
2. Find these lines:
```bash
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_HERE
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY_HERE
```

3. Replace with your actual credentials:
```bash
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCY
```

**Save the file!**

---

## Step 8: Verify Setup

### Test Connection:

Open terminal and run:
```bash
cd /Users/redinc23gmail.com/projects/mangu2-publishing

# Test if AWS credentials work
node -e "console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID?.substring(0,5) + '...')"
```

---

## Additional AWS Services Setup (Optional)

### 📦 Create S3 Bucket (for file storage)

1. Go to S3 in AWS Console
2. Click **"Create bucket"**
   - Bucket name: `mangu-media-dev-YOUR_NAME` (must be globally unique)
   - Region: `us-east-1`
   - Uncheck "Block all public access" if you need public files
3. Click **"Create bucket"**
4. Update `server/.env`:
   ```bash
   S3_BUCKET_MEDIA=mangu-media-dev-YOUR_NAME
   ```

### 👤 Create Cognito User Pool (for authentication)

1. Go to Cognito in AWS Console
2. Click **"Create user pool"**
3. **Step 1: Configure sign-in**
   - Sign-in options: ☑ Email
   - Click "Next"
4. **Step 2: Security requirements**
   - Password policy: Use defaults
   - MFA: No MFA (for dev)
   - Click "Next"
5. **Step 3: Configure sign-up**
   - Self-registration: Enabled
   - Required attributes: ☑ Email
   - Click "Next"
6. **Step 4: Configure message delivery**
   - Email provider: Send email with Cognito
   - Click "Next"
7. **Step 5: Integrate your app**
   - User pool name: `mangu-users-dev`
   - App client name: `mangu-web-client`
   - Click "Next"
8. **Step 6: Review and create**
   - Click "Create user pool"

**After creation:**
1. Copy the **User Pool ID** (e.g., `us-east-1_abc123XYZ`)
2. Go to "App integration" tab
3. Copy the **Client ID** (e.g., `1abc2def3ghi4jkl5mno6pqr`)

**Update your .env files:**

`server/.env`:
```bash
COGNITO_USER_POOL_ID=us-east-1_abc123XYZ
COGNITO_APP_CLIENT_ID=1abc2def3ghi4jkl5mno6pqr
```

`client/.env`:
```bash
VITE_COGNITO_USER_POOL_ID=us-east-1_abc123XYZ
VITE_COGNITO_CLIENT_ID=1abc2def3ghi4jkl5mno6pqr
```

### 📊 Create DynamoDB Tables (if using DynamoDB)

1. Go to DynamoDB in AWS Console
2. Click **"Create table"**

**Create these tables:**

**Table 1: Books**
- Table name: `Books`
- Partition key: `id` (String)
- Click "Create table"

**Table 2: Users**
- Table name: `Users`  
- Partition key: `id` (String)
- Click "Create table"

**Table 3: Orders**
- Table name: `Orders`
- Partition key: `id` (String)
- Sort key: `userId` (String)
- Click "Create table"

---

## ✅ Checklist

Before starting your app, make sure:

- ☐ IAM user created
- ☐ Access keys generated and saved
- ☐ `AWS_ACCESS_KEY_ID` added to `server/.env`
- ☐ `AWS_SECRET_ACCESS_KEY` added to `server/.env`
- ☐ S3 bucket created (optional)
- ☐ Cognito user pool created (optional)
- ☐ DynamoDB tables created (optional)

---

## 🚀 Start Your App!

Once credentials are added:

```bash
./start-all.sh
```

Your app will now connect to AWS services! 🎉

---

## 🆘 Troubleshooting

### "Access Denied" Error
- Check that IAM policies are attached to user
- Verify credentials are copied correctly (no extra spaces)
- Make sure AWS_REGION is set to `us-east-1`

### "Cannot find credentials" Error
- Make sure `.env` file has no typos in variable names
- Restart your server after adding credentials
- Check that `.env` file is in the correct location

### Region Mismatch
- All services must be in the same region (`us-east-1`)
- Check `AWS_REGION` in your `.env` file

---

## 📚 What's Next?

1. **Test AWS Connection**: Run your app and check logs
2. **Create Resources**: Set up S3, Cognito, DynamoDB as needed
3. **Deploy**: When ready, use same process for production credentials

---

**Need help?** The AWS SDK will show specific error messages if something is wrong. Check the server logs when you start the app!

