/**
 * Process messages endpoint
 * Fetches messages from Gmail, extracts events with Claude, and stores them
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiResponse, CalendarEvent } from '../types';
import { fetchRecentMessages } from '../lib/gmail/client';
import { extractEventsFromMessages } from '../lib/claude/client';
import { sendNotification } from '../lib/firebase/notifications';
import { query } from '../lib/database/db';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    // TODO: Add authentication
    // For MVP, we'll use a simple approach
    // In production, validate user session/token

    // Get user_id from query params (temporary)
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId parameter required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.log('Processing messages for user:', userId);

    // Get the timestamp of the last processed message
    const lastProcessedResult = await query<{ max_received: Date }>(
      'SELECT MAX(received_at) as max_received FROM messages WHERE user_id = $1',
      [userId]
    );

    const lastProcessedTime = lastProcessedResult.rows[0]?.max_received;

    // Fetch recent messages from Gmail
    const messages = await fetchRecentMessages(
      10,
      lastProcessedTime || undefined
    );

    console.log(`Fetched ${messages.length} new messages`);

    if (messages.length === 0) {
      res.status(200).json({
        success: true,
        data: { processed: 0, events_found: 0 },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Store messages in database
    for (const message of messages) {
      await query(
        `INSERT INTO messages (user_id, external_id, source, sender, subject, body, received_at, processed_at, thread_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
         ON CONFLICT (user_id, external_id, source) DO NOTHING`,
        [
          userId,
          message.id,
          message.source,
          message.from,
          message.subject,
          message.body,
          message.receivedAt,
          message.threadId || null,
        ]
      );
    }

    // Extract events using Claude
    const extractedEvents = await extractEventsFromMessages(messages);

    let eventsCreated = 0;

    // Store events in database and send notifications
    for (const [messageId, extractedEvent] of extractedEvents) {
      if (!extractedEvent.is_event) {
        console.log(`Message ${messageId} is not an event, skipping`);
        continue;
      }

      // Get message database ID
      const messageDbResult = await query<{ id: string }>(
        'SELECT id FROM messages WHERE user_id = $1 AND external_id = $2',
        [userId, messageId]
      );

      if (messageDbResult.rows.length === 0) {
        console.error(`Message ${messageId} not found in database`);
        continue;
      }

      const messageDbId = messageDbResult.rows[0].id;

      // Find original message for source snippet
      const originalMessage = messages.find((m) => m.id === messageId);
      const sourceSnippet = originalMessage
        ? `${originalMessage.subject}\n\n${originalMessage.body.substring(0, 200)}...`
        : 'Message not available';

      // Insert event into database
      const eventResult = await query<{ id: string }>(
        `INSERT INTO calendar_events
         (user_id, message_id, source, title, date, time, location, attendees, notes, confidence, status, source_message, reasoning, notified_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11, $12, NOW())
         RETURNING id`,
        [
          userId,
          messageDbId,
          originalMessage?.source || 'gmail',
          extractedEvent.title || 'Untitled Event',
          extractedEvent.date || 'TBD',
          extractedEvent.time,
          extractedEvent.location,
          extractedEvent.attendees || [],
          extractedEvent.notes,
          extractedEvent.confidence,
          sourceSnippet,
          extractedEvent.reasoning,
        ]
      );

      const eventId = eventResult.rows[0].id;
      eventsCreated++;

      console.log(`Event created: ${eventId} - ${extractedEvent.title}`);

      // Get user's FCM token for notifications
      const fcmResult = await query<{ fcm_token: string }>(
        'SELECT fcm_token FROM user_preferences WHERE user_id = $1',
        [userId]
      );

      const fcmToken = fcmResult.rows[0]?.fcm_token;

      if (fcmToken) {
        // Send notification
        const notificationTitle = extractedEvent.title || 'New Event';
        const notificationBody = `${extractedEvent.date || 'TBD'}${extractedEvent.time ? ` at ${extractedEvent.time}` : ''}`;

        await sendNotification(fcmToken, {
          title: `📅 ${notificationTitle}`,
          body: notificationBody,
          eventId,
        });

        console.log(`Notification sent for event ${eventId}`);
      }

      // Log the event processing
      await query(
        `INSERT INTO event_processing_log (user_id, message_id, event_id, action, status, details)
         VALUES ($1, $2, $3, 'event_extracted', 'success', $4)`,
        [
          userId,
          messageDbId,
          eventId,
          `Extracted event: ${extractedEvent.title} (${extractedEvent.confidence} confidence)`,
        ]
      );
    }

    res.status(200).json({
      success: true,
      data: {
        processed: messages.length,
        events_found: eventsCreated,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing messages:', error);

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}
