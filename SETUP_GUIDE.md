# Calendar Sync - Setup Guide

Step-by-step guide to get your Calendar Sync backend up and running.

---

## Step 1: Claude API Setup

### Get Your Claude API Key

1. **Go to Anthropic Console**: https://console.anthropic.com
2. **Sign in** or create an account
3. **Navigate to API Keys**: Click on "API Keys" in the left sidebar
4. **Create a new key**: Click "Create Key"
5. **Copy the key**: Save it securely - you won't see it again!

**What you'll need:**
- `ANTHROPIC_API_KEY=sk-ant-api03-...`

**Cost**: Pay as you go. Claude 3.5 Sonnet is ~$3 per million input tokens. For typical use (processing 20-50 emails/day), expect $5-10/month.

---

## Step 2: Gmail API Setup

This is the most complex setup but crucial for email access.

### 2.1 Create Google Cloud Project

1. **Go to Google Cloud Console**: https://console.cloud.google.com
2. **Create a new project**:
   - Click the project dropdown at the top
   - Click "New Project"
   - Name it "Calendar Sync" or similar
   - Click "Create"

### 2.2 Enable Gmail API

1. **Navigate to APIs & Services** > **Library**
2. **Search for "Gmail API"**
3. **Click on Gmail API** and click **"Enable"**

### 2.3 Configure OAuth Consent Screen

1. **Go to APIs & Services** > **OAuth consent screen**
2. **Select "External"** (unless you have a Google Workspace)
3. **Fill in required fields**:
   - App name: "Calendar Sync"
   - User support email: your email
   - Developer contact: your email
4. **Click "Save and Continue"**
5. **Scopes**: Click "Add or Remove Scopes"
   - Add: `https://www.googleapis.com/auth/gmail.readonly`
   - Click "Update" then "Save and Continue"
6. **Test users**: Add your Gmail address
7. **Click "Save and Continue"**, then **"Back to Dashboard"**

### 2.4 Create OAuth Credentials

1. **Go to APIs & Services** > **Credentials**
2. **Click "Create Credentials"** > **"OAuth client ID"**
3. **Application type**: "Desktop app" (for now)
4. **Name**: "Calendar Sync Desktop"
5. **Click "Create"**
6. **Download the JSON** (click the download icon)
7. **Save the Client ID and Client Secret**

**What you'll need:**
- `GMAIL_CLIENT_ID=xxxxx.apps.googleusercontent.com`
- `GMAIL_CLIENT_SECRET=GOCSPX-xxxxx`

### 2.5 Get Refresh Token

This is the tricky part. We need to run a one-time OAuth flow to get a refresh token.

**I'll create a helper script for you to run locally.**

---

## Step 3: Firebase Setup

Firebase provides push notifications for the iOS app.

### 3.1 Create Firebase Project

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Click "Add project"**
3. **Enter project name**: "Calendar Sync" or similar
4. **Disable Google Analytics** (optional for MVP)
5. **Click "Create project"**

### 3.2 Add iOS App (Later)

We'll do this when we create the iOS app. For now, we just need the backend credentials.

### 3.3 Enable Cloud Messaging

1. **In your Firebase project**, click the gear icon > **Project settings**
2. **Go to "Cloud Messaging" tab**
3. Firebase Cloud Messaging is enabled by default

### 3.4 Generate Service Account Key

1. **In Project settings**, go to **"Service accounts" tab**
2. **Click "Generate new private key"**
3. **Click "Generate key"** - downloads a JSON file
4. **Open the JSON file** and extract:
   - `project_id`
   - `client_email`
   - `private_key`

**What you'll need:**
- `FIREBASE_PROJECT_ID=calendar-sync-xxxxx`
- `FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@calendar-sync-xxxxx.iam.gserviceaccount.com`
- `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`

**Important**: The private key contains `\n` newline characters. Keep them as literal `\n` in your .env file.

---

## Step 4: Deploy to Vercel

### 4.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 4.2 Login to Vercel

```bash
vercel login
```

This will open a browser for authentication.

### 4.3 Deploy

```bash
cd backend
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- What's your project's name? **calendar-sync** (or similar)
- In which directory is your code located? **./** (current directory)
- Want to modify settings? **N**

This creates a preview deployment. To deploy to production:

```bash
vercel --prod
```

**Your backend will be live at**: `https://calendar-sync.vercel.app`

---

## Step 5: Set Up Vercel Postgres

### 5.1 Create Database

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project** (calendar-sync)
3. **Go to "Storage" tab**
4. **Click "Create Database"**
5. **Select "Postgres"**
6. **Choose a region** (closest to your users)
7. **Click "Create"**

Vercel will automatically add these environment variables to your project:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

### 5.2 Run Database Schema

1. **Install Vercel CLI** (if not already): `npm i -g vercel`
2. **Link your local project**: `vercel link`
3. **Connect to database**:

```bash
# Get your database URL
vercel env pull .env.local

# Install psql (if not installed)
# macOS: brew install postgresql
# Linux: sudo apt install postgresql-client

# Connect to database
source .env.local
psql $POSTGRES_URL
```

4. **Run the schema**:

```sql
-- Copy and paste the contents of backend/lib/database/schema.sql
-- Or run: \i backend/lib/database/schema.sql
```

---

## Step 6: Configure Environment Variables

### 6.1 Set Environment Variables in Vercel

You can set them via CLI or Dashboard.

**Via CLI**:

```bash
vercel env add ANTHROPIC_API_KEY production
# Paste your Claude API key when prompted

vercel env add GMAIL_CLIENT_ID production
# Paste your Gmail client ID

vercel env add GMAIL_CLIENT_SECRET production
# Paste your Gmail client secret

vercel env add GMAIL_REFRESH_TOKEN production
# Paste your Gmail refresh token (we'll get this in Step 7)

vercel env add FIREBASE_PROJECT_ID production
# Paste your Firebase project ID

vercel env add FIREBASE_CLIENT_EMAIL production
# Paste your Firebase client email

vercel env add FIREBASE_PRIVATE_KEY production
# Paste your Firebase private key (with \n characters)
```

**Via Dashboard**:

1. Go to your project on Vercel
2. Click "Settings" > "Environment Variables"
3. Add each variable with:
   - Name: e.g., `ANTHROPIC_API_KEY`
   - Value: your actual key
   - Environment: Production (and Preview if you want)

### 6.2 Redeploy

After adding environment variables:

```bash
vercel --prod
```

This ensures your latest deployment has all the environment variables.

---

## Step 7: Get Gmail Refresh Token

We need to run a one-time OAuth flow to get a refresh token.

### Create OAuth Helper Script

I'll create a script for you to run locally.

---

## Step 8: Test Your Deployment

### 8.1 Test Health Endpoint

```bash
curl https://your-app.vercel.app/api/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-11-05T..."
  },
  "timestamp": "2025-11-05T..."
}
```

### 8.2 Create Test User

Connect to your database and create a test user:

```sql
INSERT INTO users (email) VALUES ('your-email@gmail.com');
```

Get the user ID:

```sql
SELECT id FROM users WHERE email = 'your-email@gmail.com';
```

### 8.3 Create User Preferences

```sql
INSERT INTO user_preferences (user_id, enable_gmail, enable_icloud)
VALUES ('your-user-id-here', true, false);
```

### 8.4 Test Message Processing

```bash
curl "https://your-app.vercel.app/api/process-messages?userId=your-user-id-here"
```

This should fetch your recent Gmail messages and extract events!

---

## Troubleshooting

### Gmail API 401 Unauthorized
- Verify OAuth credentials are correct
- Ensure refresh token is valid
- Check that Gmail API is enabled in Google Cloud Console

### Claude API 401 Unauthorized
- Verify API key is correct
- Check you have credits/billing set up at console.anthropic.com

### Firebase Errors
- Verify service account JSON is correct
- Check private key formatting (keep `\n` as literal characters)

### Database Connection Issues
- Verify Vercel Postgres is created and linked
- Check that environment variables are set in Vercel
- Ensure schema has been run

---

## Cost Estimates

**Monthly costs for moderate use (50 emails/day)**:

- **Vercel**: Free tier (Hobby) covers this easily
- **Vercel Postgres**: Free tier (60 hours compute)
- **Claude API**: ~$5-10/month
- **Firebase**: Free tier (generous limits)
- **Google Cloud (Gmail API)**: Free (well within quotas)

**Total**: ~$5-10/month on free tiers + Claude API usage

---

## Security Checklist

- [ ] Never commit `.env` files
- [ ] Store OAuth refresh tokens securely
- [ ] Use environment variables for all secrets
- [ ] Enable 2FA on all accounts (Google, Anthropic, Vercel, Firebase)
- [ ] Regularly rotate API keys
- [ ] Monitor API usage for anomalies

---

## Next Steps

Once your backend is deployed and tested:

1. **Build the iOS app** - SwiftUI app that uses these API endpoints
2. **Add iCloud Mail support** - Similar to Gmail integration
3. **Set up automated polling** - Cron job to process messages every 5 minutes
4. **Add iMessage support** (Phase 2)

---

## Support

If you run into issues:
- Check the troubleshooting section
- Review the backend/README.md
- Check Vercel deployment logs
- Review API documentation for each service

