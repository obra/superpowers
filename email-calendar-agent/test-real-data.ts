#!/usr/bin/env bun

/**
 * Test script to fetch REAL data from Composio
 */

const COMPOSIO_API_KEY = 'ak_suouXXwN2bd7UvBbjJvu';
const GMAIL_ACCOUNT_ID = '38df595d-3f5f-4dc7-b252-747cbc41f114';
const CALENDAR_ACCOUNT_ID = '4af23c38-d0c4-4188-b936-69cf58c62017';

async function testGmailEmails() {
  console.log('\n📧 Testing Gmail Emails...');
  
  try {
    const response = await fetch('https://backend.composio.dev/api/v2/actions/execute', {
      method: 'POST',
      headers: {
        'X-API-Key': COMPOSIO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        connectedAccountId: GMAIL_ACCOUNT_ID,
        actionName: 'GMAIL_LIST_EMAILS',
        input: {
          maxResults: 5,
          q: 'is:unread'
        }
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('Error:', data.error);
      return;
    }
    
    console.log('Response:', JSON.stringify(data, null, 2));
    
    // Try to extract emails
    const messages = data?.response_data?.messages || data?.result?.messages || [];
    console.log(`\nFound ${messages.length} unread emails`);
    
    if (messages.length > 0) {
      // Get details for first email
      console.log('\nFetching details for first email...');
      const detailResponse = await fetch('https://backend.composio.dev/api/v2/actions/execute', {
        method: 'POST',
        headers: {
          'X-API-Key': COMPOSIO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectedAccountId: GMAIL_ACCOUNT_ID,
          actionName: 'GMAIL_GET_EMAIL',
          input: {
            id: messages[0].id
          }
        })
      });
      
      const detailData = await detailResponse.json();
      console.log('Email details:', JSON.stringify(detailData, null, 2));
    }
    
  } catch (error) {
    console.error('Gmail test failed:', error);
  }
}

async function testCalendarEvents() {
  console.log('\n📅 Testing Calendar Events...');
  
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    
    const response = await fetch('https://backend.composio.dev/api/v2/actions/execute', {
      method: 'POST',
      headers: {
        'X-API-Key': COMPOSIO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        connectedAccountId: CALENDAR_ACCOUNT_ID,
        actionName: 'GOOGLECALENDAR_LIST_EVENTS',
        input: {
          timeMin: startOfDay,
          timeMax: endOfDay,
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 5
        }
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('Error:', data.error);
      return;
    }
    
    console.log('Response:', JSON.stringify(data, null, 2));
    
    // Extract events
    const events = data?.response_data?.items || data?.result?.items || [];
    console.log(`\nFound ${events.length} events today`);
    
    events.forEach((event: any, index: number) => {
      console.log(`\nEvent ${index + 1}:`);
      console.log(`  Title: ${event.summary || 'Untitled'}`);
      console.log(`  Start: ${event.start?.dateTime || event.start?.date || 'No time'}`);
      console.log(`  Location: ${event.location || 'No location'}`);
    });
    
  } catch (error) {
    console.error('Calendar test failed:', error);
  }
}

async function testMem0() {
  console.log('\n🧠 Testing Mem0 Memory...');
  
  try {
    // First add a memory
    console.log('Adding test memory...');
    const addResponse = await fetch('https://backend.composio.dev/api/v2/actions/execute', {
      method: 'POST',
      headers: {
        'X-API-Key': COMPOSIO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        connectedAccountId: '78afb30c-ad60-4c58-a0fc-1bed78c4fbeb',
        actionName: 'MEM0_ADD_MEMORY',
        input: {
          messages: 'Test memory: MTL Craft Cocktails voice agent is working at ' + new Date().toISOString(),
          user_id: 'mtl-cocktails'
        }
      })
    });
    
    const addData = await addResponse.json();
    console.log('Add memory response:', JSON.stringify(addData, null, 2));
    
    // Now search for it
    console.log('\nSearching memories...');
    const searchResponse = await fetch('https://backend.composio.dev/api/v2/actions/execute', {
      method: 'POST',
      headers: {
        'X-API-Key': COMPOSIO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        connectedAccountId: '78afb30c-ad60-4c58-a0fc-1bed78c4fbeb',
        actionName: 'MEM0_SEARCH_MEMORIES',
        input: {
          query: 'voice agent',
          user_id: 'mtl-cocktails'
        }
      })
    });
    
    const searchData = await searchResponse.json();
    console.log('Search response:', JSON.stringify(searchData, null, 2));
    
  } catch (error) {
    console.error('Mem0 test failed:', error);
  }
}

// Run tests
async function runTests() {
  console.log('🔧 Testing REAL Composio Data Access');
  console.log('=====================================');
  
  await testGmailEmails();
  await testCalendarEvents();
  await testMem0();
  
  console.log('\n✅ Tests complete!');
}

runTests();