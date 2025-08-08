#!/usr/bin/env bun

/**
 * Composio Authentication Test with New Credentials
 * Testing connectivity with provided API key and access token
 */

import fetch from 'node-fetch';

const COMPOSIO_CREDENTIALS = {
  apiKey: 'dc30994b-fe42-495a-a346-809e8f95ee49',
  accessToken: 'oak_ZXHQaIMH4guJQOF6oNzZ',
  sdk: '066d2270-4a4e-422f-b290-39cf50735c2b',
  webhookSecret: 'a34a915ff37056c6e47a7d23b0b8dcf00f39a30d23c2e9f943d4e3cd36790b99',
  userId: '7a5bLnI27eBL'
};

async function testComposioAuth() {
  console.log('=== COMPOSIO AUTHENTICATION TEST ===');
  console.log(`API Key: ${COMPOSIO_CREDENTIALS.apiKey.substring(0, 8)}...`);
  console.log(`Access Token: ${COMPOSIO_CREDENTIALS.accessToken.substring(0, 8)}...`);
  console.log(`User ID: ${COMPOSIO_CREDENTIALS.userId}`);
  console.log('');

  const tests = [];

  // Test 1: Check API Key validity
  console.log('Test 1: Validating API Key...');
  try {
    const response = await fetch('https://api.composio.dev/v1/client/auth/client_info', {
      method: 'GET',
      headers: {
        'X-API-Key': COMPOSIO_CREDENTIALS.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Key is valid');
      console.log(`   Client info:`, JSON.stringify(data, null, 2));
      tests.push({ name: 'API Key Validation', status: 'PASS', data });
    } else {
      const errorText = await response.text();
      console.log('❌ API Key validation failed:', response.status, errorText);
      tests.push({ name: 'API Key Validation', status: 'FAIL', error: errorText });
    }
  } catch (error) {
    console.log('❌ Failed to validate API key:', error);
    tests.push({ name: 'API Key Validation', status: 'FAIL', error: error.message });
  }

  // Test 2: Check available integrations
  console.log('\nTest 2: Checking available integrations...');
  try {
    const response = await fetch('https://api.composio.dev/v1/integrations', {
      method: 'GET',
      headers: {
        'X-API-Key': COMPOSIO_CREDENTIALS.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const gmailIntegration = data.find(i => i.name?.toLowerCase().includes('gmail'));
      const calendarIntegration = data.find(i => i.name?.toLowerCase().includes('calendar'));
      
      console.log('✅ Integrations fetched successfully');
      console.log(`   Gmail available: ${gmailIntegration ? 'Yes' : 'No'}`);
      console.log(`   Calendar available: ${calendarIntegration ? 'Yes' : 'No'}`);
      tests.push({ 
        name: 'Integration Check', 
        status: 'PASS', 
        data: { gmail: !!gmailIntegration, calendar: !!calendarIntegration }
      });
    } else {
      const errorText = await response.text();
      console.log('❌ Failed to fetch integrations:', response.status, errorText);
      tests.push({ name: 'Integration Check', status: 'FAIL', error: errorText });
    }
  } catch (error) {
    console.log('❌ Failed to check integrations:', error);
    tests.push({ name: 'Integration Check', status: 'FAIL', error: error.message });
  }

  // Test 3: Check connected accounts
  console.log('\nTest 3: Checking connected accounts...');
  try {
    const response = await fetch(`https://api.composio.dev/v1/connected_accounts`, {
      method: 'GET',
      headers: {
        'X-API-Key': COMPOSIO_CREDENTIALS.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Connected accounts fetched');
      console.log(`   Total accounts: ${data.length || 0}`);
      if (data.length > 0) {
        data.forEach(account => {
          console.log(`   - ${account.integration}: ${account.status}`);
        });
      }
      tests.push({ name: 'Connected Accounts', status: 'PASS', data });
    } else {
      const errorText = await response.text();
      console.log('❌ Failed to fetch connected accounts:', response.status, errorText);
      tests.push({ name: 'Connected Accounts', status: 'FAIL', error: errorText });
    }
  } catch (error) {
    console.log('❌ Failed to check connected accounts:', error);
    tests.push({ name: 'Connected Accounts', status: 'FAIL', error: error.message });
  }

  // Test 4: Check entity/user existence
  console.log('\nTest 4: Checking user entity...');
  try {
    const response = await fetch(`https://api.composio.dev/v1/entity/${COMPOSIO_CREDENTIALS.userId}`, {
      method: 'GET',
      headers: {
        'X-API-Key': COMPOSIO_CREDENTIALS.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ User entity found');
      console.log(`   Entity ID: ${data.id || COMPOSIO_CREDENTIALS.userId}`);
      console.log(`   Created: ${data.created_at || 'N/A'}`);
      tests.push({ name: 'User Entity', status: 'PASS', data });
    } else if (response.status === 404) {
      console.log('⚠️  User entity not found - may need to be created');
      tests.push({ name: 'User Entity', status: 'WARN', message: 'Entity not found' });
    } else {
      const errorText = await response.text();
      console.log('❌ Failed to check user entity:', response.status, errorText);
      tests.push({ name: 'User Entity', status: 'FAIL', error: errorText });
    }
  } catch (error) {
    console.log('❌ Failed to check user entity:', error);
    tests.push({ name: 'User Entity', status: 'FAIL', error: error.message });
  }

  // Test 5: Try to initialize Gmail connection
  console.log('\nTest 5: Checking Gmail connection readiness...');
  try {
    const response = await fetch('https://api.composio.dev/v1/actions', {
      method: 'GET',
      headers: {
        'X-API-Key': COMPOSIO_CREDENTIALS.apiKey,
        'Content-Type': 'application/json'
      },
      params: {
        app: 'gmail'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const gmailActions = data.filter(a => a.app === 'gmail' || a.app === 'GMAIL');
      console.log(`✅ Gmail actions available: ${gmailActions.length}`);
      if (gmailActions.length > 0) {
        console.log('   Sample actions:', gmailActions.slice(0, 3).map(a => a.name).join(', '));
      }
      tests.push({ name: 'Gmail Actions', status: 'PASS', data: { count: gmailActions.length } });
    } else {
      const errorText = await response.text();
      console.log('❌ Failed to fetch Gmail actions:', response.status, errorText);
      tests.push({ name: 'Gmail Actions', status: 'FAIL', error: errorText });
    }
  } catch (error) {
    console.log('❌ Failed to check Gmail actions:', error);
    tests.push({ name: 'Gmail Actions', status: 'FAIL', error: error.message });
  }

  // Summary
  console.log('\n=== AUTHENTICATION TEST SUMMARY ===');
  const passCount = tests.filter(t => t.status === 'PASS').length;
  const failCount = tests.filter(t => t.status === 'FAIL').length;
  const warnCount = tests.filter(t => t.status === 'WARN').length;
  
  tests.forEach(test => {
    const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${test.name}: ${test.status}`);
  });

  console.log(`\nResults: ${passCount} passed, ${failCount} failed, ${warnCount} warnings`);

  // Next steps
  if (failCount === 0) {
    console.log('\n✅ AUTHENTICATION SUCCESSFUL!');
    console.log('Next steps:');
    console.log('1. Set up OAuth connection for Gmail/Calendar if not already done');
    console.log('2. Create or verify user entity in Composio');
    console.log('3. Test actual Gmail/Calendar API calls');
  } else {
    console.log('\n❌ AUTHENTICATION ISSUES DETECTED');
    console.log('Please verify:');
    console.log('1. API key is correct and active');
    console.log('2. Account has proper permissions');
    console.log('3. Gmail/Calendar apps are enabled in Composio');
  }

  return tests;
}

// Run the test
console.log('Starting Composio authentication test...\n');
testComposioAuth()
  .then((results) => {
    console.log('\nTest execution complete.');
    process.exit(results.some(r => r.status === 'FAIL') ? 1 : 0);
  })
  .catch((error) => {
    console.error('Fatal error during testing:', error);
    process.exit(1);
  });