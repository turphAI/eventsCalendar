/**
 * Gmail OAuth Token Generator
 *
 * This script helps you get a Gmail refresh token for the backend.
 * Run this locally once to authorize your Gmail account.
 *
 * Usage:
 *   1. Fill in CLIENT_ID and CLIENT_SECRET below
 *   2. Run: node scripts/get-gmail-token.js
 *   3. Visit the URL shown in your browser
 *   4. Authorize the app
 *   5. Copy the refresh token to your .env file
 */

const readline = require('readline');
const { google } = require('googleapis');

// ============================================
// STEP 1: Fill in your OAuth credentials here
// ============================================
const CLIENT_ID = 'YOUR_GMAIL_CLIENT_ID_HERE';
const CLIENT_SECRET = 'YOUR_GMAIL_CLIENT_SECRET_HERE';
const REDIRECT_URI = 'http://localhost:3000/oauth2callback'; // or 'urn:ietf:wg:oauth:2.0:oob' for manual code entry

// ============================================
// OAuth2 client setup
// ============================================
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Scopes for Gmail API (read-only access)
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly'
];

/**
 * Generate authorization URL
 */
function getAuthUrl() {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Important: gives us a refresh token
    scope: SCOPES,
    prompt: 'consent', // Force consent screen to get refresh token
  });

  return authUrl;
}

/**
 * Exchange authorization code for tokens
 */
async function getTokens(code) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\n========================================');
  console.log('Gmail OAuth Token Generator');
  console.log('========================================\n');

  // Check if credentials are set
  if (CLIENT_ID === 'YOUR_GMAIL_CLIENT_ID_HERE' || CLIENT_SECRET === 'YOUR_GMAIL_CLIENT_SECRET_HERE') {
    console.error('❌ Error: Please update CLIENT_ID and CLIENT_SECRET in this script first!\n');
    console.log('Get your credentials from:');
    console.log('https://console.cloud.google.com/apis/credentials\n');
    process.exit(1);
  }

  // Generate and display authorization URL
  const authUrl = getAuthUrl();

  console.log('Step 1: Visit this URL in your browser:\n');
  console.log(authUrl);
  console.log('\n');

  // Wait for user to authorize and enter code
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Step 2: After authorizing, enter the code from the redirect URL:\n> ', async (code) => {
    rl.close();

    console.log('\nExchanging code for tokens...');

    try {
      const tokens = await getTokens(code);

      console.log('\n========================================');
      console.log('✅ Success! Your tokens:');
      console.log('========================================\n');

      if (tokens.refresh_token) {
        console.log('🔑 Refresh Token (add this to your .env file):');
        console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}\n`);
      } else {
        console.warn('⚠️  Warning: No refresh token received!');
        console.warn('This might happen if you\'ve already authorized this app before.');
        console.warn('Try revoking access at https://myaccount.google.com/permissions');
        console.warn('and run this script again.\n');
      }

      console.log('Access Token (expires in 1 hour, not needed for backend):');
      console.log(tokens.access_token);
      console.log('\n');

      // Save to .env format
      console.log('========================================');
      console.log('Add these to your .env file:');
      console.log('========================================\n');
      console.log(`GMAIL_CLIENT_ID=${CLIENT_ID}`);
      console.log(`GMAIL_CLIENT_SECRET=${CLIENT_SECRET}`);
      console.log(`GMAIL_REDIRECT_URI=${REDIRECT_URI}`);
      if (tokens.refresh_token) {
        console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
      }
      console.log('\n');

    } catch (error) {
      console.error('\n❌ Error getting tokens:', error.message);
      console.error('\nMake sure:');
      console.error('1. You copied the code correctly');
      console.error('2. Your OAuth credentials are valid');
      console.error('3. Gmail API is enabled in Google Cloud Console\n');
    }
  });
}

main();
