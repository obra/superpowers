#!/usr/bin/env bun

/**
 * Gmail Business Account Test Suite
 * Tests the Gmail connection for info@mtlcraftcocktails.com
 */

const COMPOSIO_API_KEY = 'ak_suouXXwN2bd7UvBbjJvu';
const COMPOSIO_BASE_URL = 'https://backend.composio.dev/api/v1';
const BUSINESS_EMAIL = 'info@mtlcraftcocktails.com';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function makeComposioRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${COMPOSIO_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-API-Key': COMPOSIO_API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    const text = await response.text();
    
    if (!response.ok) {
      throw new Error(`API Error (${response.status}): ${text}`);
    }
    
    return text ? JSON.parse(text) : null;
  } catch (error: any) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

async function checkConnectedAccounts() {
  log('\n📋 Checking Connected Accounts...', colors.cyan);
  
  try {
    const accounts = await makeComposioRequest('/connectedAccounts');
    
    if (!accounts.items || accounts.items.length === 0) {
      log('❌ No connected accounts found', colors.red);
      return null;
    }
    
    log(`✅ Found ${accounts.items.length} connected account(s)`, colors.green);
    
    // Find Gmail account for business email
    const gmailAccount = accounts.items.find((item: any) => 
      item.appName === 'gmail' && 
      item.status === 'ACTIVE' &&
      item.clientUniqueUserId === BUSINESS_EMAIL
    );
    
    // Find Calendar account
    const calendarAccount = accounts.items.find((item: any) => 
      (item.appName === 'googlecalendar' || item.appName === 'google_calendar') && 
      item.status === 'ACTIVE' &&
      item.clientUniqueUserId === BUSINESS_EMAIL
    );
    
    if (gmailAccount) {
      log(`\n✅ Gmail Account Connected:`, colors.green);
      log(`   Email: ${BUSINESS_EMAIL}`, colors.cyan);
      log(`   Account ID: ${gmailAccount.id}`, colors.cyan);
      log(`   Status: ${gmailAccount.status}`, colors.green);
    } else {
      log(`\n❌ Gmail not connected for ${BUSINESS_EMAIL}`, colors.red);
    }
    
    if (calendarAccount) {
      log(`\n✅ Calendar Account Connected:`, colors.green);
      log(`   Account ID: ${calendarAccount.id}`, colors.cyan);
      log(`   Status: ${calendarAccount.status}`, colors.green);
    } else {
      log(`\n⚠️ Calendar not connected for ${BUSINESS_EMAIL}`, colors.yellow);
    }
    
    return { gmailAccount, calendarAccount };
  } catch (error: any) {
    log(`❌ Error checking accounts: ${error.message}`, colors.red);
    return null;
  }
}

async function testGmailActions(accountId: string) {
  log('\n📧 Testing Gmail Actions...', colors.cyan);
  
  // Test 1: List emails
  try {
    log('\n1. Testing email list...', colors.yellow);
    const response = await makeComposioRequest('/actions/gmail_list_emails/execute', {
      method: 'POST',
      body: JSON.stringify({
        connectedAccountId: accountId,
        input: {
          maxResults: 5,
          q: 'is:unread',
        },
      }),
    });
    
    if (response.result) {
      const emails = response.result.messages || [];
      log(`   ✅ Successfully fetched emails: ${emails.length} unread message(s)`, colors.green);
      
      // Display first few emails
      if (emails.length > 0) {
        log('\n   📬 Recent Unread Emails:', colors.cyan);
        emails.slice(0, 3).forEach((email: any, index: number) => {
          log(`      ${index + 1}. ID: ${email.id || 'Unknown'}`, colors.blue);
        });
      }
    } else {
      log(`   ⚠️ No emails returned`, colors.yellow);
    }
  } catch (error: any) {
    log(`   ❌ Failed to list emails: ${error.message}`, colors.red);
  }
  
  // Test 2: Get email details (if we have any emails)
  try {
    log('\n2. Testing email details fetch...', colors.yellow);
    const listResponse = await makeComposioRequest('/actions/gmail_list_emails/execute', {
      method: 'POST',
      body: JSON.stringify({
        connectedAccountId: accountId,
        input: {
          maxResults: 1,
        },
      }),
    });
    
    if (listResponse.result?.messages?.[0]) {
      const emailId = listResponse.result.messages[0].id;
      
      const detailResponse = await makeComposioRequest('/actions/gmail_get_email/execute', {
        method: 'POST',
        body: JSON.stringify({
          connectedAccountId: accountId,
          input: {
            id: emailId,
          },
        }),
      });
      
      if (detailResponse.result) {
        log(`   ✅ Successfully fetched email details`, colors.green);
        const headers = detailResponse.result.payload?.headers || [];
        const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No subject';
        const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown sender';
        log(`      Subject: ${subject}`, colors.blue);
        log(`      From: ${from}`, colors.blue);
      }
    } else {
      log(`   ⚠️ No emails available to test details`, colors.yellow);
    }
  } catch (error: any) {
    log(`   ❌ Failed to get email details: ${error.message}`, colors.red);
  }
}

async function testCalendarActions(accountId: string) {
  log('\n📅 Testing Calendar Actions...', colors.cyan);
  
  try {
    log('\n1. Testing calendar events list...', colors.yellow);
    
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    
    const response = await makeComposioRequest('/actions/googlecalendar_list_events/execute', {
      method: 'POST',
      body: JSON.stringify({
        connectedAccountId: accountId,
        input: {
          timeMin: startOfDay.toISOString(),
          timeMax: endOfDay.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
        },
      }),
    });
    
    if (response.result) {
      const events = response.result.items || [];
      log(`   ✅ Successfully fetched calendar: ${events.length} event(s) today`, colors.green);
      
      if (events.length > 0) {
        log('\n   📌 Today\'s Events:', colors.cyan);
        events.slice(0, 3).forEach((event: any, index: number) => {
          const start = event.start?.dateTime || event.start?.date || 'Unknown time';
          log(`      ${index + 1}. ${event.summary || 'Untitled'} at ${start}`, colors.blue);
        });
      }
    } else {
      log(`   ⚠️ No calendar data returned`, colors.yellow);
    }
  } catch (error: any) {
    log(`   ❌ Failed to list calendar events: ${error.message}`, colors.red);
  }
}

async function testServerEndpoints() {
  log('\n🖥️ Testing Server Endpoints...', colors.cyan);
  
  const serverUrl = 'http://localhost:3000';
  
  // Test status endpoint
  try {
    log('\n1. Testing /api/status...', colors.yellow);
    const response = await fetch(`${serverUrl}/api/status`);
    const data = await response.json();
    
    if (data.success) {
      log(`   ✅ Status endpoint working`, colors.green);
      log(`   Gmail: ${data.gmail.connected ? '✅ Connected' : '❌ Not connected'}`, 
          data.gmail.connected ? colors.green : colors.red);
      log(`   Calendar: ${data.calendar.connected ? '✅ Connected' : '❌ Not connected'}`,
          data.calendar.connected ? colors.green : colors.red);
    } else {
      log(`   ❌ Status check failed: ${data.error}`, colors.red);
    }
  } catch (error: any) {
    log(`   ⚠️ Server may not be running: ${error.message}`, colors.yellow);
    log(`   Run: cd email-calendar-agent && bun server.ts`, colors.cyan);
  }
  
  // Test voice command endpoint
  try {
    log('\n2. Testing /api/voice/command...', colors.yellow);
    
    const commands = [
      'Check my emails',
      'What\'s on my calendar today?',
    ];
    
    for (const command of commands) {
      const response = await fetch(`${serverUrl}/api/voice/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      const data = await response.json();
      
      if (data.success) {
        log(`   ✅ "${command}" -> ${data.response}`, colors.green);
      } else {
        log(`   ❌ "${command}" failed: ${data.error}`, colors.red);
      }
    }
  } catch (error: any) {
    log(`   ⚠️ Voice command test skipped (server not running)`, colors.yellow);
  }
}

// Main test runner
async function runTests() {
  log('\n' + '='.repeat(60), colors.magenta);
  log('🚀 Gmail Business Account Integration Test', colors.magenta);
  log(`📧 Testing: ${BUSINESS_EMAIL}`, colors.magenta);
  log('='.repeat(60), colors.magenta);
  
  // Check connected accounts
  const accounts = await checkConnectedAccounts();
  
  if (!accounts) {
    log('\n❌ Cannot proceed without connected accounts', colors.red);
    log('\nTo connect your account:', colors.yellow);
    log('1. Visit Composio dashboard', colors.cyan);
    log('2. Connect Gmail for info@mtlcraftcocktails.com', colors.cyan);
    log('3. Connect Google Calendar for the same account', colors.cyan);
    return;
  }
  
  // Test Gmail if connected
  if (accounts.gmailAccount) {
    await testGmailActions(accounts.gmailAccount.id);
  } else {
    log('\n⚠️ Skipping Gmail tests (not connected)', colors.yellow);
  }
  
  // Test Calendar if connected
  if (accounts.calendarAccount) {
    await testCalendarActions(accounts.calendarAccount.id);
  } else {
    log('\n⚠️ Skipping Calendar tests (not connected)', colors.yellow);
  }
  
  // Test server endpoints
  await testServerEndpoints();
  
  // Summary
  log('\n' + '='.repeat(60), colors.magenta);
  log('📊 Test Summary', colors.magenta);
  log('='.repeat(60), colors.magenta);
  
  if (accounts.gmailAccount && accounts.calendarAccount) {
    log('✅ Both Gmail and Calendar are connected!', colors.green);
    log('✅ Your voice agent is ready to use!', colors.green);
    log('\nTo start the voice agent:', colors.cyan);
    log('1. cd email-calendar-agent', colors.blue);
    log('2. bun server.ts', colors.blue);
    log('3. Open http://localhost:3000 in your browser', colors.blue);
    log('4. Click "Start Listening" and speak your commands!', colors.blue);
  } else {
    if (!accounts.gmailAccount) {
      log('❌ Gmail needs to be connected', colors.red);
    }
    if (!accounts.calendarAccount) {
      log('⚠️ Calendar is not connected (optional)', colors.yellow);
    }
  }
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, colors.red);
  process.exit(1);
});