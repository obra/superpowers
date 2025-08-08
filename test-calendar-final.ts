#!/usr/bin/env bun

import { Composio } from 'composio-core';

const COMPOSIO_API_KEY = 'ak_suouXXwN2bd7UvBbjJvu';
const CLIENT_ID = 'ash.cocktails@gmail.com';

async function testCalendarAndEmail() {
    try {
        console.log('🚀 Testing Calendar & Email Integration\n');
        console.log('=====================================\n');
        
        // Initialize Composio client
        const client = new Composio({
            apiKey: COMPOSIO_API_KEY
        });
        
        // Get entity for the user
        const entity = await client.getEntity(CLIENT_ID);
        
        console.log('✅ Entity connected:', CLIENT_ID);
        
        // Check connected accounts
        const connections = await entity.getConnections();
        console.log('\n📱 Connected Apps:');
        connections.forEach((conn: any) => {
            console.log(`   - ${conn.appName}: ${conn.status}`);
        });
        
        // Test Calendar
        const calendarConnection = connections.find((c: any) => c.appName === 'googlecalendar');
        if (calendarConnection && calendarConnection.status === 'ACTIVE') {
            console.log('\n📅 Testing Google Calendar...');
            
            const now = new Date();
            const startOfDay = new Date(now);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(now);
            endOfDay.setHours(23, 59, 59, 999);
            
            try {
                const calendarResult = await entity.execute(
                    'GOOGLECALENDAR_LIST_EVENTS',
                    {
                        calendarId: 'primary',
                        timeMin: startOfDay.toISOString(),
                        timeMax: endOfDay.toISOString(),
                        singleEvents: true,
                        orderBy: 'startTime',
                        maxResults: 10
                    }
                );
                
                if (calendarResult?.items) {
                    console.log(`   Found ${calendarResult.items.length} events today:`);
                    calendarResult.items.forEach((event: any, idx: number) => {
                        const time = event.start?.dateTime || event.start?.date || 'All day';
                        console.log(`   ${idx + 1}. ${event.summary || 'No title'} - ${time}`);
                    });
                } else {
                    console.log('   No events found for today');
                }
            } catch (err: any) {
                console.log('   Calendar API Error:', err.message);
            }
        } else {
            console.log('\n⚠️  Google Calendar not connected');
        }
        
        // Test Gmail
        const gmailConnection = connections.find((c: any) => c.appName === 'gmail');
        if (gmailConnection && gmailConnection.status === 'ACTIVE') {
            console.log('\n📧 Testing Gmail...');
            
            try {
                const emailResult = await entity.execute(
                    'GMAIL_LIST_EMAILS',
                    {
                        maxResults: 5,
                        q: 'is:unread'
                    }
                );
                
                if (emailResult?.messages) {
                    console.log(`   Found ${emailResult.messages.length} unread emails`);
                    
                    // Get details for first email if available
                    if (emailResult.messages.length > 0) {
                        const firstMessage = emailResult.messages[0];
                        const details = await entity.execute(
                            'GMAIL_GET_EMAIL',
                            {
                                messageId: firstMessage.id
                            }
                        );
                        
                        if (details) {
                            const headers = details.payload?.headers || [];
                            const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No subject';
                            const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown sender';
                            console.log(`\n   Latest unread email:`);
                            console.log(`   Subject: ${subject}`);
                            console.log(`   From: ${from}`);
                        }
                    }
                } else {
                    console.log('   No unread emails');
                }
            } catch (err: any) {
                console.log('   Gmail API Error:', err.message);
            }
        } else {
            console.log('\n⚠️  Gmail not connected - Please authorize Gmail in Composio dashboard');
        }
        
        console.log('\n=====================================');
        console.log('✅ Integration test complete!');
        console.log('\nNext steps:');
        if (!gmailConnection || gmailConnection.status !== 'ACTIVE') {
            console.log('1. Authorize Gmail at: https://app.composio.dev/apps/gmail');
        }
        console.log('2. Start the voice agent server: bun server.ts');
        console.log('3. Open browser to: http://localhost:3000');
        console.log('4. Use voice commands to interact with your calendar and email!');
        
    } catch (error: any) {
        console.error('❌ Error:', error.message || error);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
    }
}

testCalendarAndEmail();