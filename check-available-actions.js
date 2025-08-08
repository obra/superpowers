#!/usr/bin/env node

const COMPOSIO_API_KEY = 'ak_suouXXwN2bd7UvBbjJvu';

async function checkAvailableActions() {
    try {
        console.log('Checking available Google Calendar actions...\n');
        
        // Get all available actions for Google Calendar
        const response = await fetch('https://backend.composio.dev/api/v1/actions?apps=GOOGLECALENDAR&limit=100', {
            method: 'GET',
            headers: {
                'X-API-Key': COMPOSIO_API_KEY,
                'Accept': 'application/json',
            }
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('\nAvailable Google Calendar Actions:');
            console.log('================================');
            
            if (data.items && data.items.length > 0) {
                data.items.forEach(action => {
                    console.log(`- ${action.name}: ${action.description || 'No description'}`);
                });
            } else {
                console.log('No actions found');
            }
        } else {
            const text = await response.text();
            console.log('Error response:', text);
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

checkAvailableActions();