#!/usr/bin/env bun

/**
 * Correct Composio SDK Test
 * Using proper import and initialization
 */

import { Composio } from 'composio-core';

const API_KEY = 'dc30994b-fe42-495a-a346-809e8f95ee49';

async function testComposioSDK() {
  console.log('=== COMPOSIO SDK TEST ===');
  console.log(`API Key: ${API_KEY.substring(0, 8)}...`);
  console.log('');

  try {
    // Initialize Composio client with proper syntax
    const client = new Composio({ apiKey: API_KEY });
    console.log('✅ Composio client initialized');

    // Test 1: Get entity (default user)
    console.log('\nTest 1: Getting or creating entity...');
    try {
      const entity = await client.getEntity('default');
      console.log(`✅ Entity retrieved: ${entity.id}`);
      
      // Test 2: Get connected accounts for entity
      console.log('\nTest 2: Checking connected accounts...');
      const connections = await entity.getConnections();
      console.log(`Found ${connections.length} connected accounts`);
      
      if (connections.length > 0) {
        console.log('Connected accounts:');
        connections.forEach((conn: any) => {
          console.log(`  - ${conn.appName} (${conn.status})`);
        });
      } else {
        console.log('⚠️  No connected accounts found');
        
        // Try to initiate Gmail connection
        console.log('\nInitiating Gmail connection...');
        try {
          const connectionParams = await entity.initiateConnection('gmail');
          
          if (connectionParams.redirectUrl) {
            console.log('\n🔗 OAuth Connection URL:');
            console.log(connectionParams.redirectUrl);
            console.log('\nOpen this URL to connect your Gmail account');
          }
        } catch (error: any) {
          console.log(`Could not initiate connection: ${error.message}`);
        }
      }
      
      // Test 3: Check if Gmail is connected
      const gmailConnection = connections.find((c: any) => c.appName === 'gmail');
      if (gmailConnection) {
        console.log('\n✅ Gmail is connected!');
        
        // Test 4: Try to execute Gmail action
        console.log('\nTest 4: Attempting to fetch emails...');
        try {
          const result = await entity.execute({
            actionName: 'gmail_list_emails',
            params: {
              max_results: 5
            }
          });
          
          console.log('✅ Successfully fetched emails!');
          if (result.data && result.data.emails) {
            console.log(`Found ${result.data.emails.length} emails`);
            result.data.emails.slice(0, 3).forEach((email: any) => {
              console.log(`  - ${email.subject || 'No subject'}`);
            });
          }
        } catch (error: any) {
          console.log(`❌ Failed to fetch emails: ${error.message}`);
        }
      }
      
      // Test 5: Check Google Calendar
      const calendarConnection = connections.find((c: any) => c.appName === 'googlecalendar');
      if (calendarConnection) {
        console.log('\n✅ Google Calendar is connected!');
        
        console.log('\nTest 5: Attempting to fetch calendar events...');
        try {
          const result = await entity.execute({
            actionName: 'googlecalendar_list_events',
            params: {
              maxResults: 5
            }
          });
          
          console.log('✅ Successfully fetched events!');
          if (result.data && result.data.events) {
            console.log(`Found ${result.data.events.length} events`);
            result.data.events.slice(0, 3).forEach((event: any) => {
              console.log(`  - ${event.summary || 'No title'}`);
            });
          }
        } catch (error: any) {
          console.log(`❌ Failed to fetch events: ${error.message}`);
        }
      } else {
        console.log('\n⚠️  Google Calendar not connected');
        
        // Try to initiate Calendar connection
        console.log('\nInitiating Google Calendar connection...');
        try {
          const connectionParams = await entity.initiateConnection('googlecalendar');
          
          if (connectionParams.redirectUrl) {
            console.log('\n🔗 OAuth Connection URL:');
            console.log(connectionParams.redirectUrl);
            console.log('\nOpen this URL to connect your Google Calendar');
          }
        } catch (error: any) {
          console.log(`Could not initiate connection: ${error.message}`);
        }
      }
      
    } catch (error: any) {
      console.log(`❌ Failed to get entity: ${error.message}`);
      if (error.response?.data) {
        console.log(`API Response: ${JSON.stringify(error.response.data)}`);
      }
    }

    // Test 6: List available apps
    console.log('\n=== AVAILABLE INTEGRATIONS ===');
    try {
      const apps = await client.getApps();
      const relevantApps = apps.filter((app: any) => 
        ['gmail', 'googlecalendar', 'slack', 'github'].includes(app.key)
      );
      
      console.log('Key integrations available:');
      relevantApps.forEach((app: any) => {
        console.log(`  - ${app.name} (${app.key})`);
      });
    } catch (error: any) {
      console.log(`Could not fetch apps: ${error.message}`);
    }

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    if (error.response?.status === 401) {
      console.log('\n⚠️  Authentication failed - API key may be invalid');
      console.log('Please verify your API key at https://app.composio.dev');
    }
  }
}

// Run the test
console.log('Starting Composio SDK test...\n');
testComposioSDK()
  .then(() => {
    console.log('\n✅ Test complete.');
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });