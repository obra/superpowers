#!/usr/bin/env python3
"""
Enhanced Voice System - Ashley's AI Assistant
High-quality voice alerts with multiple voice options and ElevenLabs integration
"""

import subprocess
import sys
import os
import httpx
import asyncio
import base64
import tempfile
from datetime import datetime
import json

class EnhancedVoiceSystem:
    def __init__(self):
        self.macos_voices = {
            "professional_female": "Samantha",    # Clear, professional
            "british_female": "Moira",            # Irish accent, warm
            "australian_female": "Karen",         # Australian, friendly
            "south_african_female": "Tessa",      # South African, distinctive
            "american_male": "Alex",              # Default male
            "british_male": "Daniel"              # British male
        }
        
        self.current_voice = "professional_female"
        self.elevenlabs_available = False
        self.elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
        
        # Check if ElevenLabs is available
        if self.elevenlabs_api_key:
            self.elevenlabs_available = True
            print("✅ ElevenLabs API available")
        else:
            print("ℹ️  Using macOS built-in voices (ElevenLabs API key not found)")
    
    def set_voice(self, voice_type):
        """Set the voice type for macOS speech"""
        if voice_type in self.macos_voices:
            self.current_voice = voice_type
            print(f"🎤 Voice set to: {voice_type} ({self.macos_voices[voice_type]})")
        else:
            print(f"❌ Unknown voice type: {voice_type}")
            print(f"Available voices: {', '.join(self.macos_voices.keys())}")
    
    def speak_macos(self, message, voice_type=None, rate="200"):
        """Speak using macOS with enhanced settings"""
        if voice_type:
            self.set_voice(voice_type)
        
        voice_name = self.macos_voices[self.current_voice]
        
        try:
            # Enhanced speech with better prosody
            cmd = ["say", "-v", voice_name, "-r", rate]
            
            # Add some pauses for better delivery
            enhanced_message = message.replace(". ", "... ").replace("? ", "?... ").replace("! ", "!... ")
            
            subprocess.run(cmd + [enhanced_message], check=True)
            return True
        except Exception as e:
            print(f"❌ macOS speech error: {e}")
            return False
    
    async def speak_elevenlabs(self, message, voice_id="21m00Tcm4TlvDq8ikWAM"):
        """Speak using ElevenLabs API for higher quality"""
        if not self.elevenlabs_available:
            print("❌ ElevenLabs not available, falling back to macOS")
            return self.speak_macos(message)
        
        headers = {
            "xi-api-key": self.elevenlabs_api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg"
        }
        
        payload = {
            "text": message,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.6,         # Slightly more stable
                "similarity_boost": 0.8,  # Higher similarity
                "style": 0.2,            # Slight style variation
                "use_speaker_boost": True # Enhanced clarity
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code == 200:
                    # Save and play audio
                    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_file:
                        temp_file.write(response.content)
                        temp_file.flush()
                        
                        # Play with afplay (macOS)
                        subprocess.run(["afplay", temp_file.name], check=True)
                        
                        # Clean up
                        os.unlink(temp_file.name)
                        
                    return True
                else:
                    print(f"❌ ElevenLabs API error: {response.status_code}")
                    return self.speak_macos(message)  # Fallback
                    
        except Exception as e:
            print(f"❌ ElevenLabs error: {e}, using macOS fallback")
            return self.speak_macos(message)  # Fallback
    
    def speak(self, message, use_elevenlabs=True, voice_type=None):
        """Main speak function with automatic fallback"""
        timestamp = datetime.now().strftime('%H:%M:%S')
        print(f"🔊 [{timestamp}] {message}")
        
        if use_elevenlabs and self.elevenlabs_available:
            # Use async function
            return asyncio.run(self.speak_elevenlabs(message))
        else:
            return self.speak_macos(message, voice_type)
    
    def test_voices(self):
        """Test different voice options"""
        test_message = "Hello Ashley, this is your enhanced voice coordination system speaking."
        
        print("🎤 Testing Enhanced Voice System")
        print("=" * 50)
        
        if self.elevenlabs_available:
            print("Testing ElevenLabs voice...")
            self.speak(test_message, use_elevenlabs=True)
            print("⏳ Waiting 2 seconds...\n")
            import time
            time.sleep(2)
        
        print("Testing macOS voices...")
        for voice_type, voice_name in self.macos_voices.items():
            print(f"🗣️  Testing {voice_type} ({voice_name})...")
            self.speak_macos(f"This is the {voice_type} voice option.", voice_type)
            import time
            time.sleep(1)
        
        print("✅ Voice testing complete!")
    
    def agent_coordination_alert(self, use_elevenlabs=True):
        """The main alert message with enhanced delivery"""
        message = ("Voice alert system test - Ashley, your agent coordination system is now operational "
                  "with 113 agents ready for deployment. Docker specialist is standing by for "
                  "containerization tasks. Should I proceed with system monitoring?")
        
        print("🎯 Enhanced Agent Coordination Alert")
        print("=" * 60)
        
        return self.speak(message, use_elevenlabs=use_elevenlabs, voice_type="professional_female")
    
    def list_available_voices(self):
        """List all available voice options"""
        print("🎤 Available Voice Options:")
        print("=" * 40)
        
        if self.elevenlabs_available:
            print("🌟 ElevenLabs (Premium):")
            print("  - Rachel (Professional female)")
            print("  - Custom neural voices")
            print()
        
        print("🍎 macOS Built-in Voices:")
        for voice_type, voice_name in self.macos_voices.items():
            print(f"  - {voice_type}: {voice_name}")

def main():
    voice_system = EnhancedVoiceSystem()
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "test":
            voice_system.agent_coordination_alert(use_elevenlabs=True)
            
        elif command == "test-macos":
            voice_system.agent_coordination_alert(use_elevenlabs=False)
            
        elif command == "test-voices":
            voice_system.test_voices()
            
        elif command == "list":
            voice_system.list_available_voices()
            
        elif command == "speak":
            message = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else "Hello Ashley"
            use_elevenlabs = "--macos" not in sys.argv
            voice_system.speak(message, use_elevenlabs=use_elevenlabs)
            
        elif command == "voice":
            if len(sys.argv) > 2:
                voice_system.set_voice(sys.argv[2])
                test_msg = "Voice has been changed successfully."
                voice_system.speak_macos(test_msg)
            else:
                print("Usage: python enhanced-voice-system.py voice [voice_type]")
                voice_system.list_available_voices()
        else:
            print("Usage: python enhanced-voice-system.py [test|test-macos|test-voices|list|speak|voice] [args...]")
    else:
        # Default test
        voice_system.agent_coordination_alert()

if __name__ == "__main__":
    main()