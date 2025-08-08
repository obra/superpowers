#!/usr/bin/env bun

// Test the new Composio access token
import { Composio } from '@composio/core';

const COMPOSIO_API_KEY = 'oak_ZXHQaIMH4guJQOF6oNzZ';

async function testComposioGmail() {
  console.log('Testing new Composio access token...');
  console.log('Token:', COMPOSIO_API_KEY.substring(0, 10) + '...');
  
  try {
    // Initialize Composio client
    const client = new Composio({
      apiKey: COMPOSIO_API_KEY,
      baseUrl: 'https://backend.composio.dev'
    });
    
    // Test 1: Get connected accounts
    console.log('\n1. Testing connected accounts...');
    const entities = await client.getEntity('default');
    console.log('✓ Entity retrieved:', entities);
    
    // Test 2: Get integrations
    console.log('\n2. Testing integrations...');
    const integrations = await client.getIntegrations();
    console.log('✓ Available integrations:', integrations.items?.length || 0);
    
    // Test 3: Check Gmail integration
    console.log('\n3. Checking Gmail integration...');
    const gmailIntegration = integrations.items?.find((i: any) => 
      i.name?.toLowerCase() === 'gmail' || i.appName?.toLowerCase() === 'gmail'
    );
    console.log('✓ Gmail integration found:', !!gmailIntegration);
    
    // Test 4: Get Gmail actions
    console.log('\n4. Getting Gmail actions...');
    const actions = await client.getActions({
      apps: ['gmail']
    });
    console.log('✓ Gmail actions available:', actions.items?.length || 0);
    
    // List some available actions
    if (actions.items && actions.items.length > 0) {
      console.log('\nAvailable Gmail actions:');
      actions.items.slice(0, 5).forEach((action: any) => {
        console.log(`  - ${action.name}: ${action.description}`);
      });
    }
    
    console.log('\n✅ Token is valid and Gmail toolkit is accessible!');
    return true;
    
  } catch (error: any) {
    console.error('\n❌ Error testing Composio:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Run the test
testComposioGmail();