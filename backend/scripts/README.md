# Backend Scripts

Helper scripts for setting up and managing the Calendar Sync backend.

---

## get-gmail-token.js

**Purpose**: Generate a Gmail OAuth refresh token for the backend.

**When to use**: One-time setup to authorize the backend to access your Gmail account.

### Prerequisites

1. Gmail API enabled in Google Cloud Console
2. OAuth credentials created (Client ID and Secret)
3. Node.js and googleapis package installed

### Usage

```bash
# Install dependencies first
cd backend
npm install

# Edit the script and add your credentials
# Update CLIENT_ID and CLIENT_SECRET in scripts/get-gmail-token.js

# Run the script
node scripts/get-gmail-token.js
```

### Steps

1. **Update credentials** in the script:
   ```javascript
   const CLIENT_ID = 'your-client-id.apps.googleusercontent.com';
   const CLIENT_SECRET = 'GOCSPX-your-secret';
   ```

2. **Run the script**:
   ```bash
   node scripts/get-gmail-token.js
   ```

3. **Visit the URL** shown in your terminal in a browser

4. **Authorize the app** by signing in with your Gmail account

5. **Copy the code** from the redirect URL
   - If using `http://localhost:3000/oauth2callback`, the code will be in the URL parameter: `?code=4/xxxxx`
   - Copy everything after `code=` until the first `&`

6. **Paste the code** into the terminal when prompted

7. **Copy the refresh token** to your `.env` file:
   ```
   GMAIL_REFRESH_TOKEN=1//xxxxx...
   ```

### Troubleshooting

**"No refresh token received"**
- This happens if you've already authorized the app before
- Solution: Go to https://myaccount.google.com/permissions
- Find your app and revoke access
- Run the script again

**"Invalid grant" error**
- Make sure you copied the entire authorization code
- The code expires after a few minutes - generate a new one
- Check that your OAuth credentials are correct

**"Access blocked: This app's request is invalid"**
- Make sure your OAuth consent screen is configured
- Add your email as a test user
- Verify the redirect URI matches what's configured in Google Cloud Console

### Security Notes

- Never commit the refresh token to version control
- Store it securely in environment variables
- The refresh token allows access to your Gmail - treat it like a password
- Rotate tokens periodically
- Use a dedicated Gmail account for testing if possible

### Alternative Method: Manual Code Entry

If you don't want to set up a local redirect server, you can use manual code entry:

1. Change the redirect URI to: `urn:ietf:wg:oauth:2.0:oob`
2. Update your OAuth credentials in Google Cloud Console to allow this URI
3. Google will show the code directly in the browser
4. Copy and paste into the terminal

---

## Future Scripts

### test-claude.js (Coming soon)
Test Claude API integration with sample messages

### test-notifications.js (Coming soon)
Test Firebase push notifications

### seed-database.js (Coming soon)
Populate database with test data

### migrate-database.js (Coming soon)
Run database migrations
