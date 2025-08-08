#!/usr/bin/env bun

/**
 * Composio Credential Test
 * Testing new credentials provided by user
 */

import axios from 'axios';

const COMPOSIO_CREDENTIALS = {
  accessToken: 'oak_ZXHQaIMH4guJQOF6oNzZ',
  apiKey: 'ak_suouXXwN2bd7UvBbjJvu',
  webhookSecret: 'a34a915ff37056c6e47a7d23b0b8dcf00f39a30d23c2e3cd36790b99',
  projectId: '7a5bLnI27eBL',
  baseUrl: 'https://api.composio.dev/api/v1'
};

async function testComposioAuth() {
  console.log('🔐 Testing Composio Authentication...\n');
  
  try {
    // Test 1: Basic API authentication
    console.log('Test 1: Verifying API Key...');
    const authResponse = await axios.get(`${COMPOSIO_CREDENTIALS.baseUrl}/connectedAccounts`, {
      headers: {
        'X-API-Key': COMPOSIO_CREDENTIALS.apiKey,
        'Authorization': `Bearer ${COMPOSIO_CREDENTIALS.accessToken}`
      }
    });
    
    console.log('✅ Authentication successful!');
    console.log('Connected accounts:', authResponse.data);
    
    // Test 2: Check available integrations
    console.log('\nTest 2: Checking available integrations...');
    const integrationsResponse = await axios.get(`${COMPOSIO_CREDENTIALS.baseUrl}/integrations`, {
      headers: {
        'X-API-Key': COMPOSIO_CREDENTIALS.apiKey,
        'Authorization': `Bearer ${COMPOSIO_CREDENTIALS.accessToken}`
      }
    });
    
    const googleIntegrations = integrationsResponse.data.items?.filter((item: any) => 
      item.name?.toLowerCase().includes('google') || 
      item.name?.toLowerCase().includes('gmail') ||
      item.name?.toLowerCase().includes('calendar')
    );
    
    console.log('✅ Found Google integrations:', googleIntegrations?.map((i: any) => i.name));
    
    // Test 3: Check if Gmail/Calendar is connected
    console.log('\nTest 3: Checking Gmail/Calendar connection status...');
    const connectionsResponse = await axios.get(`${COMPOSIO_CREDENTIALS.baseUrl}/connectedAccounts`, {
      headers: {
        'X-API-Key': COMPOSIO_CREDENTIALS.apiKey,
        'Authorization': `Bearer ${COMPOSIO_CREDENTIALS.accessToken}`
      },
      params: {
        integration_id: 'gmail'
      }
    });
    
    if (connectionsResponse.data.items?.length > 0) {
      console.log('✅ Gmail connected!', connectionsResponse.data.items[0]);
    } else {
      console.log('⚠️  Gmail not connected yet. Need to initiate OAuth flow.');
      
      // Get OAuth URL for Gmail
      console.log('\nGenerating OAuth URL for Gmail...');
      const oauthResponse = await axios.post(`${COMPOSIO_CREDENTIALS.baseUrl}/connectedAccounts`, {
        integrationId: 'gmail',
        redirectUri: 'http://localhost:3000/callback'
      }, {
        headers: {
          'X-API-Key': COMPOSIO_CREDENTIALS.apiKey,
          'Authorization': `Bearer ${COMPOSIO_CREDENTIALS.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('OAuth URL:', oauthResponse.data.authUrl);
    }
    
    return {
      success: true,
      credentials: COMPOSIO_CREDENTIALS,
      authStatus: 'verified'
    };
    
  } catch (error: any) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Headers used:', {
      'X-API-Key': COMPOSIO_CREDENTIALS.apiKey.substring(0, 10) + '...',
      'Authorization': 'Bearer ' + COMPOSIO_CREDENTIALS.accessToken.substring(0, 10) + '...'
    });
    
    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

// Run the test
console.log('🚀 Starting Composio Credential Test');
console.log('=====================================\n');

testComposioAuth()
  .then(result => {
    console.log('\n=====================================');
    console.log('Test Complete:', result.success ? '✅ SUCCESS' : '❌ FAILED');
    if (result.success) {
      console.log('\n📋 Next Steps:');
      console.log('1. Save credentials to environment');
      console.log('2. Set up OAuth flow for Gmail/Calendar');
      console.log('3. Begin implementing voice agent');
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
  });