#!/usr/bin/env bun

/**
 * Test GMAIL_FETCH_EMAILS action
 * Using the action we found in the list
 */

const COMPOSIO_API_KEY = 'ak_suouXXwN2bd7UvBbjJvu';
const ACCOUNT_ID = '38df595d-3f5f-4dc7-b252-747cbc41f114';

async function testGmailFetch() {
  console.log('🔍 Testing GMAIL_FETCH_EMAILS action...\n');
  
  // Try different endpoint formats
  const endpoints = [
    'https://backend.composio.dev/api/v1/actions/GMAIL_FETCH_EMAILS/execute',
    'https://backend.composio.dev/api/v1/actions/execute',
    'https://backend.composio.dev/actions/execute',
    'https://api.composio.dev/api/v1/actions/execute',
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\nTrying: ${endpoint}`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'X-API-Key': COMPOSIO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectedAccountId: ACCOUNT_ID,
          actionId: 'GMAIL_FETCH_EMAILS',
          actionName: 'GMAIL_FETCH_EMAILS',
          input: {
            max_results: 5,
            maxResults: 5,
            label_ids: ['INBOX'],
          },
        }),
      });
      
      const text = await response.text();
      
      if (response.ok) {
        console.log('✅ SUCCESS!');
        const data = JSON.parse(text);
        console.log('Response:', JSON.stringify(data, null, 2));
        
        // If we got emails, show them
        if (data.data?.emails || data.result?.emails || data.emails) {
          const emails = data.data?.emails || data.result?.emails || data.emails;
          console.log(`\n📧 Found ${emails.length} emails:`);
          emails.slice(0, 3).forEach((email: any, i: number) => {
            console.log(`${i + 1}. ${email.subject || email.snippet || 'No subject'}`);
          });
        }
        
        return true;
      } else {
        console.log(`❌ Failed (${response.status}): ${text.substring(0, 100)}...`);
      }
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  // Try using the Python SDK format
  console.log('\n\n🐍 Trying Python SDK format...');
  
  try {
    const response = await fetch('https://backend.composio.dev/api/v1/executeAction', {
      method: 'POST',
      headers: {
        'X-API-Key': COMPOSIO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        connectedAccountId: ACCOUNT_ID,
        action: 'GMAIL_FETCH_EMAILS',
        params: {
          max_results: 5,
        },
      }),
    });
    
    const text = await response.text();
    
    if (response.ok) {
      console.log('✅ Python SDK format worked!');
      const data = JSON.parse(text);
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ Failed: ${text.substring(0, 100)}...`);
    }
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  return false;
}

// Run the test
testGmailFetch().then(success => {
  if (success) {
    console.log('\n✅ Gmail integration is working!');
    console.log('\nNext steps:');
    console.log('1. Update server.ts with the working endpoint');
    console.log('2. Start the server: cd email-calendar-agent && bun server.ts');
    console.log('3. Test voice commands');
  } else {
    console.log('\n⚠️ Could not find working endpoint format');
    console.log('Check Composio documentation or dashboard for the correct format');
  }
});