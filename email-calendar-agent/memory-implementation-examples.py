"""
Conversational Memory Implementation Examples
For Email/Calendar Voice Agent
"""

import json
import asyncio
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import re

# For production, these would be actual imports
# from mem0 import Memory
# from sentence_transformers import SentenceTransformer
# import spacy
# from fuzzywuzzy import fuzz
# import redis
# from sqlalchemy import create_engine

# ============================================================================
# Data Models
# ============================================================================

class SpeakerRole(Enum):
    USER = "user"
    AGENT = "agent"
    SYSTEM = "system"

class EntityType(Enum):
    PERSON = "person"
    ORGANIZATION = "organization"
    LOCATION = "location"
    EMAIL = "email"
    PHONE = "phone"
    ADDRESS = "address"
    DATE = "date"
    TIME = "time"

@dataclass
class Entity:
    """Extracted entity from conversation"""
    type: EntityType
    value: str
    confidence: float
    context: str
    position: tuple  # (start, end) in original text

@dataclass
class Message:
    """Single message in conversation"""
    id: str
    thread_id: str
    timestamp: datetime
    speaker: SpeakerRole
    content: str
    intent: Optional[str] = None
    entities: List[Entity] = None
    embeddings: Optional[List[float]] = None
    
    def to_dict(self):
        return {
            **asdict(self),
            'timestamp': self.timestamp.isoformat(),
            'speaker': self.speaker.value,
            'entities': [asdict(e) for e in (self.entities or [])]
        }

@dataclass
class Contact:
    """Contact information with history"""
    id: str
    name: str
    aliases: List[str]
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    company: Optional[str] = None
    relationship: Optional[str] = None
    last_interaction: Optional[datetime] = None
    interaction_count: int = 0
    notes: List[str] = None
    metadata: Dict[str, Any] = None

@dataclass
class ConversationThread:
    """Conversation thread with full context"""
    id: str
    user_id: str
    started_at: datetime
    last_active: datetime
    topic: Optional[str]
    participants: List[str]
    messages: List[Message]
    summary: Optional[str] = None
    is_active: bool = True
    metadata: Dict[str, Any] = None

# ============================================================================
# Core Memory System
# ============================================================================

class ConversationalMemorySystem:
    """
    Main memory system for managing conversation context and history
    """
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.active_thread: Optional[ConversationThread] = None
        self.context_window_size = 10
        self.short_term_memory: List[Message] = []
        self.contact_manager = ContactManager()
        self.suggestion_engine = ProactiveSuggestionEngine()
        
        # In production, initialize actual services
        # self.mem0 = Memory()
        # self.encoder = SentenceTransformer('all-MiniLM-L6-v2')
        # self.nlp = spacy.load("en_core_web_sm")
        # self.redis_client = redis.Redis()
        
    async def process_user_message(self, content: str) -> Dict[str, Any]:
        """
        Process incoming user message and update all memory systems
        """
        # Create message object
        message = Message(
            id=self._generate_id(),
            thread_id=self.active_thread.id if self.active_thread else self._create_thread().id,
            timestamp=datetime.now(),
            speaker=SpeakerRole.USER,
            content=content
        )
        
        # Extract entities and intent
        entities = await self._extract_entities(content)
        intent = await self._classify_intent(content)
        message.entities = entities
        message.intent = intent
        
        # Update conversation thread
        if self.active_thread:
            self.active_thread.messages.append(message)
            self.active_thread.last_active = datetime.now()
        
        # Update short-term memory
        self._update_short_term_memory(message)
        
        # Process contacts
        contact_updates = await self.contact_manager.process_entities(entities, content)
        
        # Generate proactive suggestions
        suggestions = await self.suggestion_engine.analyze(
            message=message,
            context=self.short_term_memory,
            contacts=contact_updates
        )
        
        # Store in long-term memory
        await self._store_long_term_memory(message)
        
        return {
            'message_id': message.id,
            'entities': [asdict(e) for e in entities],
            'intent': intent,
            'contact_updates': contact_updates,
            'suggestions': suggestions,
            'context_summary': self._get_context_summary()
        }
    
    async def _extract_entities(self, text: str) -> List[Entity]:
        """
        Extract entities from text using NER
        """
        entities = []
        
        # Email extraction
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        for match in re.finditer(email_pattern, text):
            entities.append(Entity(
                type=EntityType.EMAIL,
                value=match.group(),
                confidence=1.0,
                context=text[max(0, match.start()-20):min(len(text), match.end()+20)],
                position=(match.start(), match.end())
            ))
        
        # Phone extraction
        phone_pattern = r'\b(?:\+?1[-.]?)?\(?[0-9]{3}\)?[-.]?[0-9]{3}[-.]?[0-9]{4}\b'
        for match in re.finditer(phone_pattern, text):
            entities.append(Entity(
                type=EntityType.PHONE,
                value=match.group(),
                confidence=0.9,
                context=text[max(0, match.start()-20):min(len(text), match.end()+20)],
                position=(match.start(), match.end())
            ))
        
        # In production, use spaCy for advanced NER
        # doc = self.nlp(text)
        # for ent in doc.ents:
        #     entities.append(Entity(...))
        
        return entities
    
    async def _classify_intent(self, text: str) -> str:
        """
        Classify the intent of the message
        """
        text_lower = text.lower()
        
        # Simple intent classification
        if any(word in text_lower for word in ['send', 'email', 'message']):
            return 'send_email'
        elif any(word in text_lower for word in ['schedule', 'meeting', 'calendar']):
            return 'schedule_meeting'
        elif any(word in text_lower for word in ['find', 'search', 'look for']):
            return 'search'
        elif any(word in text_lower for word in ['remind', 'reminder', 'remember']):
            return 'set_reminder'
        elif '?' in text:
            return 'question'
        else:
            return 'statement'
    
    def _update_short_term_memory(self, message: Message):
        """
        Update short-term memory with sliding window
        """
        self.short_term_memory.append(message)
        if len(self.short_term_memory) > self.context_window_size:
            self.short_term_memory.pop(0)
    
    async def _store_long_term_memory(self, message: Message):
        """
        Store message in long-term memory with embeddings
        """
        # Generate embeddings
        # embeddings = self.encoder.encode(message.content)
        # message.embeddings = embeddings.tolist()
        
        # Store in vector database
        # self.mem0.add(
        #     message.content,
        #     user_id=self.user_id,
        #     metadata=message.to_dict()
        # )
        pass
    
    def _get_context_summary(self) -> str:
        """
        Generate summary of current context
        """
        if not self.short_term_memory:
            return "No active context"
        
        recent_messages = self.short_term_memory[-3:]
        summary = f"Recent conversation ({len(recent_messages)} messages): "
        summary += " | ".join([f"{m.speaker.value}: {m.content[:50]}..." 
                               for m in recent_messages])
        return summary
    
    def _create_thread(self) -> ConversationThread:
        """
        Create new conversation thread
        """
        self.active_thread = ConversationThread(
            id=self._generate_id(),
            user_id=self.user_id,
            started_at=datetime.now(),
            last_active=datetime.now(),
            topic=None,
            participants=[self.user_id],
            messages=[]
        )
        return self.active_thread
    
    def _generate_id(self) -> str:
        """Generate unique ID"""
        import uuid
        return str(uuid.uuid4())

# ============================================================================
# Contact Management
# ============================================================================

class ContactManager:
    """
    Manages contact extraction, matching, and history
    """
    
    def __init__(self):
        self.contacts: Dict[str, Contact] = {}
        self.name_to_id: Dict[str, str] = {}
    
    async def process_entities(self, entities: List[Entity], context: str) -> List[Dict]:
        """
        Process extracted entities and update contact database
        """
        updates = []
        
        for entity in entities:
            if entity.type == EntityType.PERSON:
                contact = await self._find_or_create_contact(entity.value)
                contact.last_interaction = datetime.now()
                contact.interaction_count += 1
                
                # Extract additional info from context
                if entity.type == EntityType.EMAIL:
                    contact.email = entity.value
                elif entity.type == EntityType.PHONE:
                    contact.phone = entity.value
                
                updates.append({
                    'contact_id': contact.id,
                    'name': contact.name,
                    'update_type': 'interaction',
                    'details': {'context': context[:100]}
                })
        
        return updates
    
    async def _find_or_create_contact(self, name: str) -> Contact:
        """
        Find existing contact or create new one
        """
        # Check exact match
        if name in self.name_to_id:
            return self.contacts[self.name_to_id[name]]
        
        # Check aliases
        for contact_id, contact in self.contacts.items():
            if name in contact.aliases:
                return contact
            # Fuzzy matching
            # if fuzz.ratio(name, contact.name) > 85:
            #     contact.aliases.append(name)
            #     return contact
        
        # Create new contact
        contact = Contact(
            id=self._generate_id(),
            name=name,
            aliases=[],
            interaction_count=1,
            notes=[]
        )
        self.contacts[contact.id] = contact
        self.name_to_id[name] = contact.id
        
        return contact
    
    def search_contacts(self, query: str) -> List[Contact]:
        """
        Search contacts by name or other attributes
        """
        results = []
        query_lower = query.lower()
        
        for contact in self.contacts.values():
            if (query_lower in contact.name.lower() or
                any(query_lower in alias.lower() for alias in contact.aliases) or
                (contact.email and query_lower in contact.email.lower()) or
                (contact.company and query_lower in contact.company.lower())):
                results.append(contact)
        
        return results
    
    def get_contact_history(self, contact_id: str) -> Dict:
        """
        Get full interaction history for a contact
        """
        if contact_id not in self.contacts:
            return {'error': 'Contact not found'}
        
        contact = self.contacts[contact_id]
        return {
            'contact': asdict(contact),
            'interaction_count': contact.interaction_count,
            'last_interaction': contact.last_interaction.isoformat() if contact.last_interaction else None,
            'notes': contact.notes or []
        }
    
    def _generate_id(self) -> str:
        import uuid
        return str(uuid.uuid4())

# ============================================================================
# Proactive Suggestion Engine
# ============================================================================

class ProactiveSuggestionEngine:
    """
    Generates proactive suggestions based on conversation context
    """
    
    async def analyze(self, message: Message, context: List[Message], 
                     contacts: List[Dict]) -> List[Dict]:
        """
        Analyze conversation and generate suggestions
        """
        suggestions = []
        
        # Check for missing information
        missing_info = await self._detect_missing_information(message, context)
        for item in missing_info:
            suggestions.append({
                'type': 'missing_info',
                'priority': 'high',
                'description': f"Missing {item['type']} from {item['source']}",
                'action': item['suggested_action'],
                'confidence': item['confidence']
            })
        
        # Check for follow-up actions
        actions = await self._suggest_follow_ups(message, context)
        suggestions.extend(actions)
        
        # Check for reminders
        reminders = await self._extract_reminders(message, context)
        suggestions.extend(reminders)
        
        return suggestions
    
    async def _detect_missing_information(self, message: Message, 
                                         context: List[Message]) -> List[Dict]:
        """
        Detect when information is referenced but not available
        """
        missing = []
        
        # Example: Check if address was requested
        if 'address' in message.content.lower():
            # Check if address was provided in context
            has_address = any(
                EntityType.ADDRESS in [e.type for e in (m.entities or [])]
                for m in context
            )
            
            if not has_address:
                # Find who was mentioned
                person_mentioned = None
                for m in context[-3:]:  # Check last 3 messages
                    for entity in (m.entities or []):
                        if entity.type == EntityType.PERSON:
                            person_mentioned = entity.value
                            break
                
                if person_mentioned:
                    missing.append({
                        'type': 'address',
                        'source': person_mentioned,
                        'suggested_action': f"Ask {person_mentioned} for their address",
                        'confidence': 0.85,
                        'template': f"Hi {person_mentioned}, could you please send me your address?"
                    })
        
        return missing
    
    async def _suggest_follow_ups(self, message: Message, 
                                 context: List[Message]) -> List[Dict]:
        """
        Suggest follow-up actions based on conversation
        """
        suggestions = []
        
        # If user asked a question, suggest finding the answer
        if message.intent == 'question':
            suggestions.append({
                'type': 'follow_up',
                'priority': 'medium',
                'description': 'Research answer to question',
                'action': 'search_knowledge_base',
                'confidence': 0.7
            })
        
        # If scheduling was mentioned, suggest checking calendar
        if message.intent == 'schedule_meeting':
            suggestions.append({
                'type': 'follow_up',
                'priority': 'high',
                'description': 'Check calendar availability',
                'action': 'check_calendar',
                'confidence': 0.9
            })
        
        return suggestions
    
    async def _extract_reminders(self, message: Message, 
                                context: List[Message]) -> List[Dict]:
        """
        Extract potential reminders from conversation
        """
        reminders = []
        
        # Look for time-based commitments
        time_keywords = ['tomorrow', 'next week', 'monday', 'later', 'remind']
        if any(keyword in message.content.lower() for keyword in time_keywords):
            reminders.append({
                'type': 'reminder',
                'priority': 'medium',
                'description': 'Potential reminder detected',
                'action': 'set_reminder',
                'confidence': 0.6,
                'content': message.content
            })
        
        return reminders

# ============================================================================
# Query and Recall System
# ============================================================================

class MemoryRecallSystem:
    """
    Handles memory queries and context recall
    """
    
    def __init__(self, memory_system: ConversationalMemorySystem):
        self.memory = memory_system
    
    async def query(self, question: str) -> Dict[str, Any]:
        """
        Process natural language query about past conversations
        """
        # Example: "Did Jon send his address?"
        
        # Extract key information from question
        query_entities = await self.memory._extract_entities(question)
        
        # Identify what's being asked
        query_type = self._classify_query(question)
        
        if query_type == 'information_check':
            return await self._check_information(question, query_entities)
        elif query_type == 'summary_request':
            return await self._generate_summary(question, query_entities)
        elif query_type == 'contact_query':
            return await self._query_contact(question, query_entities)
        else:
            return {'response': 'I need more context to answer that question'}
    
    def _classify_query(self, question: str) -> str:
        """
        Classify the type of memory query
        """
        question_lower = question.lower()
        
        if 'did' in question_lower or 'has' in question_lower:
            return 'information_check'
        elif 'summarize' in question_lower or 'what happened' in question_lower:
            return 'summary_request'
        elif 'who' in question_lower or 'contact' in question_lower:
            return 'contact_query'
        else:
            return 'general'
    
    async def _check_information(self, question: str, 
                                entities: List[Entity]) -> Dict[str, Any]:
        """
        Check if specific information was provided
        """
        # Example implementation for "Did Jon send his address?"
        person_name = None
        info_type = None
        
        # Extract person name
        for entity in entities:
            if entity.type == EntityType.PERSON:
                person_name = entity.value
                break
        
        # Determine what information is being checked
        if 'address' in question.lower():
            info_type = 'address'
        elif 'email' in question.lower():
            info_type = 'email'
        elif 'phone' in question.lower():
            info_type = 'phone'
        
        if person_name and info_type:
            # Search through conversation history
            found = False
            for message in self.memory.short_term_memory:
                if person_name.lower() in message.content.lower():
                    if info_type == 'address' and any(e.type == EntityType.ADDRESS 
                                                     for e in (message.entities or [])):
                        found = True
                        break
            
            if found:
                return {
                    'answer': f"Yes, {person_name} sent their {info_type}",
                    'found': True,
                    'suggestion': None
                }
            else:
                return {
                    'answer': f"No, {person_name} hasn't sent their {info_type} yet",
                    'found': False,
                    'suggestion': f"Would you like me to ask {person_name} for their {info_type}?"
                }
        
        return {'answer': "I couldn't understand what you're asking about", 'found': None}
    
    async def _generate_summary(self, question: str, 
                               entities: List[Entity]) -> Dict[str, Any]:
        """
        Generate summary of conversations or topics
        """
        # Implementation for generating summaries
        return {
            'summary': 'Summary generation not yet implemented',
            'message_count': len(self.memory.short_term_memory),
            'time_range': 'Last 10 messages'
        }
    
    async def _query_contact(self, question: str, 
                            entities: List[Entity]) -> Dict[str, Any]:
        """
        Query information about contacts
        """
        # Implementation for contact queries
        return {
            'contact_info': 'Contact query not yet implemented',
            'suggestion': 'Try searching for the contact by name'
        }

# ============================================================================
# Example Usage
# ============================================================================

async def example_conversation():
    """
    Example of how the memory system handles a conversation
    """
    # Initialize system for user
    memory_system = ConversationalMemorySystem(user_id="user123")
    recall_system = MemoryRecallSystem(memory_system)
    
    # Simulate conversation
    print("=== Starting Conversation ===\n")
    
    # User asks about meeting
    response1 = await memory_system.process_user_message(
        "I need to meet with Jon next week about the project"
    )
    print(f"User: I need to meet with Jon next week about the project")
    print(f"System: Detected entities: {response1['entities']}")
    print(f"System: Intent: {response1['intent']}")
    print(f"System: Suggestions: {response1['suggestions']}\n")
    
    # User asks for address
    response2 = await memory_system.process_user_message(
        "Can you ask Jon for his office address?"
    )
    print(f"User: Can you ask Jon for his office address?")
    print(f"System: Suggestions: {response2['suggestions']}\n")
    
    # User queries memory
    query_response = await recall_system.query("Did Jon send his address?")
    print(f"User: Did Jon send his address?")
    print(f"System: {query_response['answer']}")
    if query_response.get('suggestion'):
        print(f"System: {query_response['suggestion']}\n")
    
    # Simulate Jon's response
    response3 = await memory_system.process_user_message(
        "Jon said his address is 123 Main St, Suite 400"
    )
    print(f"User: Jon said his address is 123 Main St, Suite 400")
    print(f"System: Contact updates: {response3['contact_updates']}\n")
    
    # Query again
    query_response2 = await recall_system.query("Did Jon send his address?")
    print(f"User: Did Jon send his address?")
    print(f"System: {query_response2['answer']}\n")
    
    # Get contact info
    contacts = memory_system.contact_manager.search_contacts("Jon")
    if contacts:
        print(f"=== Contact Information ===")
        for contact in contacts:
            print(f"Name: {contact.name}")
            print(f"Last interaction: {contact.last_interaction}")
            print(f"Interaction count: {contact.interaction_count}")
            print(f"Address: {contact.address or 'Not available'}")

if __name__ == "__main__":
    # Run example
    asyncio.run(example_conversation())