#!/bin/bash
# Voice Alert Integration System
# Automatically triggers voice alerts during development work

VOICE_SYSTEM="/Users/ashleytower/automated-voice-alerts.py"
LOG_FILE="/Users/ashleytower/voice-alerts.log"

# Function to log and speak
voice_log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
    python "$VOICE_SYSTEM" alert "$1"
}

# Git hooks integration
setup_git_hooks() {
    if [ -d ".git" ]; then
        # Post-commit hook
        cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash
/Users/ashleytower/voice-alert-hook.sh git-commit
EOF
        chmod +x .git/hooks/post-commit
        
        # Post-push hook (for when available)
        cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash
/Users/ashleytower/voice-alert-hook.sh git-push
EOF
        chmod +x .git/hooks/pre-push
        
        echo "✅ Git hooks installed for voice alerts"
        voice_log "Git hooks configured for automatic voice notifications"
    fi
}

# Project initialization
init_project_voice_alerts() {
    PROJECT_NAME="$1"
    echo "🎤 Initializing voice alerts for project: $PROJECT_NAME"
    
    # Create project-specific alerts
    python "$VOICE_SYSTEM" start "$PROJECT_NAME"
    
    # Set up monitoring
    setup_git_hooks
    
    # Create project status file
    cat > ".voice-project-status" << EOF
PROJECT_NAME="$PROJECT_NAME"
START_TIME="$(date '+%Y-%m-%d %H:%M:%S')"
AGENTS_DEPLOYED=0
TASKS_COMPLETED=0
VOICE_ALERTS_ENABLED=true
EOF
    
    voice_log "Project $PROJECT_NAME initialized with voice coordination system"
}

# Work session start
start_work_session() {
    if [ -f ".voice-project-status" ]; then
        source ".voice-project-status"
        voice_log "Work session started for $PROJECT_NAME. All systems operational."
        python "$VOICE_SYSTEM" deploy "25" "development and coordination tasks"
    else
        voice_log "Work session started. Initializing coordination protocols."
    fi
}

# Work session end
end_work_session() {
    if [ -f ".voice-project-status" ]; then
        source ".voice-project-status"
        python "$VOICE_SYSTEM" summary "$TASKS_COMPLETED" "25"
    else
        voice_log "Work session completed. All agents standing by."
    fi
}

# Test the system
test_voice_system() {
    echo "🧪 Testing Voice Alert Integration System"
    echo "=========================================="
    
    # Test basic voice alert
    python "$VOICE_SYSTEM" test
    
    # Test different alert types
    echo "Testing different alert types..."
    sleep 2
    python "$VOICE_SYSTEM" deploy "5" "testing protocols"
    sleep 2
    python "$VOICE_SYSTEM" milestone "Voice system integration completed"
    sleep 2
    python "$VOICE_SYSTEM" complete "Integration testing"
    
    echo "✅ Voice alert system test completed"
}

# Main command handler
case "$1" in
    "init")
        PROJECT_NAME="${2:-Current Project}"
        init_project_voice_alerts "$PROJECT_NAME"
        ;;
    "start")
        start_work_session
        ;;
    "end")
        end_work_session
        ;;
    "test")
        test_voice_system
        ;;
    "alert")
        shift
        voice_log "$*"
        ;;
    "status")
        if [ -f ".voice-project-status" ]; then
            echo "📊 Voice Alert System Status:"
            cat ".voice-project-status"
        else
            echo "❌ No active project with voice alerts"
        fi
        ;;
    *)
        echo "Usage: $0 [init PROJECT_NAME|start|end|test|alert MESSAGE|status]"
        echo ""
        echo "Commands:"
        echo "  init PROJECT_NAME  - Initialize voice alerts for a project"
        echo "  start              - Start work session with voice coordination"
        echo "  end                - End work session with summary"
        echo "  test               - Test the voice alert system"
        echo "  alert MESSAGE      - Send custom voice alert"
        echo "  status             - Show current voice alert status"
        ;;
esac