#!/usr/bin/env node

const COMPOSIO_API_KEY = 'ak_suouXXwN2bd7UvBbjJvu';
const CONNECTED_ACCOUNT_ID = '079ac666-f872-470a-b331-840d5e394684';

async function checkIntegration() {
    try {
        console.log('Checking Composio Integration Status...\n');
        
        // Method 1: Check connected accounts
        console.log('1. Connected Accounts:');
        const accountsResponse = await fetch('https://backend.composio.dev/api/v1/connectedAccounts', {
            headers: {
                'X-API-Key': COMPOSIO_API_KEY,
                'Accept': 'application/json',
            }
        });
        
        if (accountsResponse.ok) {
            const accounts = await accountsResponse.json();
            console.log('Connected accounts:', JSON.stringify(accounts, null, 2));
        }
        
        // Method 2: Try to get integrations
        console.log('\n2. Available Integrations:');
        const integrationsResponse = await fetch('https://backend.composio.dev/api/v1/integrations', {
            headers: {
                'X-API-Key': COMPOSIO_API_KEY,
                'Accept': 'application/json',
            }
        });
        
        console.log('Integrations status:', integrationsResponse.status);
        if (integrationsResponse.ok) {
            const integrations = await integrationsResponse.json();
            console.log('Integrations:', JSON.stringify(integrations, null, 2).substring(0, 500));
        }
        
        // Method 3: Try to execute an action with the SDK pattern
        console.log('\n3. Testing action execution:');
        const executeResponse = await fetch('https://backend.composio.dev/api/v1/execute/action', {
            method: 'POST',
            headers: {
                'X-API-Key': COMPOSIO_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                actionName: 'GOOGLECALENDAR_LIST_EVENTS',
                connectedAccountId: CONNECTED_ACCOUNT_ID,
                params: {
                    calendarId: 'primary',
                    maxResults: 5
                }
            })
        });
        
        console.log('Execute status:', executeResponse.status);
        const executeText = await executeResponse.text();
        console.log('Execute response:', executeText);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

checkIntegration();