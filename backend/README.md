# Calendar Sync Backend

Backend service for Calendar Sync - extracts calendar events from emails using Claude AI.

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Gmail API Credentials

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Name it "Calendar Sync" or similar

#### Step 2: Enable Gmail API
1. In your project, go to **APIs & Services > Library**
2. Search for "Gmail API"
3. Click **Enable**

#### Step 3: Create OAuth Credentials
1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - User Type: **External** (unless you have a Google Workspace)
   - App name: "Calendar Sync"
   - User support email: your email
   - Developer contact: your email
   - Scopes: Add `gmail.readonly` and `gmail.metadata`
   - Test users: Add your Gmail address
   - Click **Save and Continue**

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: "Calendar Sync Backend"
   - Authorized redirect URIs:
     - For local dev: `http://localhost:3000/api/auth/callback`
     - For production: `https://your-vercel-app.vercel.app/api/auth/callback`
   - Click **Create**

5. **Save your credentials:**
   - Copy the **Client ID**
   - Copy the **Client Secret**

#### Step 4: Get Refresh Token
We need to get a refresh token by going through the OAuth flow once:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Gmail credentials:
   ```bash
   GMAIL_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   GMAIL_CLIENT_SECRET=your_client_secret_here
   GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/callback
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

4. Visit the auth endpoint:
   ```
   http://localhost:3000/api/auth/gmail
   ```

5. You'll be redirected to Google's consent screen
6. Grant permissions
7. You'll be redirected back and see your **refresh token** in the response
8. Copy the refresh token and add it to `.env`:
   ```bash
   GMAIL_REFRESH_TOKEN=your_refresh_token_here
   ```

### 3. Set Up Claude API

1. Get your API key from [Anthropic Console](https://console.anthropic.com/)
2. Add to `.env`:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-your-api-key-here
   ```

### 4. Test Gmail Connection

Run the test script:
```bash
node src/test-gmail.js
```

This will fetch your 5 most recent unread emails and display them.

## Project Structure

```
backend/
├── api/                    # Vercel serverless functions
│   ├── auth/
│   │   ├── gmail.js       # OAuth initiation endpoint
│   │   └── callback.js    # OAuth callback endpoint
│   ├── poll-messages.js   # Scheduled message polling
│   └── process-event.js   # Process event approval/rejection
├── src/
│   ├── services/
│   │   ├── gmail.js       # Gmail API service
│   │   ├── claude.js      # Claude API service (TODO)
│   │   └── firebase.js    # Firebase messaging (TODO)
│   └── utils/
│       └── db.js          # Database utilities (TODO)
├── package.json
├── vercel.json
├── tsconfig.json
└── .env                   # Your local environment variables (not in git)
```

## Next Steps

- [ ] Set up Gmail API credentials ✓
- [ ] Get refresh token ✓
- [ ] Test Gmail message retrieval ✓
- [ ] Create Claude service
- [ ] Create message polling endpoint
- [ ] Set up Firebase Cloud Messaging
- [ ] Set up Vercel Postgres database
- [ ] Deploy to Vercel

## Development

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Deploy to Vercel
vercel --prod
```

## Environment Variables

See `.env.example` for all required environment variables.

### Required for MVP:
- `GMAIL_CLIENT_ID` - Google OAuth client ID
- `GMAIL_CLIENT_SECRET` - Google OAuth client secret
- `GMAIL_REDIRECT_URI` - OAuth redirect URI
- `GMAIL_REFRESH_TOKEN` - OAuth refresh token
- `ANTHROPIC_API_KEY` - Claude API key

### Required for Phase 2:
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_PRIVATE_KEY` - Firebase service account private key
- `FIREBASE_CLIENT_EMAIL` - Firebase service account email
- `DATABASE_URL` - Vercel Postgres connection string
