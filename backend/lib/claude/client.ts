/**
 * Claude API client for event extraction
 */

import Anthropic from '@anthropic-ai/sdk';
import { ExtractedEvent, Message } from '../../types';

const SYSTEM_PROMPT = `You are a calendar event extraction system. Your job is to read a message and determine if it contains information about a calendar event.

For each message, respond with JSON in this exact format:
{
  "is_event": boolean,
  "confidence": "high" | "medium" | "low",
  "title": string or null,
  "date": string or null (ISO format or relative like "next Thursday"),
  "time": string or null,
  "location": string or null,
  "attendees": [string] or null,
  "notes": string or null,
  "reasoning": string (brief explanation of your decision)
}

Guidelines:
- Be generous in detecting events, but flag low-confidence extractions clearly
- Interpret relative dates ("tomorrow", "next week", "Friday") and colloquial times ("after lunch", "evening")
- Extract attendees from the message if mentioned
- If the message is clearly NOT an event (e.g., "Can you send me the report?"), set is_event to false
- If details are missing or ambiguous, still extract what you can and mark confidence as "medium" or "low"
- Always provide reasoning for your decision

Examples:
- "Team lunch tomorrow at 12:30 at Milano's" → high confidence, full details
- "drinks friday?" → medium confidence, missing time and location
- "Can you send me the report?" → is_event: false`;

/**
 * Initialize Claude client
 */
function getClaudeClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  return new Anthropic({
    apiKey,
  });
}

/**
 * Extract calendar event from message using Claude
 */
export async function extractEventFromMessage(
  message: Message
): Promise<ExtractedEvent> {
  const client = getClaudeClient();

  const messageContent = `
From: ${message.from}
Subject: ${message.subject || '(no subject)'}

Message:
${message.body}

---

Analyze this message and extract calendar event information if present.`;

  try {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: messageContent,
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    // Parse JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not find JSON in Claude response');
    }

    const extractedEvent: ExtractedEvent = JSON.parse(jsonMatch[0]);

    console.log('Event extracted from message:', {
      messageId: message.id,
      isEvent: extractedEvent.is_event,
      confidence: extractedEvent.confidence,
      title: extractedEvent.title,
    });

    return extractedEvent;
  } catch (error) {
    console.error('Error extracting event with Claude:', error);
    throw error;
  }
}

/**
 * Batch extract events from multiple messages
 */
export async function extractEventsFromMessages(
  messages: Message[]
): Promise<Map<string, ExtractedEvent>> {
  const results = new Map<string, ExtractedEvent>();

  // Process messages sequentially to avoid rate limits
  for (const message of messages) {
    try {
      const event = await extractEventFromMessage(message);
      results.set(message.id, event);

      // Small delay to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to extract event from message ${message.id}:`, error);
      // Continue processing other messages
    }
  }

  return results;
}
