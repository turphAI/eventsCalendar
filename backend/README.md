# Calendar Sync - Backend

Backend service for Calendar Sync, an AI-powered calendar event extraction and notification system.

## Overview

This backend service:
- Fetches messages from Gmail and iCloud Mail
- Uses Claude AI to extract calendar event information
- Stores events in a PostgreSQL database
- Sends iOS push notifications via Firebase Cloud Messaging
- Provides REST API for the iOS app

## Tech Stack

- **Runtime**: Node.js 18+ / TypeScript
- **Deployment**: Vercel Functions (serverless)
- **Database**: Vercel Postgres (PostgreSQL)
- **AI**: Claude API (Anthropic)
- **Email**: Gmail API, iCloud Mail API
- **Notifications**: Firebase Cloud Messaging (FCM)

## Project Structure

```
backend/
├── api/                      # Vercel serverless functions (API endpoints)
│   ├── health.ts            # Health check endpoint
│   ├── process-messages.ts  # Process Gmail/iCloud messages
│   └── events/
│       ├── pending.ts       # Fetch pending events
│       └── update-status.ts # Update event status (approve/reject)
├── lib/                     # Shared libraries and utilities
│   ├── claude/
│   │   └── client.ts       # Claude API integration
│   ├── gmail/
│   │   └── client.ts       # Gmail API integration
│   ├── firebase/
│   │   └── notifications.ts # FCM push notifications
│   └── database/
│       ├── db.ts           # PostgreSQL client
│       └── schema.sql      # Database schema
├── types/
│   └── index.ts            # TypeScript type definitions
├── package.json
├── tsconfig.json
├── vercel.json             # Vercel deployment config
└── .env.example            # Environment variables template
```

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

You'll need to configure:
- **Claude API**: Get API key from https://console.anthropic.com
- **Gmail API**: Set up OAuth credentials in Google Cloud Console
- **Firebase**: Create a project and download service account credentials
- **Vercel Postgres**: Database will be created when you deploy to Vercel

### 3. Set Up Database

Once you have Vercel Postgres configured, run the schema:

```bash
# Connect to your Vercel Postgres database
psql $POSTGRES_URL

# Run the schema
\i lib/database/schema.sql
```

### 4. Gmail API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials (Desktop app)
5. Download credentials JSON
6. Run OAuth flow to get refresh token (see below)

**Getting Gmail Refresh Token:**

```javascript
// Run this script to get your refresh token
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'http://localhost:3000'
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/gmail.readonly'],
});

console.log('Visit this URL:', authUrl);
// After authorizing, exchange code for tokens
// oauth2Client.getToken(code) will give you refresh_token
```

### 5. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Cloud Messaging
4. Generate a service account key (Settings > Service Accounts)
5. Add credentials to `.env`

### 6. Run Locally

```bash
npm run dev
```

This starts Vercel Dev server on `http://localhost:3000`

## API Endpoints

### Health Check
```
GET /api/health
```

Returns service health status.

### Process Messages
```
GET /api/process-messages?userId={userId}
```

Fetches recent Gmail messages, extracts events with Claude, stores them, and sends notifications.

**Query Parameters:**
- `userId` (required): User ID

**Response:**
```json
{
  "success": true,
  "data": {
    "processed": 5,
    "events_found": 2
  },
  "timestamp": "2025-11-05T12:00:00Z"
}
```

### Get Pending Events
```
GET /api/events/pending?userId={userId}
```

Fetches all pending events awaiting user review.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "event-uuid",
      "title": "Team Lunch",
      "date": "2025-11-06",
      "time": "12:30 PM",
      "location": "Milano's",
      "confidence": "high",
      "status": "pending",
      "sourceMessage": "Email snippet...",
      "createdAt": "2025-11-05T12:00:00Z"
    }
  ],
  "timestamp": "2025-11-05T12:00:00Z"
}
```

### Update Event Status
```
POST /api/events/update-status
```

Updates event status when user approves/rejects/edits.

**Request Body:**
```json
{
  "userId": "user-uuid",
  "eventId": "event-uuid",
  "status": "approved",
  "editedData": {
    "title": "Updated Title",
    "time": "1:00 PM"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "eventId": "event-uuid",
    "status": "approved"
  },
  "timestamp": "2025-11-05T12:00:00Z"
}
```

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Set Environment Variables on Vercel

```bash
vercel env add ANTHROPIC_API_KEY
vercel env add GMAIL_CLIENT_ID
vercel env add FIREBASE_PROJECT_ID
# ... add all env vars
```

Or set them via Vercel Dashboard: Project Settings > Environment Variables

### Set Up Vercel Postgres

1. Go to your project on Vercel Dashboard
2. Navigate to Storage tab
3. Create a new Postgres database
4. Connection strings will be automatically added to your environment variables

## Database Schema

See `lib/database/schema.sql` for the full schema.

**Main Tables:**
- `users` - User accounts
- `user_preferences` - User settings and FCM tokens
- `messages` - Processed email messages
- `calendar_events` - Extracted calendar events
- `oauth_tokens` - Gmail/iCloud OAuth refresh tokens
- `event_processing_log` - Audit log for debugging

## Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

## Testing

### Test Claude Integration

Create a test message and extract event:

```bash
curl http://localhost:3000/api/process-messages?userId=test-user-id
```

### Test Notification

Send a test notification via Firebase console or create a pending event and verify notification delivery.

## Troubleshooting

### Gmail API 401 Unauthorized
- Check that refresh token is valid
- Ensure OAuth credentials are correct
- Re-run OAuth flow to get new refresh token

### Claude API Rate Limits
- API has rate limits (check Anthropic docs)
- Added 500ms delay between requests in `extractEventsFromMessages`
- Consider implementing exponential backoff

### Firebase Notification Not Received
- Verify FCM token is registered in `user_preferences` table
- Check iOS app has notification permissions enabled
- Test with Firebase console first

### Database Connection Issues
- Verify `POSTGRES_URL` is set correctly
- Check Vercel Postgres is provisioned
- Run schema if tables don't exist

## Next Steps

- [ ] Add iCloud Mail API integration
- [ ] Implement user authentication (OAuth or JWT)
- [ ] Add webhook support for real-time Gmail processing
- [ ] Implement rate limiting and caching
- [ ] Add comprehensive error handling
- [ ] Set up monitoring and logging (Sentry, LogRocket)
- [ ] Add unit and integration tests
- [ ] Implement batch processing for efficiency

## Resources

- [Vercel Functions Documentation](https://vercel.com/docs/functions)
- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [Claude API Documentation](https://docs.anthropic.com/)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

## License

MIT
