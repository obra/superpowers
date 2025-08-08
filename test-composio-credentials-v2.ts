#!/usr/bin/env bun

/**
 * Composio Credential Test V2
 * Testing with correct API endpoints
 */

const COMPOSIO_CREDENTIALS = {
  accessToken: 'oak_ZXHQaIMH4guJQOF6oNzZ',
  apiKey: 'ak_suouXXwN2bd7UvBbjJvu',
  webhookSecret: 'a34a915ff37056c6e47a7d23b0b8dcf00f39a30d23c2e3cd36790b99',
  projectId: '7a5bLnI27eBL',
  baseUrl: 'https://backend.composio.dev/api/v1'  // Corrected URL
};

async function testComposioAuth() {
  console.log('🔐 Testing Composio Authentication...\n');
  
  try {
    // Test 1: Get connected accounts
    console.log('Test 1: Checking connected accounts...');
    const response = await fetch(`${COMPOSIO_CREDENTIALS.baseUrl}/connectedAccounts`, {
      method: 'GET',
      headers: {
        'X-API-Key': COMPOSIO_CREDENTIALS.apiKey,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ API Key is valid!');
    console.log('Response:', JSON.stringify(data, null, 2));
    
    // Test 2: Check for Gmail/Calendar apps
    console.log('\nTest 2: Checking available apps...');
    const appsResponse = await fetch(`${COMPOSIO_CREDENTIALS.baseUrl}/apps`, {
      method: 'GET',
      headers: {
        'X-API-Key': COMPOSIO_CREDENTIALS.apiKey,
        'Accept': 'application/json'
      }
    });
    
    if (appsResponse.ok) {
      const appsData = await appsResponse.json();
      const relevantApps = appsData.items?.filter((app: any) => 
        app.key === 'gmail' || 
        app.key === 'googlecalendar' ||
        app.name?.toLowerCase().includes('gmail') ||
        app.name?.toLowerCase().includes('calendar')
      );
      
      console.log('✅ Found relevant apps:', relevantApps?.map((a: any) => ({ 
        key: a.key, 
        name: a.name 
      })));
    }
    
    // Test 3: Get available actions for Gmail
    console.log('\nTest 3: Checking Gmail actions...');
    const actionsResponse = await fetch(`${COMPOSIO_CREDENTIALS.baseUrl}/actions?appNames=gmail`, {
      method: 'GET',
      headers: {
        'X-API-Key': COMPOSIO_CREDENTIALS.apiKey,
        'Accept': 'application/json'
      }
    });
    
    if (actionsResponse.ok) {
      const actionsData = await actionsResponse.json();
      console.log(`✅ Found ${actionsData.items?.length || 0} Gmail actions available`);
      
      // Show first few actions
      const sampleActions = actionsData.items?.slice(0, 5).map((a: any) => ({
        name: a.name,
        description: a.description
      }));
      console.log('Sample actions:', sampleActions);
    }
    
    return {
      success: true,
      credentials: COMPOSIO_CREDENTIALS,
      message: 'Credentials validated successfully'
    };
    
  } catch (error: any) {
    console.error('❌ Authentication failed:', error.message);
    
    // Try alternative endpoint
    console.log('\nTrying alternative endpoint...');
    try {
      const altResponse = await fetch('https://api.composio.dev/api/v1/connectedAccounts', {
        method: 'GET',
        headers: {
          'X-API-Key': COMPOSIO_CREDENTIALS.apiKey,
          'Accept': 'application/json'
        }
      });
      
      if (altResponse.ok) {
        console.log('✅ Alternative endpoint works!');
        const altData = await altResponse.json();
        console.log('Response:', JSON.stringify(altData, null, 2));
        return {
          success: true,
          credentials: { ...COMPOSIO_CREDENTIALS, baseUrl: 'https://api.composio.dev/api/v1' },
          message: 'Credentials validated with alternative endpoint'
        };
      }
    } catch (altError: any) {
      console.error('Alternative endpoint also failed:', altError.message);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
console.log('🚀 Starting Composio Credential Test V2');
console.log('========================================\n');

testComposioAuth()
  .then(result => {
    console.log('\n========================================');
    console.log('Test Complete:', result.success ? '✅ SUCCESS' : '❌ FAILED');
    
    if (result.success) {
      console.log('\n📋 Next Steps:');
      console.log('1. Save working credentials to .env');
      console.log('2. Connect Gmail/Calendar accounts');
      console.log('3. Implement voice agent with these APIs');
      console.log('\n💾 Working Configuration:');
      console.log(`COMPOSIO_API_KEY=${result.credentials.apiKey}`);
      console.log(`COMPOSIO_ACCESS_TOKEN=${result.credentials.accessToken}`);
      console.log(`COMPOSIO_BASE_URL=${result.credentials.baseUrl}`);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
  });