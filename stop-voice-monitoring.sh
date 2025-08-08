#!/bin/bash
# Stop Voice Monitoring Service

echo "🔇 Stopping Ashley's Voice Coordination System..."

if [ -f "/Users/ashleytower/voice-monitoring.pid" ]; then
    PID=$(cat /Users/ashleytower/voice-monitoring.pid)
    
    if kill -0 $PID 2>/dev/null; then
        echo "📍 Found monitoring process: $PID"
        
        # Send graceful shutdown
        python /Users/ashleytower/voice-monitoring-system.py stop
        
        # Wait a moment then force kill if necessary
        sleep 3
        if kill -0 $PID 2>/dev/null; then
            echo "🔄 Force stopping process..."
            kill -9 $PID
        fi
        
        rm -f /Users/ashleytower/voice-monitoring.pid
        echo "✅ Voice monitoring stopped"
    else
        echo "❌ Process not running"
        rm -f /Users/ashleytower/voice-monitoring.pid
    fi
else
    echo "❌ No monitoring process found"
fi

# Also check for any remaining python processes
pkill -f "voice-monitoring-system.py" 2>/dev/null || true

echo "🎯 Voice monitoring system is now inactive"