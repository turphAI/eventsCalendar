/**
 * Gmail API client for message retrieval
 */

import { google } from 'googleapis';
import { Message, MessageSource } from '../../types';

const gmail = google.gmail('v1');

/**
 * Get OAuth2 client for Gmail API
 */
function getGmailOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );

  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error('GMAIL_REFRESH_TOKEN not configured');
  }

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return oauth2Client;
}

/**
 * Fetch recent messages from Gmail
 */
export async function fetchRecentMessages(
  maxResults: number = 10,
  afterTimestamp?: Date
): Promise<Message[]> {
  try {
    const auth = getGmailOAuth2Client();

    // Build query to filter messages
    let query = 'in:inbox';
    if (afterTimestamp) {
      const afterSeconds = Math.floor(afterTimestamp.getTime() / 1000);
      query += ` after:${afterSeconds}`;
    }

    // List message IDs
    const listResponse = await gmail.users.messages.list({
      auth,
      userId: 'me',
      q: query,
      maxResults,
    });

    const messageIds = listResponse.data.messages || [];
    console.log(`Found ${messageIds.length} Gmail messages`);

    if (messageIds.length === 0) {
      return [];
    }

    // Fetch full message details
    const messages: Message[] = [];
    for (const { id } of messageIds) {
      if (!id) continue;

      const messageResponse = await gmail.users.messages.get({
        auth,
        userId: 'me',
        id,
        format: 'full',
      });

      const gmailMessage = messageResponse.data;
      if (!gmailMessage.payload) continue;

      // Extract headers
      const headers = gmailMessage.payload.headers || [];
      const from = headers.find((h) => h.name === 'From')?.value || 'Unknown';
      const subject = headers.find((h) => h.name === 'Subject')?.value || '';
      const dateStr = headers.find((h) => h.name === 'Date')?.value;

      // Extract body
      let body = '';
      if (gmailMessage.payload.parts) {
        const textPart = gmailMessage.payload.parts.find(
          (part) => part.mimeType === 'text/plain'
        );
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
      } else if (gmailMessage.payload.body?.data) {
        body = Buffer.from(gmailMessage.payload.body.data, 'base64').toString(
          'utf-8'
        );
      }

      messages.push({
        id,
        source: 'gmail' as MessageSource,
        from,
        subject,
        body,
        receivedAt: dateStr ? new Date(dateStr) : new Date(),
        threadId: gmailMessage.threadId || undefined,
      });
    }

    console.log(`Fetched ${messages.length} Gmail messages with content`);
    return messages;
  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    throw error;
  }
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(messageId: string): Promise<void> {
  try {
    const auth = getGmailOAuth2Client();

    await gmail.users.messages.modify({
      auth,
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });

    console.log(`Marked Gmail message ${messageId} as read`);
  } catch (error) {
    console.error(`Error marking message ${messageId} as read:`, error);
  }
}
