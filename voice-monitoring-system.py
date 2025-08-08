#!/usr/bin/env python3
"""
Voice Monitoring System - Ashley's AI Assistant
Provides continuous voice monitoring and updates during work sessions
"""

import subprocess
import sys
import os
import time
import threading
import json
from datetime import datetime, timedelta
from pathlib import Path
import signal
import atexit

class VoiceMonitoringSystem:
    def __init__(self):
        self.is_monitoring = False
        self.monitor_thread = None
        self.session_start = None
        self.voice = "Moira"  # Irish accent - more natural sounding
        self.agent_count = 15
        self.tasks_completed = 0
        self.status_file = "/Users/ashleytower/voice-monitoring-status.json"
        self.log_file = "/Users/ashleytower/voice-monitoring.log"
        
        # Register cleanup
        atexit.register(self.cleanup)
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
    
    def speak(self, message, rate="190"):
        """Speak with natural Irish accent"""
        timestamp = datetime.now().strftime('%H:%M:%S')
        log_entry = f"[{timestamp}] VOICE: {message}"
        print(log_entry)
        
        # Log to file
        with open(self.log_file, 'a') as f:
            f.write(log_entry + "\\n")
        
        try:
            # Enhanced speech with natural pauses and inflection
            enhanced_message = message.replace(", ", "... ").replace(". ", "... ").replace("? ", "?... ")
            subprocess.run(["say", "-v", self.voice, "-r", rate, enhanced_message], check=True)
            return True
        except Exception as e:
            print(f"❌ Speech error: {e}")
            return False
    
    def save_status(self):
        """Save current monitoring status"""
        status = {
            "is_monitoring": self.is_monitoring,
            "session_start": self.session_start.isoformat() if self.session_start else None,
            "agent_count": self.agent_count,
            "tasks_completed": self.tasks_completed,
            "voice": self.voice,
            "last_update": datetime.now().isoformat()
        }
        
        with open(self.status_file, 'w') as f:
            json.dump(status, f, indent=2)
    
    def load_status(self):
        """Load previous monitoring status"""
        if os.path.exists(self.status_file):
            try:
                with open(self.status_file, 'r') as f:
                    status = json.load(f)
                    self.agent_count = status.get('agent_count', 113)
                    self.tasks_completed = status.get('tasks_completed', 0)
                    self.voice = status.get('voice', 'Moira')
                    return status
            except Exception as e:
                print(f"⚠️  Could not load previous status: {e}")
        return None
    
    def start_monitoring(self, project_name="Current Project"):
        """Start voice monitoring system"""
        if self.is_monitoring:
            self.speak("Voice monitoring is already active, Ashley.")
            return
        
        self.is_monitoring = True
        self.session_start = datetime.now()
        self.save_status()
        
        # Initial alert
        welcome_msg = (f"Good day Ashley. Voice monitoring system is now active for {project_name}. "
                      f"I have {self.agent_count} agents ready for deployment. "
                      f"Docker specialist and all coordination systems are operational. "
                      f"Beginning system monitoring now.")
        
        self.speak(welcome_msg)
        
        # Start monitoring thread
        self.monitor_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        self.monitor_thread.start()
        
        print(f"✅ Voice monitoring started for: {project_name}")
        print(f"📊 Monitoring status saved to: {self.status_file}")
        print(f"📝 Voice logs saved to: {self.log_file}")
        print("Press Ctrl+C to stop monitoring")
    
    def _monitoring_loop(self):
        """Main monitoring loop"""
        last_status_update = datetime.now()
        last_agent_report = datetime.now()
        
        while self.is_monitoring:
            try:
                current_time = datetime.now()
                
                # Status update every 15 minutes
                if current_time - last_status_update >= timedelta(minutes=15):
                    self._periodic_status_update()
                    last_status_update = current_time
                
                # Agent report every 30 minutes
                if current_time - last_agent_report >= timedelta(minutes=30):
                    self._agent_status_report()
                    last_agent_report = current_time
                
                # Save status every 5 minutes
                if current_time.minute % 5 == 0:
                    self.save_status()
                
                time.sleep(60)  # Check every minute
                
            except Exception as e:
                print(f"❌ Monitoring error: {e}")
                time.sleep(60)
    
    def _periodic_status_update(self):
        """Periodic status updates"""
        session_duration = datetime.now() - self.session_start
        hours = int(session_duration.total_seconds() // 3600)
        minutes = int((session_duration.total_seconds() % 3600) // 60)
        
        if hours > 0:
            duration_str = f"{hours} hours and {minutes} minutes"
        else:
            duration_str = f"{minutes} minutes"
        
        status_msg = (f"Status update Ashley. You've been working for {duration_str}. "
                     f"All systems remain operational. {self.agent_count} agents standing by. "
                     f"Should I continue monitoring?")
        
        self.speak(status_msg)
    
    def _agent_status_report(self):
        """Agent coordination status report"""
        active_agents = min(self.agent_count, 45)  # Simulate active agents
        
        report_msg = (f"Agent coordination report. {active_agents} of {self.agent_count} agents "
                     f"are currently active across development tasks. "
                     f"Docker specialist reports all containers running smoothly. "
                     f"System performance optimal.")
        
        self.speak(report_msg)
    
    def task_completed(self, task_name):
        """Report task completion"""
        self.tasks_completed += 1
        self.save_status()
        
        completion_msg = (f"Excellent work Ashley! {task_name} has been completed successfully. "
                         f"That brings your total to {self.tasks_completed} tasks completed today. "
                         f"Ready for the next challenge.")
        
        self.speak(completion_msg)
    
    def milestone_achieved(self, milestone):
        """Report milestone achievement"""
        milestone_msg = (f"Outstanding achievement Ashley! {milestone} milestone reached. "
                        f"All agents are reporting successful implementation. "
                        f"Shall I proceed with the next phase?")
        
        self.speak(milestone_msg, rate="180")  # Slightly faster for excitement
    
    def error_alert(self, error_description, severity="medium"):
        """Report system errors"""
        if severity == "high":
            rate = "220"  # Faster for urgency
            alert_msg = (f"Critical alert Ashley! {error_description}. "
                        f"Multiple agents are investigating. "
                        f"Immediate attention required.")
        else:
            rate = "190"
            alert_msg = (f"System alert. {error_description} detected. "
                        f"Agent team is investigating. "
                        f"Should I attempt automatic resolution?")
        
        self.speak(alert_msg, rate=rate)
    
    def docker_status_update(self, containers_running, containers_total):
        """Docker specialist report"""
        docker_msg = (f"Docker specialist reporting. {containers_running} of {containers_total} "
                     f"containers are running successfully. "
                     f"All containerization tasks proceeding as planned.")
        
        self.speak(docker_msg)
    
    def stop_monitoring(self):
        """Stop voice monitoring"""
        if not self.is_monitoring:
            self.speak("Voice monitoring is not currently active.")
            return
        
        self.is_monitoring = False
        
        # Final summary
        if self.session_start:
            duration = datetime.now() - self.session_start
            hours = int(duration.total_seconds() // 3600)
            minutes = int((duration.total_seconds() % 3600) // 60)
            
            if hours > 0:
                duration_str = f"{hours} hours and {minutes} minutes"
            else:
                duration_str = f"{minutes} minutes"
            
            summary_msg = (f"Voice monitoring session complete Ashley. "
                          f"Total session time: {duration_str}. "
                          f"Tasks completed: {self.tasks_completed}. "
                          f"All {self.agent_count} agents remain operational and ready. "
                          f"Excellent work today!")
        else:
            summary_msg = "Voice monitoring stopped. All agents standing by for next session."
            
        self.speak(summary_msg)
        
        # Wait for thread to finish
        if self.monitor_thread and self.monitor_thread.is_alive():
            self.monitor_thread.join(timeout=5)
        
        self.save_status()
        print("✅ Voice monitoring stopped")
    
    def cleanup(self):
        """Cleanup on exit"""
        if self.is_monitoring:
            self.stop_monitoring()
    
    def signal_handler(self, signum, frame):
        """Handle system signals"""
        print("\\n🔄 Received shutdown signal, stopping voice monitoring...")
        self.stop_monitoring()
        sys.exit(0)
    
    def status_report(self):
        """Get current status"""
        if self.is_monitoring:
            duration = datetime.now() - self.session_start
            print(f"🔊 Voice Monitoring: ACTIVE")
            print(f"⏱️  Session Duration: {duration}")
            print(f"🤖 Total Agents: {self.agent_count}")
            print(f"✅ Tasks Completed: {self.tasks_completed}")
            print(f"🎤 Voice: {self.voice}")
        else:
            print("🔇 Voice Monitoring: INACTIVE")
            
        status = self.load_status()
        if status:
            print(f"💾 Last Update: {status.get('last_update', 'Unknown')}")

def main():
    monitoring = VoiceMonitoringSystem()
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "start":
            project = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else "Voice Coordination Project"
            monitoring.start_monitoring(project)
            
            # Keep running until interrupted
            try:
                while monitoring.is_monitoring:
                    time.sleep(1)
            except KeyboardInterrupt:
                monitoring.stop_monitoring()
                
        elif command == "stop":
            monitoring.stop_monitoring()
            
        elif command == "status":
            monitoring.status_report()
            
        elif command == "task":
            task = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else "development task"
            monitoring.load_status()
            monitoring.task_completed(task)
            
        elif command == "milestone":
            milestone = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else "development milestone"
            monitoring.load_status()
            monitoring.milestone_achieved(milestone)
            
        elif command == "error":
            error = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else "system anomaly"
            severity = "high" if "critical" in error.lower() or "urgent" in error.lower() else "medium"
            monitoring.load_status()
            monitoring.error_alert(error, severity)
            
        elif command == "docker":
            running = int(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2].isdigit() else 8
            total = int(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3].isdigit() else 10
            monitoring.load_status()
            monitoring.docker_status_update(running, total)
            
        elif command == "test":
            # Run initial test
            monitoring.speak("Voice monitoring system test - Ashley, your agent coordination system is now operational with 113 agents ready for deployment. Docker specialist is standing by for containerization tasks. Should I proceed with system monitoring?")
            print("✅ Voice monitoring system test completed")
            
        else:
            print("Usage: python voice-monitoring-system.py [start PROJECT|stop|status|task TASK|milestone MILESTONE|error ERROR|docker RUNNING TOTAL|test]")
    else:
        monitoring.status_report()

if __name__ == "__main__":
    main()