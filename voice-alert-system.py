#!/usr/bin/env python3
"""
Voice Alert System - Ashley's Agent Coordination
Provides voice alerts for agent status and asks questions
"""

import subprocess
import sys
import os
from datetime import datetime

def speak_message(message, voice="Samantha"):
    """
    Speak a message using macOS built-in text-to-speech
    Available voices: Alex, Daniel, Fred, Samantha, Victoria, etc.
    """
    try:
        # Use macOS say command
        subprocess.run(["say", "-v", voice, message], check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error speaking message: {e}")
        return False
    except FileNotFoundError:
        print("macOS 'say' command not found")
        return False

def voice_alert_test():
    """Test the voice alert system with the requested message"""
    message = ("Voice alert system test - Ashley, your agent coordination system is now operational "
              "with 113 agents ready for deployment. Docker specialist is standing by for "
              "containerization tasks. Should I proceed with system monitoring?")
    
    print("🎤 Voice Alert System Test")
    print("=" * 50)
    print(f"📅 Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"💬 Message: {message}")
    print("🔊 Speaking now...")
    
    success = speak_message(message)
    
    if success:
        print("✅ Voice alert delivered successfully!")
        return True
    else:
        print("❌ Voice alert failed!")
        return False

def continuous_voice_alerts():
    """Setup for continuous voice alerts during work sessions"""
    print("🎯 Voice Alert System - Continuous Mode")
    print("=" * 50)
    print("This system will provide voice updates during your work sessions.")
    print("Features:")
    print("- Agent status updates")
    print("- Project progress reports") 
    print("- Task completion notifications")
    print("- Interactive questions")
    print("\n🔊 Testing voice system...")
    
    # Test message
    test_message = ("System initialized. I will now provide voice updates as you work on projects. "
                   "Would you like me to begin monitoring your agent coordination system?")
    
    return speak_message(test_message)

def project_status_alert(project_name, status, next_action=None):
    """Alert for project status updates"""
    if next_action:
        message = f"Project update: {project_name} is {status}. Next action: {next_action}. Should I proceed?"
    else:
        message = f"Project update: {project_name} is {status}."
    
    print(f"📢 Project Alert: {message}")
    return speak_message(message)

def agent_coordination_alert(agent_count, task_type, question=None):
    """Alert for agent coordination status"""
    message = f"Agent coordination update: {agent_count} agents are active and working on {task_type}."
    
    if question:
        message += f" {question}"
    
    print(f"🤖 Agent Alert: {message}")
    return speak_message(message)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "test":
            voice_alert_test()
        elif sys.argv[1] == "continuous":
            continuous_voice_alerts()
        elif sys.argv[1] == "project":
            project_name = sys.argv[2] if len(sys.argv) > 2 else "Current Project"
            status = sys.argv[3] if len(sys.argv) > 3 else "in progress"
            project_status_alert(project_name, status)
        elif sys.argv[1] == "agents":
            count = sys.argv[2] if len(sys.argv) > 2 else "multiple"
            task = sys.argv[3] if len(sys.argv) > 3 else "development tasks"
            agent_coordination_alert(count, task)
        else:
            print("Usage: python voice-alert-system.py [test|continuous|project|agents]")
    else:
        voice_alert_test()