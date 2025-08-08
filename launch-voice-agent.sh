#!/bin/bash

# Launch Voice Agent for MTL Craft Cocktails
# Email: info@mtlcraftcocktails.com

echo "=========================================="
echo "🚀 MTL Craft Cocktails Voice Agent"
echo "=========================================="
echo ""
echo "📧 Business Email: info@mtlcraftcocktails.com"
echo "✅ Gmail: Connected"
echo "⚠️  Calendar: Not connected (optional)"
echo ""

# Check if server is already running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Server is already running on port 3000"
else
    echo "🔄 Starting server..."
    cd /Users/ashleytower/email-calendar-agent
    bun server.ts &
    SERVER_PID=$!
    echo "✅ Server started (PID: $SERVER_PID)"
    sleep 2
fi

echo ""
echo "🌐 Opening voice agent in browser..."
echo ""

# Open the voice agent
open "file:///Users/ashleytower/email-calendar-agent/gmail-voice-agent.html"

echo "=========================================="
echo "✅ Voice Agent Ready!"
echo "=========================================="
echo ""
echo "🎤 Voice Commands You Can Try:"
echo "   • 'Check my emails'"
echo "   • 'Any new messages?'"
echo "   • 'Read unread emails'"
echo "   • 'What's on my calendar?'"
echo ""
echo "📌 Instructions:"
echo "1. Click the microphone button"
echo "2. Speak your command clearly"
echo "3. Wait for the response"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Keep script running
wait