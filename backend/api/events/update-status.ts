/**
 * Update event status endpoint
 * iOS app calls this when user approves/rejects an event
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { ApiResponse, EventStatus } from '../../types';
import { query } from '../../lib/database/db';

interface UpdateStatusRequest {
  userId: string;
  eventId: string;
  status: EventStatus;
  editedData?: {
    title?: string;
    date?: string;
    time?: string;
    location?: string;
    attendees?: string[];
    notes?: string;
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    const { userId, eventId, status, editedData } =
      req.body as UpdateStatusRequest;

    // Validate required fields
    if (!userId || !eventId || !status) {
      res.status(400).json({
        success: false,
        error: 'userId, eventId, and status are required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Validate status value
    const validStatuses: EventStatus[] = ['pending', 'approved', 'rejected', 'edited'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid status value',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // If status is 'edited' and editedData is provided, update the event
    if (status === 'edited' && editedData) {
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (editedData.title) {
        updates.push(`title = $${paramIndex++}`);
        values.push(editedData.title);
      }
      if (editedData.date) {
        updates.push(`date = $${paramIndex++}`);
        values.push(editedData.date);
      }
      if (editedData.time !== undefined) {
        updates.push(`time = $${paramIndex++}`);
        values.push(editedData.time);
      }
      if (editedData.location !== undefined) {
        updates.push(`location = $${paramIndex++}`);
        values.push(editedData.location);
      }
      if (editedData.attendees) {
        updates.push(`attendees = $${paramIndex++}`);
        values.push(editedData.attendees);
      }
      if (editedData.notes !== undefined) {
        updates.push(`notes = $${paramIndex++}`);
        values.push(editedData.notes);
      }

      updates.push(`status = $${paramIndex++}`);
      values.push('edited');

      updates.push(`processed_at = NOW()`);

      values.push(eventId, userId);

      await query(
        `UPDATE calendar_events
         SET ${updates.join(', ')}
         WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}`,
        values
      );
    } else {
      // Simple status update
      await query(
        `UPDATE calendar_events
         SET status = $1, processed_at = NOW()
         WHERE id = $2 AND user_id = $3`,
        [status, eventId, userId]
      );
    }

    // Log the action
    await query(
      `INSERT INTO event_processing_log (user_id, event_id, action, status, details)
       VALUES ($1, $2, $3, 'success', $4)`,
      [
        userId,
        eventId,
        `event_${status}`,
        editedData
          ? `Event ${status} with edits: ${JSON.stringify(editedData)}`
          : `Event ${status}`,
      ]
    );

    console.log(`Event ${eventId} status updated to ${status} by user ${userId}`);

    res.status(200).json({
      success: true,
      data: { eventId, status },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating event status:', error);

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}
