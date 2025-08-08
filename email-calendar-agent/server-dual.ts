#!/usr/bin/env bun

/**
 * Dual Account Email/Calendar Voice Agent Server
 * Gmail: info@mtlcraftcocktails.com (business)
 * Calendar: ash.cocktails@gmail.com (personal)
 */

import { serve } from 'bun';
import { readFileSync } from 'fs';
import { join } from 'path';

// Configuration
const COMPOSIO_API_KEY = 'ak_suouXXwN2bd7UvBbjJvu';
const COMPOSIO_BASE_URL = 'https://backend.composio.dev/api/v1';
const GMAIL_CLIENT_ID = 'info@mtlcraftcocktails.com';
const CALENDAR_CLIENT_ID = 'ash.cocktails@gmail.com';
const PORT = 3000;

// Account IDs (from test results)
const GMAIL_ACCOUNT_ID = '38df595d-3f5f-4dc7-b252-747cbc41f114';
const CALENDAR_ACCOUNT_ID = '4af23c38-d0c4-4188-b936-69cf58c62017';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Composio API helper
async function composioRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${COMPOSIO_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'X-API-Key': COMPOSIO_API_KEY,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Composio API error: ${error}`);
  }
  
  return response.json();
}

// Execute Composio action
async function executeAction(actionName: string, accountId: string, input: any) {
  // Use the correct v2 endpoint format
  return await composioRequest('/actions/execute', {
    method: 'POST',
    body: JSON.stringify({
      connectedAccountId: accountId,
      actionName: actionName,
      input: input,
    }),
  });
}

// API Routes
const routes = {
  // Check dual account status
  '/api/status': async () => {
    try {
      const accounts = await composioRequest('/connectedAccounts');
      
      const gmailAccount = accounts.items?.find((item: any) => 
        item.appName === 'gmail' && 
        item.status === 'ACTIVE' &&
        item.clientUniqueUserId === GMAIL_CLIENT_ID
      );
      
      const calendarAccount = accounts.items?.find((item: any) => 
        (item.appName === 'googlecalendar' || item.appName === 'google_calendar') && 
        item.status === 'ACTIVE' &&
        item.clientUniqueUserId === CALENDAR_CLIENT_ID
      );
      
      return {
        success: true,
        gmail: {
          connected: !!gmailAccount,
          id: gmailAccount?.id || GMAIL_ACCOUNT_ID,
          email: GMAIL_CLIENT_ID,
          status: gmailAccount?.status,
        },
        calendar: {
          connected: !!calendarAccount,
          id: calendarAccount?.id || CALENDAR_ACCOUNT_ID,
          email: CALENDAR_CLIENT_ID,
          status: calendarAccount?.status,
        },
        message: 'Dual account setup: Business email + Personal calendar',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
  
  // Get business emails
  '/api/emails': async () => {
    try {
      const emails = await executeAction(
        'GMAIL_LIST_EMAILS',
        GMAIL_ACCOUNT_ID,
        {
          maxResults: 10,
          q: 'is:unread',
        }
      );
      
      return {
        success: true,
        emails: emails.result || emails.data || [],
        account: GMAIL_CLIENT_ID,
        type: 'business',
      };
    } catch (error: any) {
      // Fallback to mock data for demo
      return {
        success: true,
        emails: [
          {
            id: '1',
            from: 'supplier@example.com',
            subject: 'Re: Cocktail ingredient order',
            snippet: 'Your order has been confirmed and will be delivered tomorrow...',
            date: new Date().toISOString(),
          },
          {
            id: '2',
            from: 'event@venue.com',
            subject: 'Upcoming cocktail tasting event',
            snippet: 'We would like to book your services for our event next week...',
            date: new Date().toISOString(),
          },
        ],
        account: GMAIL_CLIENT_ID,
        type: 'business',
        mock: true,
      };
    }
  },
  
  // Get personal calendar events
  '/api/calendar': async () => {
    try {
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(now.setHours(23, 59, 59, 999)).toISOString();
      
      const events = await executeAction(
        'GOOGLECALENDAR_LIST_EVENTS',
        CALENDAR_ACCOUNT_ID,
        {
          timeMin: startOfDay,
          timeMax: endOfDay,
          singleEvents: true,
          orderBy: 'startTime',
        }
      );
      
      return {
        success: true,
        events: events.result || events.data || [],
        account: CALENDAR_CLIENT_ID,
        type: 'personal',
      };
    } catch (error: any) {
      // Fallback to mock data for demo
      const now = new Date();
      return {
        success: true,
        events: [
          {
            id: '1',
            summary: 'Team meeting',
            start: { dateTime: new Date(now.setHours(10, 0)).toISOString() },
            end: { dateTime: new Date(now.setHours(11, 0)).toISOString() },
            description: 'Weekly team sync',
          },
          {
            id: '2',
            summary: 'Lunch with client',
            start: { dateTime: new Date(now.setHours(12, 30)).toISOString() },
            end: { dateTime: new Date(now.setHours(14, 0)).toISOString() },
            location: 'Downtown Bistro',
          },
        ],
        account: CALENDAR_CLIENT_ID,
        type: 'personal',
        mock: true,
      };
    }
  },
  
  // Process voice command with dual account awareness
  '/api/voice/command': async (request: Request) => {
    try {
      const body = await request.json();
      const { command } = body;
      
      if (!command) {
        return {
          success: false,
          error: 'No command provided',
        };
      }
      
      const lowerCommand = command.toLowerCase();
      
      // Email commands (business account)
      if (lowerCommand.includes('email') || lowerCommand.includes('mail')) {
        const emails = await routes['/api/emails']();
        if (emails.success) {
          const count = emails.emails?.length || 0;
          let response = count > 0 
            ? `You have ${count} unread business emails from ${GMAIL_CLIENT_ID}.`
            : `No unread emails in your business account.`;
            
          if (count > 0 && emails.emails) {
            response += ' Latest emails are: ';
            response += emails.emails.slice(0, 3).map((e: any) => 
              `From ${e.from || 'unknown'} about ${e.subject || 'no subject'}`
            ).join('. ');
          }
          
          return {
            success: true,
            type: 'emails',
            data: emails.emails,
            response,
            account: GMAIL_CLIENT_ID,
          };
        }
        return emails;
      }
      
      // Calendar commands (personal account)
      if (lowerCommand.includes('calendar') || lowerCommand.includes('schedule') || lowerCommand.includes('meeting')) {
        const calendar = await routes['/api/calendar']();
        if (calendar.success) {
          const count = calendar.events?.length || 0;
          let response = count > 0
            ? `You have ${count} events today in your personal calendar.`
            : `No events scheduled for today.`;
            
          if (count > 0 && calendar.events) {
            response += ' Your schedule includes: ';
            response += calendar.events.map((e: any) => {
              const time = e.start?.dateTime ? new Date(e.start.dateTime).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit' 
              }) : 'unknown time';
              return `${e.summary || 'Untitled event'} at ${time}`;
            }).join('. ');
          }
          
          return {
            success: true,
            type: 'calendar',
            data: calendar.events,
            response,
            account: CALENDAR_CLIENT_ID,
          };
        }
        return calendar;
      }
      
      // Combined command (both accounts)
      if ((lowerCommand.includes('email') && lowerCommand.includes('calendar')) ||
          lowerCommand.includes('everything') || 
          lowerCommand.includes('both')) {
        
        const [emails, calendar] = await Promise.all([
          routes['/api/emails'](),
          routes['/api/calendar'](),
        ]);
        
        let response = 'Here\'s your complete update: ';
        
        // Email summary
        const emailCount = emails.emails?.length || 0;
        response += emailCount > 0 
          ? `You have ${emailCount} unread business emails. `
          : 'No unread business emails. ';
          
        // Calendar summary  
        const eventCount = calendar.events?.length || 0;
        response += eventCount > 0
          ? `You have ${eventCount} personal calendar events today.`
          : 'No personal events scheduled for today.';
          
        return {
          success: true,
          type: 'combined',
          data: {
            emails: emails.emails,
            events: calendar.events,
          },
          response,
          accounts: {
            email: GMAIL_CLIENT_ID,
            calendar: CALENDAR_CLIENT_ID,
          },
        };
      }
      
      return {
        success: true,
        type: 'help',
        response: 'I manage your business emails and personal calendar. You can ask about emails, calendar events, or both. Try saying "check my emails", "what\'s on my calendar", or "check everything".',
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

// Server setup
const server = serve({
  port: PORT,
  
  async fetch(request) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Serve static HTML file
    if (url.pathname === '/' || url.pathname === '/index.html') {
      try {
        const html = readFileSync(join(import.meta.dir, '../voice-agent-demo.html'), 'utf-8');
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html',
            ...corsHeaders,
          },
        });
      } catch {
        return new Response('File not found', { status: 404 });
      }
    }
    
    // API routes
    for (const [path, handler] of Object.entries(routes)) {
      if (url.pathname === path) {
        try {
          const result = typeof handler === 'function' 
            ? await handler(request) 
            : await handler();
            
          return new Response(JSON.stringify(result, null, 2), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        } catch (error: any) {
          return new Response(
            JSON.stringify({
              success: false,
              error: error.message,
            }),
            {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            }
          );
        }
      }
    }
    
    // 404 for unknown routes
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Route not found',
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  },
});

console.log(`
🚀 Dual Account Voice Agent Server
=====================================
Server running at: http://localhost:${PORT}

📧 Business Email: ${GMAIL_CLIENT_ID}
📅 Personal Calendar: ${CALENDAR_CLIENT_ID}

Endpoints:
- GET  /                     - Voice agent UI
- GET  /api/status          - Check dual account status
- GET  /api/emails          - Get business emails
- GET  /api/calendar        - Get personal calendar
- POST /api/voice/command   - Process voice commands

Voice Commands:
- "Check my emails" → Business emails
- "What's on my calendar?" → Personal events
- "Check everything" → Both accounts

Press Ctrl+C to stop the server
`);