#!/usr/bin/env bun

/**
 * Setup Gmail and Google Calendar via Composio
 * This will initiate OAuth connections for both services
 */

const COMPOSIO_CONFIG = {
  apiKey: 'ak_suouXXwN2bd7UvBbjJvu',
  baseUrl: 'https://backend.composio.dev/api/v1',
  clientId: 'ash.cocktails@gmail.com' // Using your email as client ID
};

async function checkAndConnectGoogleServices() {
  console.log('🔍 Checking Google Services Integration Status\n');
  
  try {
    // Step 1: Check if Gmail is available as an app
    console.log('1️⃣ Checking available Google apps...');
    const appsResponse = await fetch(`${COMPOSIO_CONFIG.baseUrl}/apps`, {
      method: 'GET',
      headers: {
        'X-API-Key': COMPOSIO_CONFIG.apiKey,
        'Accept': 'application/json'
      }
    });
    
    if (!appsResponse.ok) {
      throw new Error(`Failed to fetch apps: ${appsResponse.statusText}`);
    }
    
    const appsData = await appsResponse.json();
    const googleApps = appsData.items?.filter((app: any) => 
      app.key === 'gmail' || 
      app.key === 'googlecalendar' ||
      app.key === 'google_calendar' ||
      app.name?.toLowerCase().includes('gmail') ||
      app.name?.toLowerCase().includes('calendar')
    );
    
    console.log('Found Google apps:', googleApps?.map((a: any) => ({ 
      key: a.key, 
      name: a.name,
      authScheme: a.authScheme 
    })));
    
    // Step 2: Check current Gmail connection
    console.log('\n2️⃣ Checking Gmail connection...');
    const gmailConnections = await fetch(`${COMPOSIO_CONFIG.baseUrl}/connectedAccounts?appName=gmail`, {
      method: 'GET',
      headers: {
        'X-API-Key': COMPOSIO_CONFIG.apiKey,
        'Accept': 'application/json'
      }
    });
    
    const gmailData = await gmailConnections.json();
    const activeGmail = gmailData.items?.find((item: any) => 
      item.appName === 'gmail' && 
      item.status === 'ACTIVE' &&
      item.clientUniqueUserId === COMPOSIO_CONFIG.clientId
    );
    
    if (activeGmail) {
      console.log('✅ Gmail already connected:', activeGmail.id);
    } else {
      console.log('⚠️  Gmail not connected. Initiating connection...');
      
      // Create Gmail connection
      const gmailAuthResponse = await fetch(`${COMPOSIO_CONFIG.baseUrl}/connectedAccounts`, {
        method: 'POST',
        headers: {
          'X-API-Key': COMPOSIO_CONFIG.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          appName: 'gmail',
          clientUniqueUserId: COMPOSIO_CONFIG.clientId,
          redirectUri: 'https://platform.composio.dev/redirect'
        })
      });
      
      if (gmailAuthResponse.ok) {
        const gmailAuth = await gmailAuthResponse.json();
        console.log('\n📧 Gmail OAuth URL:', gmailAuth.redirectUrl || gmailAuth.authUrl);
        console.log('Please visit this URL to authorize Gmail access');
        console.log('Connection ID:', gmailAuth.connectionId || gmailAuth.id);
      } else {
        console.error('Failed to initiate Gmail connection:', await gmailAuthResponse.text());
      }
    }
    
    // Step 3: Check Google Calendar connection
    console.log('\n3️⃣ Checking Google Calendar connection...');
    const calendarConnections = await fetch(`${COMPOSIO_CONFIG.baseUrl}/connectedAccounts?appName=googlecalendar`, {
      method: 'GET',
      headers: {
        'X-API-Key': COMPOSIO_CONFIG.apiKey,
        'Accept': 'application/json'
      }
    });
    
    const calendarData = await calendarConnections.json();
    const activeCalendar = calendarData.items?.find((item: any) => 
      (item.appName === 'googlecalendar' || item.appName === 'google_calendar') && 
      item.status === 'ACTIVE' &&
      item.clientUniqueUserId === COMPOSIO_CONFIG.clientId
    );
    
    if (activeCalendar) {
      console.log('✅ Google Calendar already connected:', activeCalendar.id);
    } else {
      console.log('⚠️  Google Calendar not connected. Initiating connection...');
      
      // Create Calendar connection
      const calendarAuthResponse = await fetch(`${COMPOSIO_CONFIG.baseUrl}/connectedAccounts`, {
        method: 'POST',
        headers: {
          'X-API-Key': COMPOSIO_CONFIG.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          appName: 'googlecalendar',
          clientUniqueUserId: COMPOSIO_CONFIG.clientId,
          redirectUri: 'https://platform.composio.dev/redirect'
        })
      });
      
      if (calendarAuthResponse.ok) {
        const calendarAuth = await calendarAuthResponse.json();
        console.log('\n📅 Google Calendar OAuth URL:', calendarAuth.redirectUrl || calendarAuth.authUrl);
        console.log('Please visit this URL to authorize Calendar access');
        console.log('Connection ID:', calendarAuth.connectionId || calendarAuth.id);
      } else {
        console.error('Failed to initiate Calendar connection:', await calendarAuthResponse.text());
      }
    }
    
    // Step 4: Test available actions
    console.log('\n4️⃣ Checking available actions...');
    
    // Check Gmail actions
    const gmailActionsResponse = await fetch(`${COMPOSIO_CONFIG.baseUrl}/actions?appNames=gmail`, {
      method: 'GET',
      headers: {
        'X-API-Key': COMPOSIO_CONFIG.apiKey,
        'Accept': 'application/json'
      }
    });
    
    if (gmailActionsResponse.ok) {
      const gmailActions = await gmailActionsResponse.json();
      console.log(`\n📧 Gmail: ${gmailActions.items?.length || 0} actions available`);
      const sampleGmailActions = gmailActions.items?.slice(0, 3).map((a: any) => a.name);
      console.log('Sample actions:', sampleGmailActions);
    }
    
    // Check Calendar actions
    const calendarActionsResponse = await fetch(`${COMPOSIO_CONFIG.baseUrl}/actions?appNames=googlecalendar`, {
      method: 'GET',
      headers: {
        'X-API-Key': COMPOSIO_CONFIG.apiKey,
        'Accept': 'application/json'
      }
    });
    
    if (calendarActionsResponse.ok) {
      const calendarActions = await calendarActionsResponse.json();
      console.log(`\n📅 Calendar: ${calendarActions.items?.length || 0} actions available`);
      const sampleCalendarActions = calendarActions.items?.slice(0, 3).map((a: any) => a.name);
      console.log('Sample actions:', sampleCalendarActions);
    }
    
    return {
      success: true,
      gmailConnected: !!activeGmail,
      calendarConnected: !!activeCalendar
    };
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run setup
console.log('🚀 Gmail & Google Calendar Setup via Composio');
console.log('============================================\n');

checkAndConnectGoogleServices()
  .then(result => {
    console.log('\n============================================');
    console.log('Setup Status:', result.success ? '✅' : '❌');
    
    if (result.success) {
      console.log('\n📋 Status Summary:');
      console.log('- Gmail:', result.gmailConnected ? '✅ Connected' : '⚠️  Needs Authorization');
      console.log('- Calendar:', result.calendarConnected ? '✅ Connected' : '⚠️  Needs Authorization');
      
      if (!result.gmailConnected || !result.calendarConnected) {
        console.log('\n⚠️  ACTION REQUIRED:');
        console.log('Please visit the OAuth URLs above to authorize access');
        console.log('After authorization, run this script again to verify');
      } else {
        console.log('\n✅ All services connected! Ready to build voice agent.');
      }
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
  });