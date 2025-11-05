import { gmailService } from '../../src/services/gmail.js';

/**
 * OAuth callback endpoint
 * Google redirects here after user grants permissions
 */
export default async function handler(req, res) {
  const { code, error } = req.query;

  // Handle OAuth errors
  if (error) {
    return res.status(400).json({
      error: 'OAuth authorization failed',
      message: error
    });
  }

  // Handle missing code
  if (!code) {
    return res.status(400).json({
      error: 'Missing authorization code'
    });
  }

  try {
    // Exchange code for tokens
    const tokens = await gmailService.getTokensFromCode(code);

    // Return success with refresh token
    res.status(200).json({
      success: true,
      message: 'Authorization successful! Save the refresh_token to your .env file.',
      refresh_token: tokens.refresh_token,
      instructions: [
        '1. Copy the refresh_token value below',
        '2. Add it to your .env file as: GMAIL_REFRESH_TOKEN=<token>',
        '3. Restart your development server',
        '4. You can now fetch Gmail messages!'
      ]
    });
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    res.status(500).json({
      error: 'Failed to exchange authorization code',
      message: error.message
    });
  }
}
