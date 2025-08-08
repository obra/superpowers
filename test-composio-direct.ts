#!/usr/bin/env bun

/**
 * Direct Composio API Test
 * Testing actual API connectivity with configured key
 */

import Composio from 'composio-core';

const API_KEY = 'dc30994b-fe42-495a-a346-809e8f95ee49';

async function testComposioAPI() {
  console.log('=== DIRECT COMPOSIO API TEST ===');
  console.log(`API Key: ${API_KEY.substring(0, 8)}...`);
  console.log('');

  try {
    // Initialize Composio client
    const client = new Composio(API_KEY);
    console.log('✅ Composio client initialized');

    // Test 1: Get connected accounts
    console.log('\nTest 1: Fetching connected accounts...');
    try {
      const accounts = await client.connectedAccounts.list();
      console.log(`✅ Found ${accounts.items?.length || 0} connected accounts`);
      
      if (accounts.items && accounts.items.length > 0) {
        console.log('Connected accounts:');
        accounts.items.forEach((account: any) => {
          console.log(`  - ${account.appUniqueId} (${account.status})`);
        });
      } else {
        console.log('⚠️  No connected accounts found');
        console.log('You need to connect your Google account first');
      }
    } catch (error: any) {
      console.log(`❌ Failed to fetch accounts: ${error.message}`);
    }

    // Test 2: Get available apps
    console.log('\nTest 2: Fetching available apps...');
    try {
      const apps = await client.apps.list();
      const googleApps = apps.items?.filter((app: any) => 
        app.name?.toLowerCase().includes('google') || 
        app.name?.toLowerCase().includes('gmail')
      );
      
      console.log(`✅ Found ${googleApps?.length || 0} Google-related apps`);
      
      if (googleApps && googleApps.length > 0) {
        console.log('Google apps available:');
        googleApps.forEach((app: any) => {
          console.log(`  - ${app.name} (${app.key})`);
        });
      }
    } catch (error: any) {
      console.log(`❌ Failed to fetch apps: ${error.message}`);
    }

    // Test 3: Get available actions for Gmail
    console.log('\nTest 3: Fetching Gmail actions...');
    try {
      const actions = await client.actions.list({
        apps: 'gmail'
      });
      
      console.log(`✅ Found ${actions.items?.length || 0} Gmail actions`);
      
      if (actions.items && actions.items.length > 0) {
        console.log('Sample Gmail actions:');
        actions.items.slice(0, 5).forEach((action: any) => {
          console.log(`  - ${action.name}: ${action.description}`);
        });
      }
    } catch (error: any) {
      console.log(`❌ Failed to fetch actions: ${error.message}`);
    }

    // Test 4: Get available actions for Google Calendar
    console.log('\nTest 4: Fetching Google Calendar actions...');
    try {
      const actions = await client.actions.list({
        apps: 'googlecalendar'
      });
      
      console.log(`✅ Found ${actions.items?.length || 0} Calendar actions`);
      
      if (actions.items && actions.items.length > 0) {
        console.log('Sample Calendar actions:');
        actions.items.slice(0, 5).forEach((action: any) => {
          console.log(`  - ${action.name}: ${action.description}`);
        });
      }
    } catch (error: any) {
      console.log(`❌ Failed to fetch calendar actions: ${error.message}`);
    }

    // Test 5: Check if we need to create connection
    console.log('\n=== CONNECTION STATUS ===');
    const needsConnection = !accounts.items || accounts.items.length === 0 || 
                           !accounts.items.some((acc: any) => 
                             acc.appUniqueId?.includes('google') && acc.status === 'ACTIVE'
                           );
    
    if (needsConnection) {
      console.log('\n⚠️  ACTION REQUIRED:');
      console.log('You need to connect your Google account to use Gmail/Calendar features.');
      console.log('\nTo connect:');
      console.log('1. Run: bunx composio-js add gmail');
      console.log('2. Run: bunx composio-js add googlecalendar');
      console.log('3. Follow the OAuth flow to authorize access');
      
      // Try to initiate connection
      console.log('\nAttempting to generate connection URL...');
      try {
        const connectionRequest = await client.connectedAccounts.initiate({
          appName: 'gmail',
          authMode: 'OAUTH2'
        });
        
        if (connectionRequest.redirectUrl) {
          console.log('\n🔗 Connection URL:');
          console.log(connectionRequest.redirectUrl);
          console.log('\nOpen this URL in your browser to connect Gmail');
        }
      } catch (error: any) {
        console.log(`Could not generate connection URL: ${error.message}`);
      }
    } else {
      console.log('✅ Google account is connected and active');
      
      // Try to execute a simple action
      console.log('\nTest 6: Attempting to fetch emails...');
      try {
        const connectedAccount = accounts.items.find((acc: any) => 
          acc.appUniqueId?.includes('gmail') && acc.status === 'ACTIVE'
        );
        
        if (connectedAccount) {
          const result = await client.actions.execute({
            actionName: 'gmail_list_emails',
            connectedAccountId: connectedAccount.id,
            params: {
              max_results: 5
            }
          });
          
          console.log('✅ Successfully fetched emails!');
          console.log(`Result: ${JSON.stringify(result, null, 2).substring(0, 200)}...`);
        }
      } catch (error: any) {
        console.log(`❌ Failed to fetch emails: ${error.message}`);
        if (error.response?.data) {
          console.log(`Details: ${JSON.stringify(error.response.data)}`);
        }
      }
    }

  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    if (error.response?.status === 401) {
      console.log('\n⚠️  Authentication failed - API key may be invalid');
    }
  }
}

// Run the test
console.log('Starting direct Composio API test...\n');
testComposioAPI()
  .then(() => {
    console.log('\nTest complete.');
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });