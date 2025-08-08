#!/usr/bin/env bun

// Final test with correct import
import { ComposioToolSet } from '@composio/core';

const COMPOSIO_API_KEY = 'oak_ZXHQaIMH4guJQOF6oNzZ';
const ENTITY_ID = 'default';

async function testComposioGmailToolkit() {
  console.log('='.repeat(60));
  console.log('TESTING COMPOSIO GMAIL TOOLKIT');
  console.log('Token:', COMPOSIO_API_KEY.substring(0, 15) + '...');
  console.log('='.repeat(60));
  
  try {
    // Initialize Composio ToolSet as per documentation
    const toolset = new ComposioToolSet({
      apiKey: COMPOSIO_API_KEY
    });
    
    console.log('\n1. Initializing Composio ToolSet ✓');
    
    // Test getting actions for Gmail
    console.log('\n2. Getting Gmail actions from toolkit...');
    const actions = await toolset.getActions({
      actions: ['GMAIL_SEND_EMAIL', 'GMAIL_LIST_LABELS', 'GMAIL_GET_PROFILE']
    });
    
    console.log('✓ Gmail actions retrieved:', actions.length);
    actions.forEach((action: any) => {
      console.log(`  - ${action.name}`);
    });
    
    // Test executing a simple Gmail action
    console.log('\n3. Testing Gmail API execution...');
    const result = await toolset.executeAction({
      action: 'GMAIL_GET_PROFILE',
      params: {},
      entityId: ENTITY_ID
    });
    
    console.log('✓ Gmail profile retrieved!');
    console.log('  Email:', result.data?.emailAddress || 'Not available');
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ YES! We ARE using the Gmail toolkit from Composio!');
    console.log('✅ Documentation: https://docs.composio.dev/toolkits/gmail');
    console.log('✅ Your new token is WORKING!');
    console.log('='.repeat(60));
    
    return true;
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message || error);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data || error.response, null, 2));
    }
    
    // Check if it's an auth error
    if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
      console.error('\n⚠️  The token appears to be invalid or expired.');
      console.error('Please check if the token is correct: oak_ZXHQaIMH4guJQOF6oNzZ');
    }
    
    return false;
  }
}

// Run the test
testComposioGmailToolkit();