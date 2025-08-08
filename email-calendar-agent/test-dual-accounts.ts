#!/usr/bin/env bun

/**
 * Test script for dual account setup
 * Gmail: info@mtlcraftcocktails.com (business)
 * Calendar: ash.cocktails@gmail.com (personal)
 */

const COMPOSIO_API_KEY = 'ak_suouXXwN2bd7UvBbjJvu';
const COMPOSIO_BASE_URL = 'https://backend.composio.dev/api/v1';

async function composioRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${COMPOSIO_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'X-API-Key': COMPOSIO_API_KEY,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error(`API Error: ${error}`);
    throw new Error(`Composio API error: ${error}`);
  }
  
  return response.json();
}

async function testDualAccountSetup() {
  console.log('🔍 Testing Dual Account Setup');
  console.log('================================\n');
  
  try {
    // Get all connected accounts
    console.log('📋 Fetching connected accounts...');
    const accounts = await composioRequest('/connectedAccounts');
    
    console.log(`\n✅ Found ${accounts.items?.length || 0} connected accounts:\n`);
    
    // Check for Gmail account (business)
    const gmailAccounts = accounts.items?.filter((item: any) => 
      item.appName === 'gmail' && item.status === 'ACTIVE'
    );
    
    console.log('📧 Gmail Accounts:');
    gmailAccounts?.forEach((account: any) => {
      console.log(`   - ID: ${account.id}`);
      console.log(`   - Client: ${account.clientUniqueUserId}`);
      console.log(`   - Status: ${account.status}`);
      console.log(`   - Created: ${account.createdAt}\n`);
    });
    
    // Check for Calendar accounts
    const calendarAccounts = accounts.items?.filter((item: any) => 
      (item.appName === 'googlecalendar' || item.appName === 'google_calendar') && 
      item.status === 'ACTIVE'
    );
    
    console.log('📅 Calendar Accounts:');
    calendarAccounts?.forEach((account: any) => {
      console.log(`   - ID: ${account.id}`);
      console.log(`   - Client: ${account.clientUniqueUserId}`);
      console.log(`   - Status: ${account.status}`);
      console.log(`   - Created: ${account.createdAt}\n`);
    });
    
    // Test Gmail for business account
    const businessGmail = gmailAccounts?.find((a: any) => 
      a.clientUniqueUserId === 'info@mtlcraftcocktails.com'
    );
    
    if (businessGmail) {
      console.log('✅ Testing Gmail (info@mtlcraftcocktails.com)...');
      try {
        const emails = await composioRequest('/actions/gmail_list_emails/execute', {
          method: 'POST',
          body: JSON.stringify({
            connectedAccountId: businessGmail.id,
            input: {
              maxResults: 5,
              q: 'is:unread',
            },
          }),
        });
        console.log(`   Found ${emails.result?.length || 0} unread emails\n`);
      } catch (error) {
        console.log('   ❌ Error fetching emails:', error);
      }
    } else {
      console.log('⚠️  Business Gmail not found (info@mtlcraftcocktails.com)\n');
    }
    
    // Test Calendar for personal account
    const personalCalendar = calendarAccounts?.find((a: any) => 
      a.clientUniqueUserId === 'ash.cocktails@gmail.com'
    );
    
    if (personalCalendar) {
      console.log('✅ Testing Calendar (ash.cocktails@gmail.com)...');
      try {
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(now.setHours(23, 59, 59, 999)).toISOString();
        
        const events = await composioRequest('/actions/googlecalendar_list_events/execute', {
          method: 'POST',
          body: JSON.stringify({
            connectedAccountId: personalCalendar.id,
            input: {
              timeMin: startOfDay,
              timeMax: endOfDay,
              singleEvents: true,
              orderBy: 'startTime',
            },
          }),
        });
        console.log(`   Found ${events.result?.length || 0} events today\n`);
      } catch (error) {
        console.log('   ❌ Error fetching calendar:', error);
      }
    } else {
      console.log('⚠️  Personal Calendar not found (ash.cocktails@gmail.com)\n');
    }
    
    // Summary
    console.log('\n📊 Summary:');
    console.log('===========');
    console.log(`Business Gmail (info@mtlcraftcocktails.com): ${businessGmail ? '✅ Connected' : '❌ Not Connected'}`);
    console.log(`Personal Calendar (ash.cocktails@gmail.com): ${personalCalendar ? '✅ Connected' : '❌ Not Connected'}`);
    
    if (businessGmail && personalCalendar) {
      console.log('\n🎉 Perfect! Both accounts are connected and ready!');
      console.log('You have a complete voice agent with:');
      console.log('  - Business email management');
      console.log('  - Personal calendar management');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testDualAccountSetup();