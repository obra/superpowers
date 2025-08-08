#!/usr/bin/env bun

/**
 * Composio V2 API Test
 * Using the correct v2 API endpoints
 */

const COMPOSIO_API_KEY = 'ak_suouXXwN2bd7UvBbjJvu';
const COMPOSIO_BASE_URL = 'https://backend.composio.dev/api/v2'; // v2 API
const BUSINESS_EMAIL = 'info@mtlcraftcocktails.com';
const ACCOUNT_ID = '38df595d-3f5f-4dc7-b252-747cbc41f114';

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

async function composioRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${COMPOSIO_BASE_URL}${endpoint}`;
  
  log(`\n🔍 Request: ${options.method || 'GET'} ${url}`, colors.cyan);
  
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

async function testActionsEndpoint() {
  log('\n📋 Testing Actions Endpoint...', colors.cyan);
  
  try {
    // Test v2 actions endpoint
    const response = await composioRequest('/actions', {
      method: 'GET',
    });
    
    if (response.items) {
      log(`✅ Found ${response.items.length} total actions`, colors.green);
      
      // Find Gmail actions
      const gmailActions = response.items.filter((action: any) => 
        action.appKey === 'gmail' || action.appName === 'gmail'
      );
      
      log(`📧 Found ${gmailActions.length} Gmail actions`, colors.blue);
      
      if (gmailActions.length > 0) {
        // Show first few Gmail actions
        gmailActions.slice(0, 5).forEach((action: any) => {
          log(`   • ${action.name}: ${action.display_name || action.description}`, colors.cyan);
        });
      }
      
      return gmailActions;
    }
  } catch (error: any) {
    log(`❌ Failed to get actions: ${error.message}`, colors.red);
  }
  
  return [];
}

async function executeGmailAction(actionName: string, input: any) {
  log(`\n🚀 Executing action: ${actionName}`, colors.cyan);
  
  try {
    // Try v2 execute endpoint
    const response = await composioRequest('/actions/execute', {
      method: 'POST',
      body: JSON.stringify({
        connectedAccountId: ACCOUNT_ID,
        actionName: actionName,
        input: input,
      }),
    });
    
    if (response) {
      log(`✅ Action executed successfully!`, colors.green);
      return response;
    }
  } catch (error: any) {
    // Try alternative format
    try {
      const response = await composioRequest('/actions/execute', {
        method: 'POST',
        body: JSON.stringify({
          connectedAccountId: ACCOUNT_ID,
          actionId: actionName,
          params: input,
        }),
      });
      
      if (response) {
        log(`✅ Action executed with alternative format!`, colors.green);
        return response;
      }
    } catch (altError: any) {
      log(`❌ Failed to execute: ${altError.message.substring(0, 100)}`, colors.red);
    }
  }
  
  return null;
}

async function testGmailIntegration() {
  log('\n' + '='.repeat(60), colors.magenta);
  log('🔧 Composio V2 API Gmail Test', colors.magenta);
  log(`📧 Business Email: ${BUSINESS_EMAIL}`, colors.magenta);
  log('='.repeat(60), colors.magenta);
  
  // First, get available actions
  const gmailActions = await testActionsEndpoint();
  
  // Try to find and execute list emails action
  const listActions = gmailActions.filter((a: any) => 
    a.name.toLowerCase().includes('list') && 
    (a.name.toLowerCase().includes('email') || a.name.toLowerCase().includes('message'))
  );
  
  if (listActions.length > 0) {
    log(`\n📬 Testing email list with action: ${listActions[0].name}`, colors.cyan);
    
    const result = await executeGmailAction(listActions[0].name, {
      maxResults: 5,
      q: 'is:unread',
    });
    
    if (result) {
      log('📧 Email list result:', colors.green);
      console.log(JSON.stringify(result, null, 2));
    }
  }
  
  // Try common action names
  log('\n🎯 Testing common action names...', colors.cyan);
  
  const commonNames = [
    'gmail_list_emails',
    'GMAIL_LIST_EMAILS',
    'gmail-list-emails',
    'gmail_fetch_emails',
    'gmail_get_emails',
  ];
  
  for (const actionName of commonNames) {
    const result = await executeGmailAction(actionName, {
      maxResults: 3,
    });
    
    if (result) {
      log(`\n✅ SUCCESS with action: ${actionName}`, colors.green);
      
      // Parse result
      if (result.data) {
        log('📊 Response data:', colors.blue);
        console.log(JSON.stringify(result.data, null, 2));
      } else if (result.result) {
        log('📊 Response result:', colors.blue);
        console.log(JSON.stringify(result.result, null, 2));
      }
      
      break; // Found working action
    }
  }
}

// Check connections first
async function checkConnections() {
  log('\n🔗 Checking Connected Accounts...', colors.cyan);
  
  try {
    // Use v1 for connected accounts (this endpoint works)
    const response = await fetch('https://backend.composio.dev/api/v1/connectedAccounts', {
      headers: {
        'X-API-Key': COMPOSIO_API_KEY,
        'Accept': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (data.items) {
      const gmailAccount = data.items.find((item: any) => 
        item.appName === 'gmail' && 
        item.clientUniqueUserId === BUSINESS_EMAIL
      );
      
      if (gmailAccount) {
        log(`✅ Gmail connected for ${BUSINESS_EMAIL}`, colors.green);
        log(`   ID: ${gmailAccount.id}`, colors.cyan);
        log(`   Status: ${gmailAccount.status}`, colors.green);
        return true;
      } else {
        log(`❌ Gmail not found for ${BUSINESS_EMAIL}`, colors.red);
        return false;
      }
    }
  } catch (error: any) {
    log(`❌ Failed to check connections: ${error.message}`, colors.red);
    return false;
  }
}

// Main runner
async function main() {
  const connected = await checkConnections();
  
  if (connected) {
    await testGmailIntegration();
  } else {
    log('\n⚠️ Please connect Gmail first', colors.yellow);
  }
  
  log('\n📌 Next Steps:', colors.cyan);
  log('1. Start the server: cd email-calendar-agent && bun server.ts', colors.blue);
  log('2. Open http://localhost:3000', colors.blue);
  log('3. Test voice commands', colors.blue);
}

main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, colors.red);
  process.exit(1);
});