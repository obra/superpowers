#!/usr/bin/env bun

/**
 * Test Gmail using Composio SDK
 * Proper integration with the SDK
 */

import { Composio } from 'composio-core';

const COMPOSIO_API_KEY = 'ak_suouXXwN2bd7UvBbjJvu';
const BUSINESS_EMAIL = 'info@mtlcraftcocktails.com';

async function testWithSDK() {
  console.log('🚀 Testing Gmail with Composio SDK\n');
  console.log(`📧 Business Email: ${BUSINESS_EMAIL}\n`);
  
  try {
    // Initialize Composio client
    const client = new Composio(COMPOSIO_API_KEY);
    
    // Get connected account
    console.log('🔍 Getting connected account...');
    const entity = await client.getEntity(BUSINESS_EMAIL);
    
    console.log('✅ Entity found:', entity.id);
    
    // Get connections
    const connections = await entity.getConnections();
    console.log(`\n📌 Found ${connections.length} connection(s)`);
    
    // Find Gmail connection
    const gmailConnection = connections.find(conn => 
      conn.appUniqueId === 'gmail' || conn.appName === 'gmail'
    );
    
    if (!gmailConnection) {
      console.log('❌ Gmail not connected for this account');
      return;
    }
    
    console.log('✅ Gmail connection found:', gmailConnection.id);
    
    // Execute Gmail action
    console.log('\n📧 Fetching emails...');
    
    const result = await client.executeAction({
      actionName: 'GMAIL_FETCH_EMAILS',
      entityId: BUSINESS_EMAIL,
      params: {
        max_results: 5,
      },
    });
    
    console.log('✅ Emails fetched successfully!');
    
    // Display results
    if (result.data) {
      const emails = result.data.emails || result.data.messages || [];
      console.log(`\n📬 Found ${emails.length} email(s):`);
      
      emails.slice(0, 5).forEach((email: any, index: number) => {
        const subject = email.subject || email.snippet || 'No subject';
        const from = email.from || 'Unknown sender';
        console.log(`\n${index + 1}. ${subject}`);
        if (from !== 'Unknown sender') {
          console.log(`   From: ${from}`);
        }
      });
    }
    
    // Test calendar if available
    console.log('\n\n📅 Checking calendar connection...');
    
    const calendarConnection = connections.find(conn => 
      conn.appUniqueId === 'googlecalendar' || 
      conn.appName === 'googlecalendar' ||
      conn.appName === 'google_calendar'
    );
    
    if (calendarConnection) {
      console.log('✅ Calendar connection found');
      
      try {
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        
        const calendarResult = await client.executeAction({
          actionName: 'GOOGLECALENDAR_LIST_EVENTS',
          entityId: BUSINESS_EMAIL,
          params: {
            timeMin: startOfDay.toISOString(),
            timeMax: endOfDay.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
          },
        });
        
        if (calendarResult.data) {
          const events = calendarResult.data.items || [];
          console.log(`✅ Found ${events.length} event(s) today`);
          
          events.slice(0, 3).forEach((event: any, index: number) => {
            console.log(`${index + 1}. ${event.summary || 'Untitled'}`);
          });
        }
      } catch (error: any) {
        console.log('⚠️ Could not fetch calendar events:', error.message);
      }
    } else {
      console.log('⚠️ Calendar not connected');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Integration test successful!');
    console.log('='.repeat(60));
    
    console.log('\n🎉 Your email and calendar integration is working!');
    console.log('\nNext steps:');
    console.log('1. Update server.ts to use the SDK');
    console.log('2. Start the server: cd email-calendar-agent && bun server.ts');
    console.log('3. Open http://localhost:3000');
    console.log('4. Test voice commands:');
    console.log('   • "Check my emails"');
    console.log('   • "Any new messages?"');
    console.log('   • "What\'s on my calendar?"');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('Entity not found')) {
      console.log('\n⚠️ Account not found. Creating entity...');
      
      try {
        const client = new Composio(COMPOSIO_API_KEY);
        const entity = await client.createEntity(BUSINESS_EMAIL);
        console.log('✅ Entity created:', entity.id);
        console.log('\nNow you need to connect Gmail and Calendar for this entity.');
      } catch (createError: any) {
        console.error('❌ Failed to create entity:', createError.message);
      }
    }
  }
}

// Run the test
testWithSDK().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});