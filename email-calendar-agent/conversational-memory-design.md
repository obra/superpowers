# Conversational Memory & Context System Design

## Overview
Design specification for implementing conversational context, memory, and contact management in the voice agent system.

## Core Requirements

### 1. Conversation Thread Tracking
- **Thread Persistence**: Maintain conversation history across sessions
- **Context Windows**: Keep relevant recent context in active memory
- **Thread Branching**: Support multiple concurrent conversation topics
- **Session Management**: Link conversations to specific sessions/times

### 2. Contact Recognition & Management
- **Entity Extraction**: Identify names, relationships, companies from conversations
- **Contact Database**: Store and retrieve contact information
- **Relationship Mapping**: Track connections between contacts
- **Communication History**: Link emails/messages to contacts

### 3. Proactive Suggestions
- **Missing Information Detection**: Identify when information is referenced but not available
- **Action Recommendations**: Suggest follow-up actions based on context
- **Smart Reminders**: Track commitments and deadlines mentioned
- **Pattern Recognition**: Learn user preferences and habits

### 4. Memory Systems
- **Short-term Memory**: Active conversation context (current session)
- **Long-term Memory**: Persistent knowledge across sessions
- **Episodic Memory**: Specific events and interactions
- **Semantic Memory**: Facts, relationships, learned information

## Technical Architecture

### Backend Architecture (Delegated to backend-architect)

#### Data Models
```typescript
// Conversation Thread Model
interface ConversationThread {
  id: string;
  userId: string;
  startTime: Date;
  lastActive: Date;
  topic?: string;
  participants: string[];
  messages: Message[];
  context: ContextWindow;
  status: 'active' | 'paused' | 'completed';
}

// Message Model
interface Message {
  id: string;
  threadId: string;
  timestamp: Date;
  speaker: 'user' | 'agent';
  content: string;
  intent?: string;
  entities?: ExtractedEntity[];
  embeddings?: number[];
}

// Contact Model
interface Contact {
  id: string;
  userId: string;
  name: string;
  aliases: string[];
  email?: string;
  phone?: string;
  company?: string;
  relationship?: string;
  lastInteraction?: Date;
  communicationHistory: CommunicationEvent[];
  notes?: string;
}

// Memory Store Model
interface MemoryStore {
  userId: string;
  shortTermMemory: ShortTermMemory;
  longTermMemory: LongTermMemory;
  episodicMemory: EpisodicMemory[];
  semanticMemory: SemanticFact[];
}
```

#### Storage Strategy
- **Primary Database**: PostgreSQL with pgvector for semantic search
- **Cache Layer**: Redis for active conversations and short-term memory
- **Vector Store**: Pinecone/Weaviate for embeddings and similarity search
- **Document Store**: MongoDB for flexible schema evolution

### API Design (Delegated to api-designer)

#### Core Endpoints
```typescript
// Thread Management
POST   /api/threads                    // Create new conversation thread
GET    /api/threads/:id                // Get thread with full context
PUT    /api/threads/:id/message        // Add message to thread
GET    /api/threads/search             // Search across threads

// Contact Management  
POST   /api/contacts                   // Create/update contact
GET    /api/contacts/search            // Search contacts by name/entity
GET    /api/contacts/:id/history       // Get communication history
POST   /api/contacts/extract           // Extract contacts from text

// Memory Operations
GET    /api/memory/context             // Get current context window
POST   /api/memory/store               // Store new memory
GET    /api/memory/recall              // Recall relevant memories
POST   /api/memory/search              // Semantic memory search

// Proactive Suggestions
GET    /api/suggestions/missing        // Get missing information
GET    /api/suggestions/actions        // Get recommended actions
POST   /api/suggestions/complete       // Mark suggestion as completed
```

### Memory Implementation (Delegated to python-pro)

#### Memory Systems Research
- **Mem0**: Open-source memory layer for LLMs
  - Supports multi-level memory (user, session, agent)
  - Built-in vector storage and retrieval
  - Automatic memory formation from conversations
  
- **LangChain Memory**: Conversation buffer and summary memory
  - ConversationBufferMemory for short conversations
  - ConversationSummaryMemory for long conversations
  - VectorStoreRetrieverMemory for semantic search

- **Custom Implementation Options**:
  - Use sentence-transformers for embeddings
  - Implement sliding window for context management
  - Build memory consolidation during idle times

#### Python Memory Service
```python
from typing import List, Dict, Optional
from datetime import datetime
import numpy as np
from sentence_transformers import SentenceTransformer
from mem0 import Memory

class ConversationalMemory:
    def __init__(self):
        self.mem0 = Memory()
        self.encoder = SentenceTransformer('all-MiniLM-L6-v2')
        self.short_term_buffer = []
        self.context_window_size = 10
        
    def process_message(self, message: str, speaker: str) -> Dict:
        """Process incoming message and update memory"""
        # Extract entities
        entities = self.extract_entities(message)
        
        # Generate embeddings
        embeddings = self.encoder.encode(message)
        
        # Store in memory
        memory_id = self.mem0.add(
            message,
            user_id=speaker,
            metadata={
                'timestamp': datetime.now(),
                'entities': entities,
                'embeddings': embeddings.tolist()
            }
        )
        
        # Update short-term buffer
        self.update_context_window(message, speaker)
        
        # Check for missing information
        suggestions = self.generate_suggestions(message, entities)
        
        return {
            'memory_id': memory_id,
            'entities': entities,
            'suggestions': suggestions
        }
    
    def recall_context(self, query: str, limit: int = 5) -> List[Dict]:
        """Recall relevant memories based on query"""
        results = self.mem0.search(query, limit=limit)
        return results
    
    def identify_missing_info(self, context: Dict) -> List[str]:
        """Identify missing information from context"""
        # Check for references without data
        missing = []
        if 'address' in context.get('requested', []):
            if not context.get('provided_address'):
                missing.append('address')
        return missing
```

### Contact Management System

#### Entity Recognition & Extraction
```python
import spacy
from typing import List, Dict

class ContactExtractor:
    def __init__(self):
        self.nlp = spacy.load("en_core_web_sm")
        
    def extract_contacts(self, text: str) -> List[Dict]:
        """Extract contact information from text"""
        doc = self.nlp(text)
        contacts = []
        
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                contacts.append({
                    'name': ent.text,
                    'type': 'person',
                    'context': self.get_context(ent, doc)
                })
            elif ent.label_ == "ORG":
                contacts.append({
                    'name': ent.text,
                    'type': 'organization',
                    'context': self.get_context(ent, doc)
                })
                
        return contacts
    
    def link_to_existing(self, extracted: Dict, database: List[Dict]) -> Optional[str]:
        """Link extracted contact to existing database entry"""
        # Fuzzy matching logic
        for contact in database:
            if self.similarity_score(extracted['name'], contact['name']) > 0.85:
                return contact['id']
        return None
```

### Proactive Suggestion Engine

```typescript
interface SuggestionEngine {
  // Analyze conversation for missing information
  analyzeMissingInfo(thread: ConversationThread): MissingInfo[];
  
  // Generate action suggestions
  suggestActions(context: ContextWindow): ActionSuggestion[];
  
  // Learn from user responses
  updatePreferences(action: string, accepted: boolean): void;
}

class ProactiveSuggestions implements SuggestionEngine {
  analyzeMissingInfo(thread: ConversationThread): MissingInfo[] {
    const missing: MissingInfo[] = [];
    
    // Example: Check if address was requested but not provided
    const addressRequested = thread.messages.some(m => 
      m.content.includes('address') && m.speaker === 'user'
    );
    
    const addressProvided = thread.messages.some(m =>
      m.entities?.some(e => e.type === 'ADDRESS')
    );
    
    if (addressRequested && !addressProvided) {
      missing.push({
        type: 'address',
        requestedBy: 'Jon', // Extract from context
        suggestedAction: 'email_request'
      });
    }
    
    return missing;
  }
  
  suggestActions(context: ContextWindow): ActionSuggestion[] {
    // Generate suggestions based on context patterns
    return [
      {
        action: 'send_email',
        recipient: 'Jon',
        purpose: 'request_address',
        confidence: 0.85,
        template: "Hi Jon, Could you please send me your address?"
      }
    ];
  }
}
```

## Integration Points

### 1. Voice Agent Integration
- Real-time context updates during conversation
- Memory recall triggered by natural language queries
- Proactive interruptions for suggestions

### 2. Email/Calendar Integration
- Link email threads to conversation memory
- Extract contacts from email signatures
- Track commitments made in emails

### 3. UI Components
- Visual conversation history
- Contact cards with interaction timeline
- Suggestion notifications

## Implementation Roadmap

### Phase 1: Core Memory System (Week 1)
- [ ] Set up PostgreSQL with pgvector
- [ ] Implement basic conversation threading
- [ ] Create memory storage/retrieval APIs
- [ ] Build context window management

### Phase 2: Contact Management (Week 2)
- [ ] Implement entity extraction
- [ ] Build contact database schema
- [ ] Create contact linking logic
- [ ] Add communication history tracking

### Phase 3: Proactive Features (Week 3)
- [ ] Build missing information detection
- [ ] Create suggestion generation engine
- [ ] Implement learning from user feedback
- [ ] Add pattern recognition

### Phase 4: Integration & Testing (Week 4)
- [ ] Integrate with voice agent
- [ ] Connect to email/calendar system
- [ ] Build UI components
- [ ] Comprehensive testing

## Performance Considerations

### Latency Requirements
- Context retrieval: <100ms
- Entity extraction: <200ms
- Suggestion generation: <300ms
- Memory search: <150ms

### Scalability
- Horizontal scaling for API servers
- Read replicas for database
- Distributed caching with Redis
- Async processing for heavy operations

## Security & Privacy

### Data Protection
- Encrypt memories at rest
- Secure API authentication
- User-scoped data isolation
- GDPR compliance for contact data

### Access Control
- User-owned memory spaces
- Permission-based contact sharing
- Audit logging for all operations

## Testing Strategy

### Unit Tests
- Memory operations
- Entity extraction accuracy
- Contact matching logic
- Suggestion generation

### Integration Tests
- End-to-end conversation flow
- Cross-system data consistency
- Performance under load

### User Acceptance Tests
- Natural conversation scenarios
- Suggestion relevance
- Memory recall accuracy

## Monitoring & Analytics

### Key Metrics
- Memory recall precision/recall
- Suggestion acceptance rate
- Entity extraction accuracy
- System response times

### Logging
- All conversation threads
- Memory operations
- Suggestion interactions
- Error tracking

---

## Next Steps

1. **Review & Approve Design**: Validate approach with stakeholders
2. **Set Up Infrastructure**: Provision databases and services
3. **Begin Implementation**: Start with Phase 1 core memory system
4. **Iterative Development**: Build and test incrementally