#!/usr/bin/env bun

// Test Composio connection with correct imports
import { Composio } from 'composio-core';

const COMPOSIO_API_KEY = 'oak_ZXHQaIMH4guJQOF6oNzZ';
const ENTITY_ID = 'default';

async function testComposioConnection() {
  console.log('='.repeat(60));
  console.log('TESTING COMPOSIO CONNECTION FOR EMAIL/CALENDAR AGENT');
  console.log('='.repeat(60));
  
  try {
    // Initialize Composio client
    const client = new Composio({
      apiKey: COMPOSIO_API_KEY
    });
    console.log('\n1. Composio client initialized ✓');
    
    // Get connected accounts
    console.log('\n2. Checking connected accounts...');
    const connectedAccounts = await client.connectedAccounts.list();
    console.log(`   Found ${connectedAccounts.items?.length || 0} connected accounts`);
    
    if (connectedAccounts.items && connectedAccounts.items.length > 0) {
      connectedAccounts.items.forEach((account: any) => {
        console.log(`   - ${account.appName}: ${account.id}`);
      });
    }
    
    // Get entity connections
    console.log('\n3. Checking entity connections...');
    try {
      const entity = await client.getEntity(ENTITY_ID);
      const connections = await entity.getConnections();
      
      console.log(`   Found ${connections.length} connections for entity '${ENTITY_ID}'`);
      
      const gmailConnection = connections.find((c: any) => 
        c.appName?.toLowerCase().includes('gmail')
      );
      
      const calendarConnection = connections.find((c: any) => 
        c.appName?.toLowerCase().includes('googlecalendar') ||
        c.appName?.toLowerCase().includes('google_calendar')
      );
      
      if (gmailConnection) {
        console.log('   ✓ Gmail connected');
        console.log(`     - Connection ID: ${gmailConnection.id}`);
        console.log(`     - Status: ${gmailConnection.status}`);
      } else {
        console.log('   ⚠️  Gmail not connected');
      }
      
      if (calendarConnection) {
        console.log('   ✓ Google Calendar connected');
        console.log(`     - Connection ID: ${calendarConnection.id}`);
        console.log(`     - Status: ${calendarConnection.status}`);
      } else {
        console.log('   ⚠️  Google Calendar not connected');
      }
      
    } catch (entityError: any) {
      console.log('   ⚠️  Entity not found or no connections');
      console.log(`   Error: ${entityError.message}`);
    }
    
    // List available apps
    console.log('\n4. Checking available apps...');
    const apps = await client.apps.list();
    
    const gmailApp = apps.items?.find((app: any) => 
      app.key === 'gmail' || app.name?.toLowerCase().includes('gmail')
    );
    
    const calendarApp = apps.items?.find((app: any) => 
      app.key === 'googlecalendar' || app.name?.toLowerCase().includes('calendar')
    );
    
    if (gmailApp) {
      console.log('   ✓ Gmail app available');
      console.log(`     - Key: ${gmailApp.key}`);
      console.log(`     - Name: ${gmailApp.name}`);
    }
    
    if (calendarApp) {
      console.log('   ✓ Google Calendar app available');
      console.log(`     - Key: ${calendarApp.key}`);
      console.log(`     - Name: ${calendarApp.name}`);
    }
    
    // Check available actions
    console.log('\n5. Checking available actions...');
    if (gmailApp) {
      const gmailActions = await client.actions.list({
        appNames: ['gmail']
      });
      console.log(`   Gmail: ${gmailActions.items?.length || 0} actions available`);
      
      // Show some common actions
      const commonGmailActions = ['GMAIL_SEND_EMAIL', 'GMAIL_LIST_EMAILS', 'GMAIL_GET_EMAIL'];
      gmailActions.items?.slice(0, 5).forEach((action: any) => {
        if (commonGmailActions.includes(action.name)) {
          console.log(`     - ${action.name}: ${action.description || 'No description'}`);
        }
      });
    }
    
    if (calendarApp) {
      const calendarActions = await client.actions.list({
        appNames: ['googlecalendar']
      });
      console.log(`   Calendar: ${calendarActions.items?.length || 0} actions available`);
      
      // Show some common actions
      calendarActions.items?.slice(0, 3).forEach((action: any) => {
        console.log(`     - ${action.name}: ${action.description || 'No description'}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ COMPOSIO CONNECTION TEST COMPLETE');
    console.log('='.repeat(60));
    
    return {
      connected: true,
      hasGmail: !!gmailApp,
      hasCalendar: !!calendarApp,
      connectedAccounts: connectedAccounts.items?.length || 0
    };
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message || error);
    
    if (error.response?.status === 401 || error.message?.includes('401')) {
      console.error('\n⚠️  Authentication failed. Please check your API key.');
      console.error('Current key:', COMPOSIO_API_KEY.substring(0, 15) + '...');
    }
    
    if (error.message?.includes('network') || error.message?.includes('ENOTFOUND')) {
      console.error('\n⚠️  Network error. Please check your internet connection.');
    }
    
    return {
      connected: false,
      error: error.message
    };
  }
}

// Run the test
console.log('Starting Composio connection test...\n');
testComposioConnection().then(result => {
  console.log('\n📊 Test Summary:', JSON.stringify(result, null, 2));
  
  if (!result.connected) {
    console.log('\n💡 Next Steps:');
    console.log('1. Verify API key is correct');
    console.log('2. Check Composio dashboard at https://app.composio.dev');
    console.log('3. Ensure network connectivity');
  } else if (!result.hasGmail || !result.hasCalendar) {
    console.log('\n💡 Next Steps:');
    console.log('1. Connect Gmail account via Composio dashboard');
    console.log('2. Connect Google Calendar account');
    console.log('3. Run: bunx composio add gmail');
    console.log('4. Run: bunx composio add googlecalendar');
  }
}).catch(err => {
  console.error('Unhandled error:', err);
});