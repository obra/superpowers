#!/usr/bin/env bun

/**
 * REAL Voice Agent Server with Composio Integration
 * - Gmail: info@mtlcraftcocktails.com
 * - Calendar: ash.cocktails@gmail.com  
 * - Voice: ElevenLabs through Composio
 * - Memory: Mem0 through Composio
 */

import { serve } from 'bun';
import { readFileSync } from 'fs';
import { join } from 'path';

// Configuration
const COMPOSIO_API_KEY = 'ak_suouXXwN2bd7UvBbjJvu';
const COMPOSIO_BASE_URL = 'https://backend.composio.dev/api/v1';
const PORT = 3001;

// Account Configuration
const ACCOUNTS = {
  gmail: {
    clientId: 'info@mtlcraftcocktails.com',
    accountId: '38df595d-3f5f-4dc7-b252-747cbc41f114',
    appName: 'gmail'
  },
  calendar: {
    clientId: 'ash.cocktails@gmail.com',
    accountId: '4af23c38-d0c4-4188-b936-69cf58c62017',
    appName: 'googlecalendar'
  },
  elevenlabs: {
    clientId: 'voice-assistant',
    accountId: null, // Will be fetched
    appName: 'elevenlabs'
  },
  mem0: {
    clientId: 'memory-system',
    accountId: null, // Will be fetched
    appName: 'mem0'
  }
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Composio API helper
async function composioRequest(endpoint: string, options: RequestInit = {}) {
  console.log(`[Composio] Request to ${endpoint}`);
  
  const response = await fetch(`${COMPOSIO_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'X-API-Key': COMPOSIO_API_KEY,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const text = await response.text();
  
  if (!response.ok) {
    console.error(`[Composio] Error: ${text}`);
    throw new Error(`Composio API error: ${text}`);
  }
  
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// Execute Composio action
async function executeAction(actionName: string, accountId: string, input: any = {}) {
  console.log(`[Action] Executing ${actionName} with account ${accountId}`);
  
  try {
    const result = await composioRequest('/actions/execute', {
      method: 'POST',
      body: JSON.stringify({
        connectedAccountId: accountId,
        actionName: actionName,
        input: input,
      }),
    });
    
    console.log(`[Action] ${actionName} completed successfully`);
    return result;
  } catch (error: any) {
    console.error(`[Action] ${actionName} failed:`, error.message);
    throw error;
  }
}

// Get or create connected account
async function getOrCreateAccount(appName: string, clientId: string) {
  try {
    // Check existing accounts
    const accounts = await composioRequest('/connectedAccounts');
    
    const existing = accounts.items?.find((item: any) => 
      item.appName === appName && 
      item.status === 'ACTIVE' &&
      (item.clientUniqueUserId === clientId || !item.clientUniqueUserId)
    );
    
    if (existing) {
      console.log(`[Account] Found existing ${appName} account: ${existing.id}`);
      return existing.id;
    }
    
    console.log(`[Account] No ${appName} account found for ${clientId}`);
    return null;
  } catch (error: any) {
    console.error(`[Account] Failed to get ${appName} account:`, error.message);
    return null;
  }
}

// Initialize accounts on startup
async function initializeAccounts() {
  console.log('[Init] Initializing Composio accounts...');
  
  // Check ElevenLabs account
  ACCOUNTS.elevenlabs.accountId = await getOrCreateAccount('elevenlabs', ACCOUNTS.elevenlabs.clientId);
  
  // Check Mem0 account
  ACCOUNTS.mem0.accountId = await getOrCreateAccount('mem0', ACCOUNTS.mem0.clientId);
  
  console.log('[Init] Account status:');
  console.log(`  - Gmail: ${ACCOUNTS.gmail.accountId ? 'Connected' : 'Not connected'}`);
  console.log(`  - Calendar: ${ACCOUNTS.calendar.accountId ? 'Connected' : 'Not connected'}`);
  console.log(`  - ElevenLabs: ${ACCOUNTS.elevenlabs.accountId ? 'Connected' : 'Not connected'}`);
  console.log(`  - Mem0: ${ACCOUNTS.mem0.accountId ? 'Connected' : 'Not connected'}`);
}

// API Routes
const routes = {
  // System status
  '/api/status': async () => {
    try {
      const accounts = await composioRequest('/connectedAccounts');
      
      const status: any = {
        success: true,
        accounts: {},
        message: 'Real-time Composio integration active'
      };
      
      // Check each service
      for (const [key, config] of Object.entries(ACCOUNTS)) {
        const account = accounts.items?.find((item: any) => 
          item.appName === config.appName && item.status === 'ACTIVE'
        );
        
        status.accounts[key] = {
          connected: !!account,
          id: account?.id || config.accountId,
          clientId: config.clientId,
          status: account?.status || 'NOT_CONNECTED'
        };
      }
      
      return status;
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
  
  // Get real emails from Gmail
  '/api/emails': async () => {
    try {
      console.log('[Gmail] Fetching real emails...');
      
      const result = await executeAction(
        'GMAIL_LIST_EMAILS',
        ACCOUNTS.gmail.accountId,
        {
          maxResults: 10,
          q: 'is:unread'
        }
      );
      
      // Extract email data from the response
      const emails = result?.result?.messages || result?.data?.messages || [];
      
      // If we have message IDs, fetch full details
      if (emails.length > 0 && emails[0].id && !emails[0].subject) {
        const detailedEmails = await Promise.all(
          emails.slice(0, 5).map(async (email: any) => {
            try {
              const detail = await executeAction(
                'GMAIL_GET_EMAIL',
                ACCOUNTS.gmail.accountId,
                { id: email.id }
              );
              
              const headers = detail?.result?.payload?.headers || [];
              const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
              const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No subject';
              const date = headers.find((h: any) => h.name === 'Date')?.value || new Date().toISOString();
              
              return {
                id: email.id,
                from,
                subject,
                snippet: detail?.result?.snippet || '',
                date,
                threadId: email.threadId
              };
            } catch {
              return email;
            }
          })
        );
        
        return {
          success: true,
          emails: detailedEmails,
          account: ACCOUNTS.gmail.clientId,
          type: 'business',
          real: true,
          count: detailedEmails.length
        };
      }
      
      return {
        success: true,
        emails: emails,
        account: ACCOUNTS.gmail.clientId,
        type: 'business',
        real: true,
        count: emails.length
      };
    } catch (error: any) {
      console.error('[Gmail] Error:', error.message);
      return {
        success: false,
        error: error.message,
        account: ACCOUNTS.gmail.clientId
      };
    }
  },
  
  // Get real calendar events
  '/api/calendar': async () => {
    try {
      console.log('[Calendar] Fetching real events...');
      
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      
      const result = await executeAction(
        'GOOGLECALENDAR_LIST_EVENTS',
        ACCOUNTS.calendar.accountId,
        {
          timeMin: startOfDay,
          timeMax: endOfDay,
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 10
        }
      );
      
      const events = result?.result?.items || result?.data?.items || [];
      
      return {
        success: true,
        events: events,
        account: ACCOUNTS.calendar.clientId,
        type: 'personal',
        real: true,
        count: events.length,
        date: now.toDateString()
      };
    } catch (error: any) {
      console.error('[Calendar] Error:', error.message);
      return {
        success: false,
        error: error.message,
        account: ACCOUNTS.calendar.clientId
      };
    }
  },
  
  // Text to speech using ElevenLabs through Composio
  '/api/voice/speak': async (request: Request) => {
    try {
      const { text, voice = 'Sarah' } = await request.json();
      
      if (!text) {
        return { success: false, error: 'No text provided' };
      }
      
      console.log('[ElevenLabs] Generating speech...');
      
      // Check if ElevenLabs is connected
      if (!ACCOUNTS.elevenlabs.accountId) {
        console.log('[ElevenLabs] Not connected, using fallback');
        return {
          success: false,
          error: 'ElevenLabs not connected through Composio',
          fallback: true
        };
      }
      
      // Generate speech through Composio
      const result = await executeAction(
        'ELEVENLABS_TEXT_TO_SPEECH',
        ACCOUNTS.elevenlabs.accountId,
        {
          text: text,
          voice_id: 'EXAVITQu4vr4xnSDxMaL', // Sarah voice
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        }
      );
      
      return {
        success: true,
        audio: result?.result?.audio || result?.data?.audio,
        message: 'Speech generated via Composio ElevenLabs'
      };
    } catch (error: any) {
      console.error('[ElevenLabs] Error:', error.message);
      return {
        success: false,
        error: error.message,
        fallback: true
      };
    }
  },
  
  // Memory operations using Mem0 through Composio
  '/api/memory/add': async (request: Request) => {
    try {
      const { memory, userId = 'mtl-cocktails' } = await request.json();
      
      if (!memory) {
        return { success: false, error: 'No memory provided' };
      }
      
      console.log('[Mem0] Adding memory...');
      
      // Check if Mem0 is connected
      if (!ACCOUNTS.mem0.accountId) {
        console.log('[Mem0] Not connected');
        return {
          success: false,
          error: 'Mem0 not connected through Composio'
        };
      }
      
      // Add memory through Composio
      const result = await executeAction(
        'MEM0_ADD_MEMORY',
        ACCOUNTS.mem0.accountId,
        {
          messages: memory,
          user_id: userId
        }
      );
      
      return {
        success: true,
        result: result?.result || result?.data,
        message: 'Memory stored via Composio Mem0'
      };
    } catch (error: any) {
      console.error('[Mem0] Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  '/api/memory/search': async (request: Request) => {
    try {
      const { query, userId = 'mtl-cocktails' } = await request.json();
      
      if (!query) {
        return { success: false, error: 'No query provided' };
      }
      
      console.log('[Mem0] Searching memories...');
      
      // Check if Mem0 is connected
      if (!ACCOUNTS.mem0.accountId) {
        console.log('[Mem0] Not connected');
        return {
          success: false,
          error: 'Mem0 not connected through Composio'
        };
      }
      
      // Search memories through Composio
      const result = await executeAction(
        'MEM0_SEARCH_MEMORIES',
        ACCOUNTS.mem0.accountId,
        {
          query: query,
          user_id: userId
        }
      );
      
      return {
        success: true,
        memories: result?.result || result?.data || [],
        message: 'Memories retrieved via Composio Mem0'
      };
    } catch (error: any) {
      console.error('[Mem0] Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Process voice command with real data
  '/api/voice/command': async (request: Request) => {
    try {
      const { command } = await request.json();
      
      if (!command) {
        return { success: false, error: 'No command provided' };
      }
      
      console.log(`[Voice] Processing command: "${command}"`);
      
      const lowerCommand = command.toLowerCase();
      
      // Store command in memory if Mem0 is connected
      if (ACCOUNTS.mem0.accountId) {
        try {
          await executeAction(
            'MEM0_ADD_MEMORY',
            ACCOUNTS.mem0.accountId,
            {
              messages: `User command: ${command} at ${new Date().toISOString()}`,
              user_id: 'mtl-cocktails'
            }
          );
        } catch (error) {
          console.error('[Mem0] Failed to store command:', error);
        }
      }
      
      // Email commands
      if (lowerCommand.includes('email') || lowerCommand.includes('mail') || lowerCommand.includes('message')) {
        const emails = await routes['/api/emails']();
        
        if (emails.success && emails.emails) {
          const count = emails.emails.length;
          let response = count > 0 
            ? `You have ${count} unread emails in your business account.`
            : `No unread emails in your business account.`;
            
          if (count > 0) {
            const latest = emails.emails[0];
            response += ` The latest is from ${latest.from} about ${latest.subject}.`;
          }
          
          return {
            success: true,
            type: 'emails',
            data: emails.emails,
            response,
            account: ACCOUNTS.gmail.clientId,
            real: true
          };
        }
        
        return emails;
      }
      
      // Calendar commands  
      if (lowerCommand.includes('calendar') || lowerCommand.includes('schedule') || lowerCommand.includes('meeting')) {
        const calendar = await routes['/api/calendar']();
        
        if (calendar.success && calendar.events) {
          const count = calendar.events.length;
          let response = count > 0
            ? `You have ${count} events on your calendar today.`
            : `No events scheduled for today.`;
            
          if (count > 0) {
            const next = calendar.events[0];
            const time = next.start?.dateTime 
              ? new Date(next.start.dateTime).toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit' 
                })
              : 'today';
            response += ` Your next event is ${next.summary} at ${time}.`;
          }
          
          return {
            success: true,
            type: 'calendar',
            data: calendar.events,
            response,
            account: ACCOUNTS.calendar.clientId,
            real: true
          };
        }
        
        return calendar;
      }
      
      // Combined command
      if (lowerCommand.includes('everything') || lowerCommand.includes('both') || 
          (lowerCommand.includes('email') && lowerCommand.includes('calendar'))) {
        
        const [emails, calendar] = await Promise.all([
          routes['/api/emails'](),
          routes['/api/calendar']()
        ]);
        
        let response = 'Here is your complete update: ';
        
        const emailCount = emails.emails?.length || 0;
        response += emailCount > 0 
          ? `You have ${emailCount} unread business emails. `
          : 'No unread business emails. ';
          
        const eventCount = calendar.events?.length || 0;
        response += eventCount > 0
          ? `You have ${eventCount} personal calendar events today.`
          : 'No personal events scheduled for today.';
          
        return {
          success: true,
          type: 'combined',
          data: {
            emails: emails.emails || [],
            events: calendar.events || []
          },
          response,
          accounts: {
            email: ACCOUNTS.gmail.clientId,
            calendar: ACCOUNTS.calendar.clientId
          },
          real: true
        };
      }
      
      // Memory search command
      if (lowerCommand.includes('remember') || lowerCommand.includes('memory') || lowerCommand.includes('recall')) {
        if (ACCOUNTS.mem0.accountId) {
          const query = command.replace(/remember|memory|recall|what|did|i|say|about/gi, '').trim();
          
          const result = await executeAction(
            'MEM0_SEARCH_MEMORIES',
            ACCOUNTS.mem0.accountId,
            {
              query: query || 'recent',
              user_id: 'mtl-cocktails'
            }
          );
          
          const memories = result?.result || result?.data || [];
          const response = memories.length > 0
            ? `I found ${memories.length} related memories. ${memories[0]?.memory || memories[0]}`
            : 'No memories found for that query.';
            
          return {
            success: true,
            type: 'memory',
            data: memories,
            response,
            real: true
          };
        }
        
        return {
          success: false,
          error: 'Memory system not connected'
        };
      }
      
      return {
        success: true,
        type: 'help',
        response: 'I can help you with emails, calendar events, and memories. Try saying "check my emails", "what\'s on my calendar", or "remember this meeting".',
        capabilities: {
          email: ACCOUNTS.gmail.accountId ? 'Connected' : 'Not connected',
          calendar: ACCOUNTS.calendar.accountId ? 'Connected' : 'Not connected',
          voice: ACCOUNTS.elevenlabs.accountId ? 'Connected' : 'Not connected',
          memory: ACCOUNTS.mem0.accountId ? 'Connected' : 'Not connected'
        }
      };
      
    } catch (error: any) {
      console.error('[Voice Command] Error:', error.message);
      return {
        success: false,
        error: error.message
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
    
    // Serve HTML file
    if (url.pathname === '/' || url.pathname === '/index.html') {
      try {
        const html = readFileSync(join(import.meta.dir, 'voice-agent-complete.html'), 'utf-8');
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html',
            ...corsHeaders,
          },
        });
      } catch {
        return new Response('HTML file not found. Please ensure voice-agent-complete.html exists.', { 
          status: 404,
          headers: corsHeaders
        });
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
        available: Object.keys(routes)
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

// Initialize accounts on startup
await initializeAccounts();

console.log(`
🚀 REAL Voice Agent Server with Composio Integration
====================================================
Server: http://localhost:${PORT}

✅ Services Status:
  - Gmail: ${ACCOUNTS.gmail.clientId} ${ACCOUNTS.gmail.accountId ? '✓' : '✗'}
  - Calendar: ${ACCOUNTS.calendar.clientId} ${ACCOUNTS.calendar.accountId ? '✓' : '✗'}
  - ElevenLabs: ${ACCOUNTS.elevenlabs.accountId ? 'Connected ✓' : 'Not connected ✗'}
  - Mem0: ${ACCOUNTS.mem0.accountId ? 'Connected ✓' : 'Not connected ✗'}

📡 API Endpoints:
  GET  /                     - Voice agent UI
  GET  /api/status          - System status
  GET  /api/emails          - Real Gmail emails
  GET  /api/calendar        - Real Calendar events
  POST /api/voice/speak     - ElevenLabs TTS via Composio
  POST /api/voice/command   - Process voice commands
  POST /api/memory/add      - Store memory via Mem0
  POST /api/memory/search   - Search memories via Mem0

🎤 Voice Commands:
  "Check my emails" - Real business emails
  "What's on my calendar?" - Real personal events
  "Check everything" - Both accounts
  "Remember this..." - Store in Mem0
  "What did I say about..." - Search memories

Press Ctrl+C to stop
`);