#!/usr/bin/env node

const COMPOSIO_API_KEY = 'ak_suouXXwN2bd7UvBbjJvu';
const CONNECTED_ACCOUNT_ID = '079ac666-f872-470a-b331-840d5e394684';

async function testCalendarEvents() {
    try {
        console.log('Testing Calendar Events Retrieval...\n');
        
        // Get current date range
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        
        console.log('Date range:', {
            start: startOfDay.toISOString(),
            end: endOfDay.toISOString()
        });
        
        // Try to execute the action
        const response = await fetch('https://backend.composio.dev/api/v2/actions/GOOGLECALENDAR_LIST_CALENDAR_EVENTS/execute', {
            method: 'POST',
            headers: {
                'X-API-Key': COMPOSIO_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                connectedAccountId: CONNECTED_ACCOUNT_ID,
                input: {
                    calendar_id: 'primary',
                    time_min: startOfDay.toISOString(),
                    time_max: endOfDay.toISOString(),
                    single_events: true,
                    order_by: 'startTime'
                }
            })
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        const text = await response.text();
        console.log('\nResponse body:', text);
        
        try {
            const data = JSON.parse(text);
            if (data.result && data.result.items) {
                console.log(`\nFound ${data.result.items.length} events today:`);
                data.result.items.forEach((event, idx) => {
                    console.log(`${idx + 1}. ${event.summary || 'No title'} - ${event.start?.dateTime || event.start?.date || 'No time'}`);
                });
            }
        } catch (e) {
            console.log('Could not parse as JSON');
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

testCalendarEvents();