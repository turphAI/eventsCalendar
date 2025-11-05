-- Calendar Sync Database Schema
-- PostgreSQL compatible schema for Vercel Postgres

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (basic user management)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enable_gmail BOOLEAN DEFAULT TRUE,
    enable_icloud BOOLEAN DEFAULT TRUE,
    enable_imessage BOOLEAN DEFAULT FALSE,
    polling_interval INTEGER DEFAULT 5, -- in minutes
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    notification_enabled BOOLEAN DEFAULT TRUE,
    fcm_token TEXT, -- Firebase Cloud Messaging token
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Messages table (stores processed messages)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL, -- Gmail/iCloud message ID
    source VARCHAR(20) NOT NULL CHECK (source IN ('gmail', 'icloud', 'imessage')),
    sender VARCHAR(255) NOT NULL,
    subject TEXT,
    body TEXT NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    thread_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, external_id, source)
);

-- Calendar events table (stores extracted events)
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    source VARCHAR(20) NOT NULL CHECK (source IN ('gmail', 'icloud', 'imessage')),
    title VARCHAR(255) NOT NULL,
    date VARCHAR(100) NOT NULL, -- Can be ISO format or relative like "next Thursday"
    time VARCHAR(50),
    location TEXT,
    attendees TEXT[], -- Array of attendee names/emails
    notes TEXT,
    confidence VARCHAR(10) NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'edited')),
    source_message TEXT NOT NULL, -- Original message snippet for user reference
    reasoning TEXT, -- Claude's reasoning for extraction
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notified_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- OAuth tokens table (stores Gmail/iCloud refresh tokens securely)
CREATE TABLE IF NOT EXISTS oauth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('gmail', 'icloud')),
    access_token TEXT,
    refresh_token TEXT NOT NULL,
    token_expiry TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, provider)
);

-- Event processing log (for debugging and analytics)
CREATE TABLE IF NOT EXISTS event_processing_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- e.g., 'message_fetched', 'event_extracted', 'notification_sent'
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'warning')),
    details TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_messages_user_source ON messages(user_id, source);
CREATE INDEX idx_messages_received_at ON messages(received_at DESC);
CREATE INDEX idx_calendar_events_user_status ON calendar_events(user_id, status);
CREATE INDEX idx_calendar_events_created_at ON calendar_events(created_at DESC);
CREATE INDEX idx_event_log_user_created ON event_processing_log(user_id, created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for auto-updating updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_tokens_updated_at BEFORE UPDATE ON oauth_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
