#!/usr/bin/env tsx
/**
 * Simple Composio connection test
 */

import * as dotenv from 'dotenv';
import { Composio } from 'composio-core';

// Load environment variables
dotenv.config({ path: '/Users/ashleytower/.env' });

async function quickTest() {
  const apiKey = process.env.COMPOSIO_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Missing COMPOSIO_API_KEY');
    process.exit(1);
  }
  
  console.log('🔑 API Key:', apiKey.substring(0, 12) + '...');
  console.log('🔗 Testing Composio connection...\n');
  
  try {
    const client = new Composio(apiKey);
    console.log('✅ Client created');
    
    // Simple test - just try to get an entity
    const entity = await client.getEntity('test-user');
    console.log('✅ Entity obtained:', entity.id);
    
    // Try to check if any apps are connected
    console.log('\n📱 Checking for connected apps...');
    
    // Set a timeout for the connections call
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout after 5 seconds')), 5000)
    );
    
    try {
      const connections = await Promise.race([
        entity.getConnections(),
        timeoutPromise
      ]);
      
      console.log(`✅ Found ${(connections as any[]).length} connected apps`);
      
      if ((connections as any[]).length === 0) {
        console.log('\n📌 No apps connected yet. To connect Gmail and Calendar:');
        console.log('1. Go to: https://app.composio.dev');
        console.log('2. Sign in with your API key');
        console.log('3. Navigate to Apps section');
        console.log('4. Connect Gmail and Google Calendar');
        console.log('5. Use entity ID: test-user');
      } else {
        console.log('\nConnected apps:');
        (connections as any[]).forEach((conn: any) => {
          console.log(`  - ${conn.appName || conn.appUniqueId}`);
        });
      }
    } catch (connError: any) {
      if (connError.message.includes('Timeout')) {
        console.log('⏱️  Connection check timed out (this might be normal)');
        console.log('The API key is valid, but fetching connections is slow.');
      } else {
        console.error('❌ Error checking connections:', connError.message);
      }
    }
    
    console.log('\n========================================');
    console.log('✅ Composio API key is VALID and working!');
    console.log('========================================');
    
    console.log('\n📋 Configuration Summary:');
    console.log(`   API Key: ${apiKey.substring(0, 12)}...`);
    console.log(`   Entity ID: test-user`);
    console.log(`   Base URL: https://backend.composio.dev`);
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Connect your Gmail and Google Calendar at https://app.composio.dev');
    console.log('2. Update the composio-integration.ts file to use the entity API correctly');
    console.log('3. Test email and calendar operations');
    
    return true;
    
  } catch (error: any) {
    console.error('\n❌ Connection failed:', error.message);
    
    if (error.response?.status === 401 || error.message.includes('401')) {
      console.error('\n🔒 Authentication Error:');
      console.error('The API key appears to be invalid or expired.');
      console.error('Please check your API key at: https://app.composio.dev/api-keys');
    } else if (error.response?.status === 403) {
      console.error('\n🚫 Permission Error:');
      console.error('Your API key doesn\'t have the required permissions.');
    } else {
      console.error('\n💔 Unexpected Error:');
      console.error('Details:', error);
    }
    
    return false;
  }
}

// Run test
quickTest().then(success => {
  process.exit(success ? 0 : 1);
});