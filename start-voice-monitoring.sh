#!/bin/bash
# Background Voice Monitoring Service

echo "🎤 Starting Ashley's Voice Coordination System..."

# Start voice monitoring in background
nohup python /Users/ashleytower/voice-monitoring-system.py start "Agent Coordination & System Monitoring" > /Users/ashleytower/voice-monitoring-output.log 2>&1 &

# Save the process ID
echo $! > /Users/ashleytower/voice-monitoring.pid

echo "✅ Voice monitoring started in background"
echo "📊 Process ID: $!"
echo "📝 Logs: /Users/ashleytower/voice-monitoring-output.log"
echo "🔧 Status: /Users/ashleytower/voice-monitoring-status.json"
echo ""
echo "Commands:"
echo "  - Check status: python voice-monitoring-system.py status"
echo "  - Report task: python voice-monitoring-system.py task 'task name'"
echo "  - Report milestone: python voice-monitoring-system.py milestone 'milestone name'"
echo "  - Report error: python voice-monitoring-system.py error 'error description'"
echo "  - Stop monitoring: bash stop-voice-monitoring.sh"