import { gmailService } from '../../src/services/gmail.js';

/**
 * OAuth initiation endpoint
 * Visit this endpoint to start the Gmail OAuth flow
 */
export default async function handler(req, res) {
  try {
    // Generate authorization URL
    const authUrl = gmailService.getAuthUrl();

    // Redirect user to Google's OAuth consent screen
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({
      error: 'Failed to generate authorization URL',
      message: error.message
    });
  }
}
