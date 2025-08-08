#!/usr/bin/env tsx
/**
 * Test Composio Integration with Real API Key
 * Uses environment variables for secure configuration
 */

import * as dotenv from 'dotenv';
import { createComposioService, ComposioEmailCalendarService } from './composio-integration';

// Load environment variables from .env file
dotenv.config({ path: '/Users/ashleytower/.env' });

// Validate required environment variables
const requiredEnvVars = ['COMPOSIO_API_KEY', 'COMPOSIO_ENTITY_ID'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    console.error('Please ensure .env file contains all required variables');
    process.exit(1);
  }
}

// Initialize service with environment variables
const composioService = createComposioService({
  apiKey: process.env.COMPOSIO_API_KEY!,
  entityId: process.env.COMPOSIO_ENTITY_ID || 'default',
  baseUrl: process.env.COMPOSIO_BASE_URL
});

console.log('✅ Composio service initialized with environment variables');
console.log(`   API Key: ${process.env.COMPOSIO_API_KEY!.substring(0, 8)}...`);
console.log(`   Entity ID: ${process.env.COMPOSIO_ENTITY_ID}`);

// Test functions
async function testEmailOperations() {
  console.log('\n📧 Testing Email Operations...');
  
  try {
    // Test 1: Get recent emails
    console.log('   Testing getRecentEmails()...');
    const recentEmails = await composioService.getRecentEmails(5);
    console.log(`   ✅ Retrieved ${recentEmails.length} recent emails`);
    
    if (recentEmails.length > 0) {
      console.log('   Sample email:');
      const email = recentEmails[0];
      console.log(`     - From: ${email.from}`);
      console.log(`     - Subject: ${email.subject}`);
      console.log(`     - Date: ${email.timestamp.toLocaleString()}`);
    }
    
    // Test 2: Search emails
    console.log('\n   Testing searchEmails()...');
    const searchResults = await composioService.searchEmails('is:unread');
    console.log(`   ✅ Found ${searchResults.length} unread emails`);
    
    return true;
  } catch (error) {
    console.error('   ❌ Email operations failed:', error);
    return false;
  }
}

async function testCalendarOperations() {
  console.log('\n📅 Testing Calendar Operations...');
  
  try {
    // Test 1: Get today's events
    console.log('   Testing getTodaysEvents()...');
    const todaysEvents = await composioService.getTodaysEvents();
    console.log(`   ✅ Retrieved ${todaysEvents.length} events for today`);
    
    if (todaysEvents.length > 0) {
      console.log('   Sample event:');
      const event = todaysEvents[0];
      console.log(`     - Title: ${event.title}`);
      console.log(`     - Start: ${event.startTime.toLocaleString()}`);
      console.log(`     - End: ${event.endTime.toLocaleString()}`);
    }
    
    // Test 2: Find available slots
    console.log('\n   Testing findAvailableSlots()...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    const availableSlots = await composioService.findAvailableSlots(
      60, // 60 minutes duration
      tomorrow,
      dayAfter
    );
    console.log(`   ✅ Found ${availableSlots.length} available slots`);
    
    return true;
  } catch (error) {
    console.error('   ❌ Calendar operations failed:', error);
    return false;
  }
}

async function testContactOperations() {
  console.log('\n👥 Testing Contact Operations...');
  
  try {
    console.log('   Testing searchContacts()...');
    const contacts = await composioService.searchContacts('John');
    console.log(`   ✅ Found ${contacts.length} contacts matching "John"`);
    
    if (contacts.length > 0) {
      console.log('   Sample contact:');
      const contact = contacts[0];
      console.log(`     - Name: ${contact.name}`);
      console.log(`     - Email: ${contact.email}`);
      if (contact.organization) {
        console.log(`     - Organization: ${contact.organization}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('   ❌ Contact operations failed:', error);
    return false;
  }
}

async function testNaturalLanguageProcessing() {
  console.log('\n🤖 Testing Natural Language Processing...');
  
  const testQueries = [
    'Show me my unread emails',
    'What meetings do I have today?',
    'Send an email to john@example.com about the project update',
    'Find contact information for John Smith'
  ];
  
  try {
    for (const query of testQueries) {
      console.log(`\n   Query: "${query}"`);
      const result = await composioService.processNaturalLanguageQuery(query);
      console.log(`   ✅ Intent: ${result.intent}, Action: ${result.action}`);
      console.log(`   Response: ${result.response}`);
    }
    
    return true;
  } catch (error) {
    console.error('   ❌ Natural language processing failed:', error);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Composio Integration Tests with Real API Key\n');
  console.log('========================================================');
  
  const results = {
    email: false,
    calendar: false,
    contacts: false,
    nlp: false
  };
  
  // Run tests
  results.email = await testEmailOperations();
  results.calendar = await testCalendarOperations();
  results.contacts = await testContactOperations();
  results.nlp = await testNaturalLanguageProcessing();
  
  // Summary
  console.log('\n========================================================');
  console.log('📊 Test Results Summary:\n');
  
  const passedTests = Object.values(results).filter(r => r).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`   Email Operations:    ${results.email ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   Calendar Operations: ${results.calendar ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   Contact Operations:  ${results.contacts ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   NLP Processing:      ${results.nlp ? '✅ PASSED' : '❌ FAILED'}`);
  
  console.log(`\n   Total: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Composio integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the error messages above.');
  }
  
  return passedTests === totalTests;
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}