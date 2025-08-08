#!/bin/bash

# 16-Agent System Startup Script
# Ensures clean startup and master coordination

echo "🚀 Starting 16-Agent System..."

# 1. Clean any old scattered files
echo "🧹 Cleaning old system remnants..."
find /Users/ashleytower -maxdepth 2 -name "*113*" -delete 2>/dev/null
find /Users/ashleytower -maxdepth 2 -name "*scattered*" -delete 2>/dev/null

# 2. Update voice monitoring to correct count
echo "🔧 Setting correct agent count..."
sed -i '' 's/"agent_count": [0-9]*/"agent_count": 16/' /Users/ashleytower/voice-monitoring-status.json 2>/dev/null

# 3. Verify all 16 agents exist
echo "✅ Verifying 16 agents..."
AGENT_COUNT=$(ls /Users/ashleytower/.claude/agents/*.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$AGENT_COUNT" != "16" ]; then
    echo "❌ ERROR: Found $AGENT_COUNT agents, expected 16"
    exit 1
fi

# 4. Start Claude Code with master coordination
echo "🎯 Starting Claude Code with Master Coordination..."
echo "Master-coordination-agent will handle all tasks and report back to you."

# 5. Launch with clean context
cd /Users/ashleytower
claude --model opus --agents-enabled

echo "✨ 16-Agent System Ready!"
echo "Master-coordination-agent is now active and will coordinate all tasks."