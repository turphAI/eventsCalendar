import { google } from 'googleapis';

/**
 * Gmail Service for Calendar Sync
 * Handles OAuth authentication and message retrieval from Gmail API
 */
class GmailService {
  constructor() {
    this.oauth2Client = null;
    this.gmail = null;
    this.initialized = false;
  }

  /**
   * Initialize Gmail API client with OAuth credentials
   */
  initialize() {
    if (this.initialized) return;

    const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI } = process.env;

    if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REDIRECT_URI) {
      throw new Error('Missing Gmail OAuth credentials in environment variables');
    }

    // Create OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      GMAIL_CLIENT_ID,
      GMAIL_CLIENT_SECRET,
      GMAIL_REDIRECT_URI
    );

    // Set refresh token if available
    if (process.env.GMAIL_REFRESH_TOKEN) {
      this.oauth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN
      });
    }

    // Create Gmail API client
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    this.initialized = true;

    console.log('✓ Gmail service initialized');
  }

  /**
   * Generate OAuth authorization URL
   * User needs to visit this URL to grant permissions
   */
  getAuthUrl() {
    if (!this.oauth2Client) this.initialize();

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.metadata'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent' // Force consent to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   * @param {string} code - Authorization code from OAuth callback
   */
  async getTokensFromCode(code) {
    if (!this.oauth2Client) this.initialize();

    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    console.log('✓ Tokens obtained successfully');
    console.log('Refresh token:', tokens.refresh_token);
    console.log('⚠️  Save this refresh token to your .env file as GMAIL_REFRESH_TOKEN');

    return tokens;
  }

  /**
   * Fetch recent messages from Gmail inbox
   * @param {number} maxResults - Maximum number of messages to retrieve (default: 10)
   * @param {string} query - Gmail search query (optional)
   */
  async fetchRecentMessages(maxResults = 10, query = '') {
    if (!this.initialized) this.initialize();

    try {
      // List messages
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults: maxResults,
        q: query || 'in:inbox is:unread' // Default: unread messages in inbox
      });

      const messages = response.data.messages || [];

      if (messages.length === 0) {
        console.log('No messages found');
        return [];
      }

      console.log(`Found ${messages.length} message(s)`);

      // Fetch full message details
      const fullMessages = await Promise.all(
        messages.map(msg => this.getMessageById(msg.id))
      );

      return fullMessages;
    } catch (error) {
      console.error('Error fetching messages:', error.message);
      throw error;
    }
  }

  /**
   * Get full message details by ID
   * @param {string} messageId - Gmail message ID
   */
  async getMessageById(messageId) {
    if (!this.initialized) this.initialize();

    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const message = response.data;

      // Extract relevant fields
      const headers = message.payload.headers;
      const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '(no subject)';
      const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || '';
      const date = headers.find(h => h.name.toLowerCase() === 'date')?.value || '';

      // Extract message body
      let body = '';
      if (message.payload.parts) {
        // Multipart message
        const textPart = message.payload.parts.find(
          part => part.mimeType === 'text/plain'
        );
        if (textPart && textPart.body.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
      } else if (message.payload.body.data) {
        // Simple message
        body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
      }

      return {
        id: message.id,
        threadId: message.threadId,
        subject,
        from,
        date,
        body: body.substring(0, 5000), // Limit body length
        snippet: message.snippet,
        labelIds: message.labelIds || []
      };
    } catch (error) {
      console.error(`Error fetching message ${messageId}:`, error.message);
      throw error;
    }
  }

  /**
   * Mark message as read
   * @param {string} messageId - Gmail message ID
   */
  async markAsRead(messageId) {
    if (!this.initialized) this.initialize();

    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      });
      console.log(`✓ Marked message ${messageId} as read`);
    } catch (error) {
      console.error(`Error marking message as read:`, error.message);
      throw error;
    }
  }
}

// Export singleton instance
export const gmailService = new GmailService();
