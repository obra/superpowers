#!/usr/bin/env bun

// Test the new Composio access token with correct API
import { ComposioToolSet } from 'composio-core';

const COMPOSIO_API_KEY = 'oak_ZXHQaIMH4guJQOF6oNzZ';

async function testComposioGmail() {
  console.log('Testing new Composio access token...');
  console.log('Token:', COMPOSIO_API_KEY.substring(0, 10) + '...');
  
  try {
    // Initialize Composio ToolSet (the correct way according to docs)
    const toolset = new ComposioToolSet({
      apiKey: COMPOSIO_API_KEY
    });
    
    // Test 1: Get available tools
    console.log('\n1. Getting available tools...');
    const tools = await toolset.getTools({
      apps: ['gmail']
    });
    console.log('✓ Gmail tools found:', tools.length);
    
    // List available Gmail actions
    if (tools.length > 0) {
      console.log('\nAvailable Gmail actions:');
      tools.slice(0, 10).forEach((tool: any) => {
        console.log(`  - ${tool.name}: ${tool.description || 'No description'}`);
      });
    }
    
    // Test 2: Get entity for execution
    console.log('\n2. Getting entity...');
    const entity = await toolset.getEntity('default');
    console.log('✓ Entity retrieved:', entity.id);
    
    // Test 3: Execute a simple Gmail action (list labels)
    console.log('\n3. Testing Gmail API access...');
    const result = await toolset.executeAction({
      action: 'GMAIL_LIST_LABELS',
      params: {},
      entityId: entity.id
    });
    
    console.log('✓ Gmail labels retrieved:', result);
    
    console.log('\n✅ SUCCESS! Token is valid and we ARE using the Gmail toolkit from Composio!');
    console.log('✅ This matches the pattern from https://docs.composio.dev/toolkits/gmail');
    return true;
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data || error.response);
    }
    return false;
  }
}

// Run the test
testComposioGmail();