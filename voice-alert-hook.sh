#!/bin/bash
# Voice Alert Hook - Automatically trigger voice updates during work

# Function to send voice alert
voice_alert() {
    python /Users/ashleytower/automated-voice-alerts.py alert "$1"
}

# Git hooks integration
if [ "$1" = "git-commit" ]; then
    voice_alert "Code committed successfully. Continuing development workflow."
elif [ "$1" = "git-push" ]; then
    voice_alert "Changes pushed to repository. Deployment pipeline activated."
elif [ "$1" = "test-pass" ]; then
    voice_alert "All tests passing. Code quality maintained."
elif [ "$1" = "test-fail" ]; then
    voice_alert "Test failures detected. Investigation required."
elif [ "$1" = "build-complete" ]; then
    voice_alert "Build completed successfully. Ready for deployment."
elif [ "$1" = "agent-deploy" ]; then
    voice_alert "Agent deployment initiated. Monitoring system performance."
else
    voice_alert "$1"
fi
