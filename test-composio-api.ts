#!/usr/bin/env tsx
/**
 * Test Composio API to understand the actual methods available
 */

import * as dotenv from 'dotenv';
import { Composio } from 'composio-core';

// Load environment variables
dotenv.config({ path: '/Users/ashleytower/.env' });

async function testComposioAPI() {
  console.log('Testing Composio API...\n');
  
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) {
    console.error('❌ COMPOSIO_API_KEY not found in environment');
    return;
  }
  
  console.log(`API Key: ${apiKey.substring(0, 8)}...`);
  
  try {
    // Initialize Composio with just the API key
    const client = new Composio(apiKey);
    
    console.log('\n✅ Composio client created');
    console.log('Available methods on client:');
    console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(client)).filter(m => !m.startsWith('_')));
    
    // Try to get connected accounts
    console.log('\n📋 Attempting to get connected accounts...');
    const connectedAccounts = await client.connectedAccounts.list();
    console.log('Connected accounts:', connectedAccounts);
    
    // Try to get available apps
    console.log('\n📱 Attempting to get available apps...');
    const apps = await client.apps.list();
    console.log('Available apps:', apps.items?.slice(0, 5).map((app: any) => app.name));
    
    // Try to get available actions for Gmail
    console.log('\n📧 Attempting to get Gmail actions...');
    const actions = await client.actions.list({ apps: ['gmail'] });
    console.log('Gmail actions available:', actions.items?.slice(0, 5).map((action: any) => action.name));
    
    // Check if we have a connected Gmail account
    const gmailAccount = connectedAccounts.items?.find((acc: any) => 
      acc.appName?.toLowerCase() === 'gmail' || acc.appUniqueId?.includes('gmail')
    );
    
    if (gmailAccount) {
      console.log('\n✅ Found Gmail account:', gmailAccount.id);
      
      // Try to execute a simple Gmail action
      console.log('\n🔧 Attempting to execute Gmail action...');
      const result = await client.actions.execute({
        actionName: 'gmail_list_emails',
        connectedAccountId: gmailAccount.id,
        input: {
          max_results: 5
        }
      });
      console.log('Gmail action result:', result);
    } else {
      console.log('\n⚠️  No Gmail account connected. You may need to connect one first.');
      console.log('Visit: https://app.composio.dev to connect your Gmail account');
    }
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    console.error('Full error:', error);
  }
}

testComposioAPI();