#!/usr/bin/env bun

import { Composio } from 'composio-core';

const COMPOSIO_API_KEY = 'ak_suouXXwN2bd7UvBbjJvu';
const CLIENT_ID = 'ash.cocktails@gmail.com';

async function testCalendarIntegration() {
    try {
        console.log('Testing Google Calendar Integration...\n');
        
        // Initialize Composio client
        const composio = new Composio(COMPOSIO_API_KEY);
        
        // Get connected account for Google Calendar
        console.log('1. Checking connected accounts...');
        const accounts = await composio.connectedAccounts.list();
        const calendarAccount = accounts.find(
            acc => acc.appName === 'googlecalendar' && 
                   acc.clientUniqueUserId === CLIENT_ID &&
                   acc.status === 'ACTIVE'
        );
        
        if (!calendarAccount) {
            console.log('No active Google Calendar account found for', CLIENT_ID);
            return;
        }
        
        console.log('Found Calendar account:', calendarAccount.id);
        
        // Get today's date range
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        
        console.log('\n2. Fetching today\'s calendar events...');
        console.log('Date range:', {
            start: startOfDay.toISOString(),
            end: endOfDay.toISOString()
        });
        
        // Execute action to get calendar events
        const response = await composio.actions.execute({
            actionName: 'GOOGLECALENDAR_LIST_EVENTS',
            connectedAccountId: calendarAccount.id,
            params: {
                calendarId: 'primary',
                timeMin: startOfDay.toISOString(),
                timeMax: endOfDay.toISOString(),
                singleEvents: true,
                orderBy: 'startTime'
            }
        });
        
        console.log('\n3. Results:');
        if (response.result && response.result.items) {
            const events = response.result.items;
            console.log(`Found ${events.length} events today:\n`);
            
            if (events.length === 0) {
                console.log('No events scheduled for today.');
            } else {
                events.forEach((event: any, idx: number) => {
                    const start = event.start?.dateTime || event.start?.date || 'No time';
                    const end = event.end?.dateTime || event.end?.date || 'No time';
                    console.log(`${idx + 1}. ${event.summary || 'No title'}`);
                    console.log(`   Time: ${start} - ${end}`);
                    if (event.location) {
                        console.log(`   Location: ${event.location}`);
                    }
                    if (event.description) {
                        console.log(`   Description: ${event.description.substring(0, 100)}...`);
                    }
                    console.log();
                });
            }
        } else {
            console.log('No events data received.');
        }
        
        // Test Gmail connection
        console.log('\n4. Checking Gmail connection...');
        const gmailAccount = accounts.find(
            acc => acc.appName === 'gmail' && 
                   acc.status === 'ACTIVE'
        );
        
        if (!gmailAccount) {
            console.log('Gmail not connected yet. Please authorize Gmail in the Composio dashboard.');
        } else {
            console.log('Gmail is connected! Account ID:', gmailAccount.id);
            
            // Try to fetch emails
            console.log('\n5. Fetching recent emails...');
            const emailResponse = await composio.actions.execute({
                actionName: 'GMAIL_LIST_EMAILS',
                connectedAccountId: gmailAccount.id,
                params: {
                    maxResults: 5,
                    q: 'is:unread'
                }
            });
            
            if (emailResponse.result && emailResponse.result.messages) {
                console.log(`Found ${emailResponse.result.messages.length} unread emails.`);
            }
        }
        
    } catch (error: any) {
        console.error('Error:', error.message || error);
        if (error.response) {
            console.error('Response:', await error.response.text());
        }
    }
}

testCalendarIntegration();