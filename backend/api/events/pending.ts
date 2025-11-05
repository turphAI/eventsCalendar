/**
 * Get pending events endpoint
 * iOS app calls this to fetch events awaiting user review
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiResponse, CalendarEvent } from '../../types';
import { query } from '../../lib/database/db';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  try {
    // TODO: Add proper authentication
    const userId = req.query.userId as string;
    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId parameter required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Fetch pending events for the user
    const result = await query<CalendarEvent>(
      `SELECT
        id,
        message_id as "messageId",
        source,
        title,
        date,
        time,
        location,
        attendees,
        notes,
        confidence,
        status,
        source_message as "sourceMessage",
        created_at as "createdAt",
        updated_at as "updatedAt",
        notified_at as "notifiedAt",
        processed_at as "processedAt"
       FROM calendar_events
       WHERE user_id = $1 AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    const events = result.rows;

    console.log(`Found ${events.length} pending events for user ${userId}`);

    res.status(200).json({
      success: true,
      data: events,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching pending events:', error);

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}
