#!/usr/bin/env node

/**
 * Test script for Gmail API connection
 * Run: node src/test-gmail.js
 */

import { config } from 'dotenv';
import { gmailService } from './services/gmail.js';

// Load environment variables
config();

async function testGmailConnection() {
  console.log('🔧 Testing Gmail API connection...\n');

  try {
    // Initialize service
    gmailService.initialize();
    console.log('✓ Gmail service initialized\n');

    // Fetch recent messages
    console.log('📧 Fetching 5 most recent unread messages...\n');
    const messages = await gmailService.fetchRecentMessages(5);

    if (messages.length === 0) {
      console.log('📭 No unread messages found in inbox');
      console.log('\nTip: Send yourself a test email to see this work!');
      return;
    }

    // Display messages
    console.log(`\n📬 Found ${messages.length} message(s):\n`);

    messages.forEach((msg, index) => {
      console.log(`─────────────────────────────────────────────`);
      console.log(`Message ${index + 1}:`);
      console.log(`  ID: ${msg.id}`);
      console.log(`  From: ${msg.from}`);
      console.log(`  Subject: ${msg.subject}`);
      console.log(`  Date: ${msg.date}`);
      console.log(`  Snippet: ${msg.snippet.substring(0, 100)}...`);
      console.log(`  Body length: ${msg.body.length} characters`);
      console.log();
    });

    console.log('─────────────────────────────────────────────\n');
    console.log('✅ Gmail API connection test successful!');
    console.log('\nNext steps:');
    console.log('  1. Create Claude service to analyze these messages');
    console.log('  2. Set up Firebase for push notifications');
    console.log('  3. Create iOS app to receive notifications\n');

  } catch (error) {
    console.error('❌ Error testing Gmail connection:', error.message);

    if (error.message.includes('Missing Gmail OAuth credentials')) {
      console.log('\n⚠️  Setup required:');
      console.log('  1. Create Gmail API credentials in Google Cloud Console');
      console.log('  2. Add credentials to .env file');
      console.log('  3. Run the OAuth flow to get refresh token');
      console.log('\nSee README.md for detailed instructions.');
    } else if (error.message.includes('invalid_grant')) {
      console.log('\n⚠️  Your refresh token may be expired or invalid.');
      console.log('  Run the OAuth flow again to get a new refresh token:');
      console.log('  1. Start dev server: npm run dev');
      console.log('  2. Visit: http://localhost:3000/api/auth/gmail');
      console.log('  3. Copy the new refresh token to .env');
    } else {
      console.log('\n⚠️  Error details:', error);
    }

    process.exit(1);
  }
}

// Run the test
testGmailConnection();
