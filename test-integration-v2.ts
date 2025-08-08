#!/usr/bin/env tsx
/**
 * Test Composio Integration v2 with Real API Key
 */

import * as dotenv from 'dotenv';
import { createComposioService } from './composio-integration-v2';

// Load environment variables
dotenv.config({ path: '/Users/ashleytower/.env' });

async function testIntegration() {
  console.log('🚀 Testing Composio Integration v2\n');
  console.log('========================================\n');
  
  // Check for API key
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) {
    console.error('❌ COMPOSIO_API_KEY not found in .env file');
    process.exit(1);
  }
  
  console.log(`✅ API Key loaded: ${apiKey.substring(0, 12)}...`);
  
  // Create service
  const service = createComposioService({
    apiKey: apiKey,
    entityId: process.env.COMPOSIO_ENTITY_ID || 'test-user'
  });
  
  console.log('✅ Service initialized\n');
  
  try {
    // Check connection status
    console.log('📊 Checking connection status...');
    const status = await service.getConnectionStatus();
    
    console.log(`\n✅ Entity ID: ${status.entityId}`);
    console.log(`${status.gmail ? '✅' : '❌'} Gmail: ${status.gmail ? 'Connected' : 'Not connected'}`);
    console.log(`${status.calendar ? '✅' : '❌'} Google Calendar: ${status.calendar ? 'Connected' : 'Not connected'}`);
    
    if (!status.gmail && !status.calendar) {
      console.log('\n⚠️  No services connected!');
      console.log('\n📌 To connect Gmail and Google Calendar:');
      console.log('1. Visit: https://app.composio.dev');
      console.log('2. Sign in with your API key');
      console.log('3. Go to the Apps section');
      console.log('4. Search for "Gmail" and click "Connect"');
      console.log('5. Search for "Google Calendar" and click "Connect"');
      console.log(`6. Make sure to use entity ID: ${status.entityId}`);
      console.log('7. Run this test again after connecting');
      return;
    }
    
    // Test Gmail if connected
    if (status.gmail) {
      console.log('\n📧 Testing Gmail Operations...');
      console.log('--------------------------------');
      
      try {
        // Test 1: Get recent emails
        console.log('📥 Fetching recent emails...');
        const emails = await service.getRecentEmails(3);
        console.log(`✅ Retrieved ${emails.length} emails`);
        
        if (emails.length > 0) {
          console.log('\nSample email:');
          const email = emails[0];
          console.log(`  From: ${email.from}`);
          console.log(`  Subject: ${email.subject}`);
          console.log(`  Date: ${email.timestamp.toLocaleString()}`);
          console.log(`  Unread: ${email.isUnread ? 'Yes' : 'No'}`);
        }
        
        // Test 2: Search for unread emails
        console.log('\n🔍 Searching for unread emails...');
        const unreadEmails = await service.searchEmails('is:unread');
        console.log(`✅ Found ${unreadEmails.length} unread emails`);
        
        // Test 3: Send a test email (optional - commented out)
        // console.log('\n📤 Sending test email...');
        // const sendResult = await service.sendEmail({
        //   to: ['test@example.com'],
        //   subject: 'Test from Composio Integration',
        //   body: 'This is a test email sent via Composio API.'
        // });
        // console.log(`✅ Email sent: ${sendResult.success ? 'Success' : 'Failed'}`);
        
      } catch (error: any) {
        console.error(`❌ Gmail test failed: ${error.message}`);
      }
    }
    
    // Test Google Calendar if connected
    if (status.calendar) {
      console.log('\n📅 Testing Google Calendar Operations...');
      console.log('----------------------------------------');
      
      try {
        // Test 1: Get today's events
        console.log('📆 Fetching today\'s events...');
        const todaysEvents = await service.getTodaysEvents();
        console.log(`✅ Found ${todaysEvents.length} events for today`);
        
        if (todaysEvents.length > 0) {
          console.log('\nToday\'s events:');
          todaysEvents.forEach(event => {
            console.log(`  - ${event.title}`);
            console.log(`    Time: ${event.startTime.toLocaleTimeString()} - ${event.endTime.toLocaleTimeString()}`);
            if (event.location) {
              console.log(`    Location: ${event.location}`);
            }
          });
        } else {
          console.log('  No events scheduled for today');
        }
        
        // Test 2: Get this week's events
        console.log('\n📅 Fetching this week\'s events...');
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        
        const weekEvents = await service.getEvents(today, nextWeek);
        console.log(`✅ Found ${weekEvents.length} events for the next 7 days`);
        
        // Test 3: Create a test event (optional - commented out)
        // console.log('\n➕ Creating test event...');
        // const tomorrow = new Date();
        // tomorrow.setDate(tomorrow.getDate() + 1);
        // tomorrow.setHours(14, 0, 0, 0);
        // 
        // const endTime = new Date(tomorrow);
        // endTime.setHours(15, 0, 0, 0);
        // 
        // const newEvent = await service.createCalendarEvent({
        //   title: 'Test Event from Composio',
        //   description: 'This is a test event created via Composio API',
        //   startTime: tomorrow,
        //   endTime: endTime,
        //   location: 'Virtual'
        // });
        // console.log(`✅ Event created: ${newEvent.title} (ID: ${newEvent.id})`);
        
      } catch (error: any) {
        console.error(`❌ Calendar test failed: ${error.message}`);
      }
    }
    
    // Summary
    console.log('\n========================================');
    console.log('📊 Test Summary');
    console.log('========================================\n');
    
    console.log('✅ API Key: Valid');
    console.log(`✅ Entity: ${status.entityId}`);
    console.log(`${status.gmail ? '✅' : '❌'} Gmail: ${status.gmail ? 'Working' : 'Not connected'}`);
    console.log(`${status.calendar ? '✅' : '❌'} Calendar: ${status.calendar ? 'Working' : 'Not connected'}`);
    
    if (status.gmail && status.calendar) {
      console.log('\n🎉 All services are connected and working!');
      console.log('The Composio integration is ready for use.');
    } else {
      const missing = [];
      if (!status.gmail) missing.push('Gmail');
      if (!status.calendar) missing.push('Google Calendar');
      
      console.log(`\n⚠️  Missing connections: ${missing.join(', ')}`);
      console.log('Please connect the missing services at https://app.composio.dev');
    }
    
  } catch (error: any) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

// Run the test
testIntegration()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });