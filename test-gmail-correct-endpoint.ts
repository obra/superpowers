#!/usr/bin/env bun

/**
 * Correct Gmail API Test
 * Uses the proper Composio endpoint for Gmail actions
 */

const COMPOSIO_API_KEY = 'ak_suouXXwN2bd7UvBbjJvu';
const COMPOSIO_BASE_URL = 'https://backend.composio.dev/api/v1';
const BUSINESS_EMAIL = 'info@mtlcraftcocktails.com';
const ACCOUNT_ID = '38df595d-3f5f-4dc7-b252-747cbc41f114';

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

async function testGmailWithCorrectEndpoint() {
  log('\n📧 Testing Gmail with Correct Endpoint...', colors.cyan);
  
  // First, let's check what actions are available
  try {
    log('\n1. Checking available Gmail actions...', colors.yellow);
    const actions = await makeComposioRequest('/actions?appNames=gmail');
    
    if (actions.items) {
      log(`   ✅ Found ${actions.items.length} Gmail actions`, colors.green);
      
      // Find the correct action names
      const listAction = actions.items.find((a: any) => 
        a.name.toLowerCase().includes('list') && 
        (a.name.toLowerCase().includes('email') || a.name.toLowerCase().includes('message'))
      );
      
      if (listAction) {
        log(`   📌 List emails action: ${listAction.name}`, colors.blue);
        
        // Now execute the action with the correct name
        log('\n2. Executing Gmail list action...', colors.yellow);
        const response = await makeComposioRequest('/actions/execute', {
          method: 'POST',
          body: JSON.stringify({
            actionId: listAction.name,
            connectedAccountId: ACCOUNT_ID,
            input: {
              maxResults: 5,
              q: 'is:unread',
            },
          }),
        });
        
        if (response.data) {
          log(`   ✅ Successfully executed Gmail action`, colors.green);
          console.log('   Response:', JSON.stringify(response.data, null, 2));
        }
      }
    }
  } catch (error: any) {
    log(`   ❌ Error: ${error.message}`, colors.red);
    
    // Try alternative approach
    log('\n3. Trying alternative execution method...', colors.yellow);
    try {
      const response = await makeComposioRequest('/actions/execute', {
        method: 'POST',
        body: JSON.stringify({
          actionName: 'GMAIL_LIST_EMAILS',
          connectedAccountId: ACCOUNT_ID,
          input: {
            maxResults: 5,
          },
        }),
      });
      
      log(`   ✅ Alternative method worked!`, colors.green);
      console.log('   Response:', JSON.stringify(response, null, 2));
    } catch (altError: any) {
      log(`   ❌ Alternative also failed: ${altError.message}`, colors.red);
    }
  }
}

async function testDirectExecution() {
  log('\n🎯 Testing Direct Action Execution...', colors.cyan);
  
  const testCases = [
    {
      name: 'GMAIL_LIST_EMAILS',
      input: { maxResults: 5 }
    },
    {
      name: 'gmail_list_emails',
      input: { maxResults: 5 }
    },
    {
      name: 'Gmail List Emails',
      input: { maxResults: 5 }
    }
  ];
  
  for (const testCase of testCases) {
    try {
      log(`\nTrying action name: ${testCase.name}`, colors.yellow);
      
      const response = await makeComposioRequest('/actions/execute', {
        method: 'POST',
        body: JSON.stringify({
          actionName: testCase.name,
          connectedAccountId: ACCOUNT_ID,
          input: testCase.input,
        }),
      });
      
      if (response) {
        log(`   ✅ Success with ${testCase.name}!`, colors.green);
        
        // Parse the response properly
        if (response.data?.messages) {
          const messages = response.data.messages;
          log(`   📬 Found ${messages.length} email(s)`, colors.blue);
          
          // Get details for first email if available
          if (messages.length > 0) {
            await getEmailDetails(messages[0].id);
          }
        } else if (response.result) {
          log(`   📊 Result:`, colors.blue);
          console.log(JSON.stringify(response.result, null, 2));
        }
        
        return true; // Found working method
      }
    } catch (error: any) {
      log(`   ❌ Failed: ${error.message.substring(0, 100)}...`, colors.red);
    }
  }
  
  return false;
}

async function getEmailDetails(messageId: string) {
  log(`\n📨 Getting details for message ${messageId}...`, colors.cyan);
  
  try {
    const response = await makeComposioRequest('/actions/execute', {
      method: 'POST',
      body: JSON.stringify({
        actionName: 'GMAIL_GET_EMAIL',
        connectedAccountId: ACCOUNT_ID,
        input: {
          messageId: messageId,
          id: messageId,
        },
      }),
    });
    
    if (response.data) {
      const headers = response.data.payload?.headers || [];
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No subject';
      const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
      const date = headers.find((h: any) => h.name === 'Date')?.value || 'Unknown date';
      
      log(`   ✅ Email Details:`, colors.green);
      log(`      Subject: ${subject}`, colors.blue);
      log(`      From: ${from}`, colors.blue);
      log(`      Date: ${date}`, colors.blue);
    }
  } catch (error: any) {
    log(`   ⚠️ Could not get email details: ${error.message.substring(0, 50)}...`, colors.yellow);
  }
}

// Start the server
async function startServer() {
  log('\n🚀 Starting Email/Calendar Server...', colors.cyan);
  
  try {
    // Check if server is already running
    const response = await fetch('http://localhost:3000/api/status');
    const data = await response.json();
    
    if (data.success) {
      log('✅ Server is already running!', colors.green);
      return true;
    }
  } catch {
    // Server not running, start it
    log('Starting server in background...', colors.yellow);
    
    const { spawn } = await import('child_process');
    const serverProcess = spawn('bun', ['email-calendar-agent/server.ts'], {
      detached: true,
      stdio: 'ignore',
    });
    
    serverProcess.unref();
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const response = await fetch('http://localhost:3000/api/status');
      const data = await response.json();
      
      if (data.success) {
        log('✅ Server started successfully!', colors.green);
        return true;
      }
    } catch {
      log('⚠️ Server may take longer to start. Please run manually:', colors.yellow);
      log('   cd email-calendar-agent && bun server.ts', colors.cyan);
    }
  }
  
  return false;
}

// Main test runner
async function runTests() {
  log('\n' + '='.repeat(60), colors.magenta);
  log('🚀 Gmail Business Account Test (Corrected)', colors.magenta);
  log(`📧 Account: ${BUSINESS_EMAIL}`, colors.magenta);
  log(`🔑 Account ID: ${ACCOUNT_ID}`, colors.magenta);
  log('='.repeat(60), colors.magenta);
  
  // Test Gmail actions
  await testGmailWithCorrectEndpoint();
  
  // Try direct execution methods
  const success = await testDirectExecution();
  
  if (success) {
    // Start the server
    const serverStarted = await startServer();
    
    if (serverStarted) {
      log('\n' + '='.repeat(60), colors.magenta);
      log('✅ System Ready!', colors.green);
      log('='.repeat(60), colors.magenta);
      log('\n🎤 Your voice agent is ready!', colors.green);
      log('   Open http://localhost:3000 in your browser', colors.cyan);
      log('   Click "Start Listening" and try:', colors.cyan);
      log('   • "Check my emails"', colors.blue);
      log('   • "Any new messages?"', colors.blue);
      log('   • "Read my unread emails"', colors.blue);
    }
  } else {
    log('\n⚠️ Could not find correct action format', colors.yellow);
    log('Please check Composio dashboard for proper action names', colors.cyan);
  }
}

// Run the tests
runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, colors.red);
  process.exit(1);
});