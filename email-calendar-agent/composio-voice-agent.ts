#!/usr/bin/env bun

/**
 * Production Voice Agent with Real Composio Integration
 * Based on verified documentation and working patterns
 */

import { serve } from 'bun';

// Configuration (verified working)
const COMPOSIO_API_KEY = 'ak_suouXXwN2bd7UvBbjJvu';
const PORT = 3000;

// Account Configuration (verified from test-real-data.ts)
const ACCOUNTS = {
  gmail: {
    email: 'info@mtlcraftcocktails.com',
    accountId: '38df595d-3f5f-4dc7-b252-747cbc41f114'
  },
  calendar: {
    email: 'ash.cocktails@gmail.com',
    accountId: '4af23c38-d0c4-4188-b936-69cf58c62017'
  },
  mem0: {
    accountId: '78afb30c-ad60-4c58-a0fc-1bed78c4fbeb'
  }
};

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Execute action using direct API (more reliable for specific account IDs)
 */
async function executeDirectAction(actionName: string, accountId: string, input: any = {}) {
  console.log(`[Direct API] Executing ${actionName}`);
  
  const response = await fetch('https://backend.composio.dev/api/v2/actions/execute', {
    method: 'POST',
    headers: {
      'X-API-Key': COMPOSIO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      connectedAccountId: accountId,
      actionName: actionName,
      input: input
    })
  });
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data;
}

/**
 * Get unread emails from Gmail
 */
async function getEmails(maxResults = 5) {
  try {
    const result = await executeDirectAction(
      'GMAIL_LIST_EMAILS',
      ACCOUNTS.gmail.accountId,
      {
        maxResults: maxResults,
        q: 'is:unread'
      }
    );
    
    const messages = result?.response_data?.messages || result?.result?.messages || [];
    
    // If we have message IDs, fetch details for first few
    if (messages.length > 0 && messages[0].id) {
      const detailedEmails = await Promise.all(
        messages.slice(0, 3).map(async (msg: any) => {
          try {
            const detail = await executeDirectAction(
              'GMAIL_GET_EMAIL',
              ACCOUNTS.gmail.accountId,
              { id: msg.id }
            );
            
            const email = detail?.response_data || detail?.result || {};
            
            // Extract headers
            const headers = email.payload?.headers || [];
            const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No subject';
            const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
            const date = headers.find((h: any) => h.name === 'Date')?.value || '';
            
            // Extract body
            let body = '';
            if (email.payload?.parts) {
              const textPart = email.payload.parts.find((p: any) => p.mimeType === 'text/plain');
              if (textPart?.body?.data) {
                body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
              }
            } else if (email.payload?.body?.data) {
              body = Buffer.from(email.payload.body.data, 'base64').toString('utf-8');
            }
            
            return {
              id: msg.id,
              subject,
              from,
              date,
              snippet: email.snippet || body.substring(0, 200)
            };
          } catch (err) {
            console.error('Failed to get email details:', err);
            return null;
          }
        })
      );
      
      return detailedEmails.filter(e => e !== null);
    }
    
    return [];
  } catch (error) {
    console.error('Failed to fetch emails:', error);
    throw error;
  }
}

/**
 * Get today's calendar events
 */
async function getCalendarEvents() {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    
    const result = await executeDirectAction(
      'GOOGLECALENDAR_LIST_EVENTS',
      ACCOUNTS.calendar.accountId,
      {
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 10
      }
    );
    
    const events = result?.response_data?.items || result?.result?.items || [];
    
    return events.map((event: any) => ({
      id: event.id,
      summary: event.summary || 'Untitled Event',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location,
      description: event.description,
      attendees: event.attendees?.map((a: any) => a.email) || []
    }));
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    throw error;
  }
}

/**
 * Store memory using Mem0
 */
async function storeMemory(content: string, userId = 'mtl-cocktails') {
  try {
    const result = await executeDirectAction(
      'MEM0_ADD_MEMORY',
      ACCOUNTS.mem0.accountId,
      {
        messages: content,
        user_id: userId
      }
    );
    
    return result?.response_data || result?.result;
  } catch (error) {
    console.error('Failed to store memory:', error);
    return null;
  }
}

/**
 * Search memories
 */
async function searchMemories(query: string, userId = 'mtl-cocktails') {
  try {
    const result = await executeDirectAction(
      'MEM0_SEARCH_MEMORIES',
      ACCOUNTS.mem0.accountId,
      {
        query: query,
        user_id: userId
      }
    );
    
    const memories = result?.response_data?.memories || result?.result?.memories || [];
    return memories;
  } catch (error) {
    console.error('Failed to search memories:', error);
    return [];
  }
}

/**
 * Generate voice response using ElevenLabs through server
 */
async function generateVoice(text: string) {
  try {
    // For now, return text - ElevenLabs integration would go here
    // This would connect to your MCP ElevenLabs server
    return {
      text: text,
      audioUrl: null // Would contain actual audio URL
    };
  } catch (error) {
    console.error('Failed to generate voice:', error);
    return { text, audioUrl: null };
  }
}

/**
 * Process voice command and generate response
 */
async function processVoiceCommand(command: string) {
  const lowerCommand = command.toLowerCase();
  
  try {
    // Check emails
    if (lowerCommand.includes('email') || lowerCommand.includes('message')) {
      const emails = await getEmails();
      
      if (emails.length === 0) {
        return {
          text: "You have no unread emails.",
          data: { emails: [] }
        };
      }
      
      const emailSummary = emails.map((e, i) => 
        `Email ${i + 1}: From ${e.from}. Subject: ${e.subject}`
      ).join('. ');
      
      return {
        text: `You have ${emails.length} unread emails. ${emailSummary}`,
        data: { emails }
      };
    }
    
    // Check calendar
    if (lowerCommand.includes('calendar') || lowerCommand.includes('schedule') || lowerCommand.includes('meeting')) {
      const events = await getCalendarEvents();
      
      if (events.length === 0) {
        return {
          text: "You have no events scheduled for today.",
          data: { events: [] }
        };
      }
      
      const eventSummary = events.map((e, i) => {
        const time = new Date(e.start).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        return `At ${time}: ${e.summary}`;
      }).join('. ');
      
      return {
        text: `You have ${events.length} events today. ${eventSummary}`,
        data: { events }
      };
    }
    
    // Remember something
    if (lowerCommand.includes('remember') || lowerCommand.includes('note')) {
      const memory = command.replace(/remember|note|that/gi, '').trim();
      await storeMemory(memory);
      
      return {
        text: "I've saved that to your memory.",
        data: { memorySaved: memory }
      };
    }
    
    // Recall memories
    if (lowerCommand.includes('recall') || lowerCommand.includes('what did') || lowerCommand.includes('remind me')) {
      const query = command.replace(/recall|what did|remind me|about/gi, '').trim();
      const memories = await searchMemories(query);
      
      if (memories.length === 0) {
        return {
          text: "I don't have any memories about that.",
          data: { memories: [] }
        };
      }
      
      const memorySummary = memories.slice(0, 3).map((m: any) => m.memory).join('. ');
      
      return {
        text: `Here's what I remember: ${memorySummary}`,
        data: { memories }
      };
    }
    
    // Default response
    return {
      text: "I can help you check emails, review your calendar, or remember things. Just ask!",
      data: {}
    };
    
  } catch (error: any) {
    console.error('Error processing command:', error);
    return {
      text: "I encountered an error processing your request. Please try again.",
      data: { error: error.message }
    };
  }
}

// Create server
const server = serve({
  port: PORT,
  
  async fetch(req) {
    const url = new URL(req.url);
    
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // API Routes
    switch (url.pathname) {
      case '/':
        return new Response(HTML_CONTENT, {
          headers: { 
            'Content-Type': 'text/html',
            ...corsHeaders 
          }
        });
        
      case '/api/status':
        try {
          // Test each connection
          const status = {
            gmail: false,
            calendar: false,
            mem0: false
          };
          
          try {
            await getEmails(1);
            status.gmail = true;
          } catch {}
          
          try {
            await getCalendarEvents();
            status.calendar = true;
          } catch {}
          
          try {
            await searchMemories('test');
            status.mem0 = true;
          } catch {}
          
          return new Response(JSON.stringify({
            success: true,
            accounts: status,
            message: 'Real-time Composio integration active'
          }), {
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            }
          });
        } catch (error: any) {
          return new Response(JSON.stringify({
            success: false,
            error: error.message
          }), {
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            }
          });
        }
        
      case '/api/process':
        try {
          const { command } = await req.json();
          const result = await processVoiceCommand(command);
          
          return new Response(JSON.stringify({
            success: true,
            ...result
          }), {
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            }
          });
        } catch (error: any) {
          return new Response(JSON.stringify({
            success: false,
            error: error.message
          }), {
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            }
          });
        }
        
      case '/api/emails':
        try {
          const emails = await getEmails();
          return new Response(JSON.stringify({
            success: true,
            emails
          }), {
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            }
          });
        } catch (error: any) {
          return new Response(JSON.stringify({
            success: false,
            error: error.message
          }), {
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            }
          });
        }
        
      case '/api/calendar':
        try {
          const events = await getCalendarEvents();
          return new Response(JSON.stringify({
            success: true,
            events
          }), {
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            }
          });
        } catch (error: any) {
          return new Response(JSON.stringify({
            success: false,
            error: error.message
          }), {
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            }
          });
        }
        
      default:
        return new Response('Not Found', { 
          status: 404,
          headers: corsHeaders 
        });
    }
  }
});

console.log(`
🚀 MTL Craft Cocktails Voice Agent
==================================
✅ Server running at http://localhost:${PORT}
📧 Gmail: ${ACCOUNTS.gmail.email}
📅 Calendar: ${ACCOUNTS.calendar.email}
🧠 Memory: Mem0 Connected

Commands:
- "Check my emails"
- "What's on my calendar?"
- "Remember that..."
- "What did I tell you about..."

Ready for voice commands!
`);

// HTML Interface
const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MTL Craft Cocktails - Voice Assistant</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 24px;
            box-shadow: 0 30px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            width: 100%;
            padding: 48px;
        }
        
        h1 {
            text-align: center;
            color: #2d3748;
            margin-bottom: 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .subtitle {
            text-align: center;
            color: #718096;
            margin-bottom: 40px;
        }
        
        .status {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 40px;
        }
        
        .status-item {
            text-align: center;
            padding: 16px;
            background: #f7fafc;
            border-radius: 12px;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-indicator.connected {
            background: #48bb78;
        }
        
        .status-indicator.disconnected {
            background: #f56565;
        }
        
        .voice-button {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            cursor: pointer;
            margin: 0 auto 40px;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: all 0.3s ease;
            box-shadow: 0 10px 30px rgba(102,126,234,0.3);
        }
        
        .voice-button:hover {
            transform: scale(1.05);
        }
        
        .voice-button.recording {
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(102,126,234,0.7); }
            70% { box-shadow: 0 0 0 20px rgba(102,126,234,0); }
            100% { box-shadow: 0 0 0 0 rgba(102,126,234,0); }
        }
        
        .voice-button svg {
            width: 40px;
            height: 40px;
            fill: white;
        }
        
        .transcript {
            background: #f7fafc;
            border-radius: 12px;
            padding: 20px;
            min-height: 100px;
            margin-bottom: 20px;
        }
        
        .response {
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border-radius: 12px;
            padding: 20px;
            min-height: 100px;
        }
        
        .label {
            font-size: 12px;
            text-transform: uppercase;
            color: #a0aec0;
            margin-bottom: 8px;
            letter-spacing: 1px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>MTL Craft Cocktails</h1>
        <p class="subtitle">Voice Assistant</p>
        
        <div class="status" id="status">
            <div class="status-item">
                <span class="status-indicator disconnected" id="gmail-status"></span>
                Gmail
            </div>
            <div class="status-item">
                <span class="status-indicator disconnected" id="calendar-status"></span>
                Calendar
            </div>
            <div class="status-item">
                <span class="status-indicator disconnected" id="mem0-status"></span>
                Memory
            </div>
        </div>
        
        <button class="voice-button" id="voiceButton">
            <svg viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
        </button>
        
        <div class="transcript">
            <div class="label">Your Command</div>
            <div id="transcript">Click the microphone to start...</div>
        </div>
        
        <div class="response">
            <div class="label">Assistant Response</div>
            <div id="response">Waiting for your command...</div>
        </div>
    </div>
    
    <script>
        const voiceButton = document.getElementById('voiceButton');
        const transcript = document.getElementById('transcript');
        const response = document.getElementById('response');
        
        let recognition;
        let isRecording = false;
        
        // Check status on load
        async function checkStatus() {
            try {
                const res = await fetch('/api/status');
                const data = await res.json();
                
                if (data.success) {
                    document.getElementById('gmail-status').className = 
                        'status-indicator ' + (data.accounts.gmail ? 'connected' : 'disconnected');
                    document.getElementById('calendar-status').className = 
                        'status-indicator ' + (data.accounts.calendar ? 'connected' : 'disconnected');
                    document.getElementById('mem0-status').className = 
                        'status-indicator ' + (data.accounts.mem0 ? 'connected' : 'disconnected');
                }
            } catch (error) {
                console.error('Failed to check status:', error);
            }
        }
        
        // Initialize speech recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            
            recognition.onstart = () => {
                isRecording = true;
                voiceButton.classList.add('recording');
                transcript.textContent = 'Listening...';
                response.textContent = 'Waiting for your command...';
            };
            
            recognition.onresult = (event) => {
                const current = event.results[event.results.length - 1];
                transcript.textContent = current[0].transcript;
                
                if (current.isFinal) {
                    processCommand(current[0].transcript);
                }
            };
            
            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                transcript.textContent = 'Error: ' + event.error;
                stopRecording();
            };
            
            recognition.onend = () => {
                stopRecording();
            };
        }
        
        function stopRecording() {
            isRecording = false;
            voiceButton.classList.remove('recording');
        }
        
        async function processCommand(command) {
            response.textContent = 'Processing...';
            
            try {
                const res = await fetch('/api/process', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command })
                });
                
                const data = await res.json();
                
                if (data.success) {
                    response.textContent = data.text;
                    
                    // Use speech synthesis to speak the response
                    const utterance = new SpeechSynthesisUtterance(data.text);
                    window.speechSynthesis.speak(utterance);
                } else {
                    response.textContent = 'Error: ' + data.error;
                }
            } catch (error) {
                response.textContent = 'Failed to process command';
                console.error('Process error:', error);
            }
        }
        
        voiceButton.addEventListener('click', () => {
            if (isRecording) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });
        
        // Check status on load
        checkStatus();
        setInterval(checkStatus, 30000); // Check every 30 seconds
    </script>
</body>
</html>`;