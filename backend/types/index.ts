/**
 * Type definitions for Calendar Sync backend
 */

export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type EventStatus = 'pending' | 'approved' | 'rejected' | 'edited';
export type MessageSource = 'gmail' | 'icloud' | 'imessage';

/**
 * Event extracted by Claude from a message
 */
export interface ExtractedEvent {
  is_event: boolean;
  confidence: ConfidenceLevel;
  title: string | null;
  date: string | null; // ISO format or relative like "next Thursday"
  time: string | null;
  location: string | null;
  attendees: string[] | null;
  notes: string | null;
  reasoning: string; // Claude's explanation
}

/**
 * Message data from email source
 */
export interface Message {
  id: string;
  source: MessageSource;
  from: string;
  subject: string;
  body: string;
  receivedAt: Date;
  threadId?: string;
}

/**
 * Calendar event stored in database
 */
export interface CalendarEvent {
  id: string;
  messageId: string;
  source: MessageSource;
  title: string;
  date: string;
  time: string | null;
  location: string | null;
  attendees: string[];
  notes: string | null;
  confidence: ConfidenceLevel;
  status: EventStatus;
  sourceMessage: string; // Original message snippet
  createdAt: Date;
  updatedAt: Date;
  notifiedAt: Date | null;
  processedAt: Date | null;
}

/**
 * User preferences and configuration
 */
export interface UserPreferences {
  id: string;
  userId: string;
  enableGmail: boolean;
  enableIcloud: boolean;
  enableImessage: boolean;
  pollingInterval: number; // in minutes
  timezone: string;
  notificationEnabled: boolean;
  fcmToken: string | null; // Firebase Cloud Messaging device token
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Claude API request payload
 */
export interface ClaudeEventExtractionRequest {
  message: Message;
  systemPrompt: string;
}

/**
 * Firebase notification payload
 */
export interface NotificationPayload {
  title: string;
  body: string;
  eventId: string;
  data?: Record<string, string>;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
