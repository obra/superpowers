#!/usr/bin/env bun

/**
 * Real Composio Integration Test
 * Testing actual connectivity with configured API key
 */

import { ComposioEmailCalendarService } from './composio-integration';

const API_KEY = 'dc30994b-fe42-495a-a346-809e8f95ee49';
const ENTITY_ID = 'default'; // Default entity for testing

async function runIntegrationTests() {
  console.log('=== COMPOSIO INTEGRATION TEST ===');
  console.log(`API Key: ${API_KEY.substring(0, 8)}...`);
  console.log(`Entity ID: ${ENTITY_ID}`);
  console.log('');

  const service = new ComposioEmailCalendarService({
    apiKey: API_KEY,
    entityId: ENTITY_ID
  });

  const testResults: Record<string, { status: 'PASS' | 'FAIL'; message: string; error?: any }> = {};

  // Test 1: Gmail - Get Recent Emails
  console.log('Test 1: Fetching recent emails...');
  try {
    const emails = await service.getRecentEmails(5);
    testResults['Gmail_GetEmails'] = {
      status: 'PASS',
      message: `Successfully fetched ${emails.length} emails`
    };
    console.log(`✅ Fetched ${emails.length} emails`);
    if (emails.length > 0) {
      console.log(`   Sample: "${emails[0].subject}" from ${emails[0].from}`);
    }
  } catch (error) {
    testResults['Gmail_GetEmails'] = {
      status: 'FAIL',
      message: 'Failed to fetch emails',
      error: error
    };
    console.log(`❌ Failed: ${error}`);
  }

  // Test 2: Google Calendar - Get Today's Events
  console.log('\nTest 2: Fetching today\'s calendar events...');
  try {
    const events = await service.getTodaysEvents();
    testResults['Calendar_GetEvents'] = {
      status: 'PASS',
      message: `Successfully fetched ${events.length} events`
    };
    console.log(`✅ Fetched ${events.length} events`);
    if (events.length > 0) {
      console.log(`   Sample: "${events[0].title}" at ${events[0].startTime}`);
    }
  } catch (error) {
    testResults['Calendar_GetEvents'] = {
      status: 'FAIL',
      message: 'Failed to fetch calendar events',
      error: error
    };
    console.log(`❌ Failed: ${error}`);
  }

  // Test 3: Search Emails
  console.log('\nTest 3: Searching emails...');
  try {
    const searchResults = await service.searchEmails('is:unread');
    testResults['Gmail_Search'] = {
      status: 'PASS',
      message: `Found ${searchResults.length} unread emails`
    };
    console.log(`✅ Found ${searchResults.length} unread emails`);
  } catch (error) {
    testResults['Gmail_Search'] = {
      status: 'FAIL',
      message: 'Failed to search emails',
      error: error
    };
    console.log(`❌ Failed: ${error}`);
  }

  // Test 4: Natural Language Processing
  console.log('\nTest 4: Processing natural language query...');
  try {
    const nlpResult = await service.processNaturalLanguageQuery('Show me my unread emails');
    testResults['NLP_Processing'] = {
      status: 'PASS',
      message: `Intent: ${nlpResult.intent}, Action: ${nlpResult.action}`
    };
    console.log(`✅ NLP processed - Intent: ${nlpResult.intent}, Action: ${nlpResult.action}`);
    console.log(`   Response: ${nlpResult.response}`);
  } catch (error) {
    testResults['NLP_Processing'] = {
      status: 'FAIL',
      message: 'Failed to process natural language',
      error: error
    };
    console.log(`❌ Failed: ${error}`);
  }

  // Test 5: Find Available Calendar Slots
  console.log('\nTest 5: Finding available calendar slots...');
  try {
    const startDate = new Date();
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Next 7 days
    const slots = await service.findAvailableSlots(60, startDate, endDate); // 60 minute slots
    testResults['Calendar_AvailableSlots'] = {
      status: 'PASS',
      message: `Found ${slots.length} available slots`
    };
    console.log(`✅ Found ${slots.length} available slots`);
  } catch (error) {
    testResults['Calendar_AvailableSlots'] = {
      status: 'FAIL',
      message: 'Failed to find available slots',
      error: error
    };
    console.log(`❌ Failed: ${error}`);
  }

  // Test 6: Search Contacts
  console.log('\nTest 6: Searching contacts...');
  try {
    const contacts = await service.searchContacts('John');
    testResults['Contacts_Search'] = {
      status: 'PASS',
      message: `Found ${contacts.length} contacts`
    };
    console.log(`✅ Found ${contacts.length} contacts`);
    if (contacts.length > 0) {
      console.log(`   Sample: ${contacts[0].name} (${contacts[0].email})`);
    }
  } catch (error) {
    testResults['Contacts_Search'] = {
      status: 'FAIL',
      message: 'Failed to search contacts',
      error: error
    };
    console.log(`❌ Failed: ${error}`);
  }

  // Summary Report
  console.log('\n=== TEST SUMMARY ===');
  let passCount = 0;
  let failCount = 0;
  
  for (const [test, result] of Object.entries(testResults)) {
    if (result.status === 'PASS') {
      passCount++;
      console.log(`✅ ${test}: ${result.message}`);
    } else {
      failCount++;
      console.log(`❌ ${test}: ${result.message}`);
      if (result.error) {
        console.log(`   Error details: ${result.error}`);
      }
    }
  }

  console.log(`\nTotal: ${passCount} passed, ${failCount} failed`);
  
  // Check authentication status
  if (failCount === Object.keys(testResults).length) {
    console.log('\n⚠️  ALL TESTS FAILED - Likely authentication issue');
    console.log('Please verify:');
    console.log('1. API key is valid and active');
    console.log('2. Composio account has proper Google OAuth setup');
    console.log('3. Entity ID exists and is connected');
  } else if (failCount > 0) {
    console.log('\n⚠️  PARTIAL FAILURE - Some services may need configuration');
  } else {
    console.log('\n✅ ALL TESTS PASSED - Integration is fully functional!');
  }

  return testResults;
}

// Run the tests
console.log('Starting Composio integration tests...\n');
runIntegrationTests()
  .then((results) => {
    console.log('\nTest execution complete.');
    process.exit(Object.values(results).some(r => r.status === 'FAIL') ? 1 : 0);
  })
  .catch((error) => {
    console.error('Fatal error during testing:', error);
    process.exit(1);
  });