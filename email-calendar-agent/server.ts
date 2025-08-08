#!/usr/bin/env bun

/**
 * Email/Calendar Voice Agent Backend Server
 * Handles Composio integration for Gmail and Google Calendar
 * Updated for info@mtlcraftcocktails.com business account
 */

import { serve } from 'bun';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
const COMPOSIO_API_KEY = 'ak_suouXXwN2bd7UvBbjJvu';
const COMPOSIO_BASE_URL = 'https://backend.composio.dev/api/v1';
const CLIENT_ID = 'info@mtlcraftcocktails.com'; // Updated to business email
const PORT = 3000;

// CORS headers for browser requests
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

// API Routes
const routes = {
  // Check connection status
  '/api/status': async () => {
    try {
      const accounts = await composioRequest('/connectedAccounts');
      
      const gmailAccount = accounts.items?.find((item: any) => 
        item.appName === 'gmail' && 
        item.status === 'ACTIVE' &&
        item.clientUniqueUserId === CLIENT_ID
      );
      
      const calendarAccount = accounts.items?.find((item: any) => 
        (item.appName === 'googlecalendar' || item.appName === 'google_calendar') && 
        item.status === 'ACTIVE' &&
        item.clientUniqueUserId === CLIENT_ID
      );
      
      return {
        success: true,
        gmail: {
          connected: !!gmailAccount,
          id: gmailAccount?.id,
          email: CLIENT_ID,
        },
        calendar: {
          connected: !!calendarAccount,
          id: calendarAccount?.id,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
  
  // Get emails
  '/api/emails': async () => {
    try {
      // Check if Gmail is connected
      const status = await routes['/api/status']();
      if (!status.gmail.connected) {
        return {
          success: false,
          error: 'Gmail not connected for ' + CLIENT_ID,
        };
      }
      
      // Execute Gmail action to get emails
      const emails = await composioRequest('/actions/gmail_list_emails/execute', {
        method: 'POST',
        body: JSON.stringify({
          connectedAccountId: status.gmail.id,
          input: {
            maxResults: 10,
            q: 'is:unread',
          },
        }),
      });
      
      return {
        success: true,
        emails: emails.result,
        account: CLIENT_ID,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
  
  // Get calendar events
  '/api/calendar': async () => {
    try {
      // Check if Calendar is connected
      const status = await routes['/api/status']();
      if (!status.calendar.connected) {
        return {
          success: false,
          error: 'Google Calendar not connected for ' + CLIENT_ID,
        };
      }
      
      // Get today's events
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(now.setHours(23, 59, 59, 999)).toISOString();
      
      const events = await composioRequest('/actions/googlecalendar_list_events/execute', {
        method: 'POST',
        body: JSON.stringify({
          connectedAccountId: status.calendar.id,
          input: {
            timeMin: startOfDay,
            timeMax: endOfDay,
            singleEvents: true,
            orderBy: 'startTime',
          },
        }),
      });
      
      return {
        success: true,
        events: events.result,
        account: CLIENT_ID,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
  
  // Process voice command
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
      
      // Route to appropriate handler
      if (lowerCommand.includes('email') || lowerCommand.includes('mail')) {
        const emails = await routes['/api/emails']();
        if (emails.success) {
          return {
            success: true,
            type: 'emails',
            data: emails.emails,
            response: `You have ${emails.emails?.length || 0} unread emails in ${CLIENT_ID}.`,
          };
        }
        return emails;
      }
      
      if (lowerCommand.includes('calendar') || lowerCommand.includes('schedule') || lowerCommand.includes('meeting')) {
        const calendar = await routes['/api/calendar']();
        if (calendar.success) {
          return {
            success: true,
            type: 'calendar',
            data: calendar.events,
            response: `You have ${calendar.events?.length || 0} events today.`,
          };
        }
        return calendar;
      }
      
      return {
        success: true,
        type: 'unknown',
        response: 'I can help you with emails and calendar events. Try asking about your emails or today\'s schedule.',
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
  
  // OAuth callback handler
  '/api/oauth/callback': async (request: Request) => {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    if (!code) {
      return {
        success: false,
        error: 'No authorization code provided',
      };
    }
    
    // Handle OAuth callback
    // This would complete the OAuth flow with Composio
    return {
      success: true,
      message: 'Authorization successful for ' + CLIENT_ID + '. You can close this window.',
    };
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
            
          return new Response(JSON.stringify(result), {
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
🚀 Email/Calendar Voice Agent Server
====================================
Server running at: http://localhost:${PORT}

Endpoints:
- GET  /                     - Voice agent UI
- GET  /api/status          - Check connection status
- GET  /api/emails          - Get emails
- GET  /api/calendar        - Get calendar events
- POST /api/voice/command   - Process voice command
- GET  /api/oauth/callback  - OAuth callback handler

Composio Integration:
- API Key: ${COMPOSIO_API_KEY.substring(0, 10)}...
- Business Email: ${CLIENT_ID}

Press Ctrl+C to stop the server
`);