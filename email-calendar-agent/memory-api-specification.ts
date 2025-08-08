/**
 * Memory and Context API Specification
 * For Email/Calendar Voice Agent
 */

// ============================================================================
// Type Definitions
// ============================================================================

export enum SpeakerRole {
  USER = 'user',
  AGENT = 'agent',
  SYSTEM = 'system'
}

export enum EntityType {
  PERSON = 'person',
  ORGANIZATION = 'organization',
  LOCATION = 'location',
  EMAIL = 'email',
  PHONE = 'phone',
  ADDRESS = 'address',
  DATE = 'date',
  TIME = 'time'
}

export interface Entity {
  type: EntityType;
  value: string;
  confidence: number;
  context: string;
  position: [number, number]; // [start, end] in original text
}

export interface Message {
  id: string;
  threadId: string;
  timestamp: Date;
  speaker: SpeakerRole;
  content: string;
  intent?: string;
  entities?: Entity[];
  embeddings?: number[];
}

export interface Contact {
  id: string;
  name: string;
  aliases: string[];
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  relationship?: string;
  lastInteraction?: Date;
  interactionCount: number;
  notes?: string[];
  metadata?: Record<string, any>;
}

export interface ConversationThread {
  id: string;
  userId: string;
  startedAt: Date;
  lastActive: Date;
  topic?: string;
  participants: string[];
  messages: Message[];
  summary?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface MemoryContext {
  shortTermMemory: Message[];
  activeThread?: ConversationThread;
  recentContacts: Contact[];
  contextWindow: number;
}

export interface Suggestion {
  id: string;
  type: 'missing_info' | 'follow_up' | 'reminder' | 'action';
  priority: 'low' | 'medium' | 'high';
  description: string;
  action?: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface QueryResult {
  answer: string;
  found: boolean;
  confidence: number;
  sources?: Message[];
  suggestions?: Suggestion[];
}

// ============================================================================
// API Service Interfaces
// ============================================================================

/**
 * Main Memory Service Interface
 */
export interface IMemoryService {
  // Message Processing
  processMessage(content: string, speaker: SpeakerRole): Promise<ProcessMessageResult>;
  
  // Thread Management
  createThread(topic?: string): Promise<ConversationThread>;
  getThread(threadId: string): Promise<ConversationThread>;
  listThreads(userId: string, limit?: number): Promise<ConversationThread[]>;
  archiveThread(threadId: string): Promise<void>;
  
  // Context Management
  getCurrentContext(): Promise<MemoryContext>;
  updateContext(message: Message): Promise<void>;
  clearContext(): Promise<void>;
  
  // Memory Operations
  storeMemory(content: string, metadata?: Record<string, any>): Promise<string>;
  recallMemory(query: string, limit?: number): Promise<Message[]>;
  searchMemory(query: string, filters?: SearchFilters): Promise<Message[]>;
  
  // Query System
  queryConversation(question: string): Promise<QueryResult>;
}

/**
 * Contact Management Service Interface
 */
export interface IContactService {
  // Contact CRUD
  createContact(contact: Partial<Contact>): Promise<Contact>;
  updateContact(contactId: string, updates: Partial<Contact>): Promise<Contact>;
  getContact(contactId: string): Promise<Contact>;
  deleteContact(contactId: string): Promise<void>;
  
  // Search and Discovery
  searchContacts(query: string): Promise<Contact[]>;
  findContactByName(name: string): Promise<Contact | null>;
  findContactByEmail(email: string): Promise<Contact | null>;
  
  // Interaction Tracking
  recordInteraction(contactId: string, interaction: InteractionRecord): Promise<void>;
  getInteractionHistory(contactId: string): Promise<InteractionRecord[]>;
  
  // Entity Processing
  extractContactsFromText(text: string): Promise<Contact[]>;
  linkEntityToContact(entity: Entity): Promise<Contact | null>;
}

/**
 * Suggestion Engine Service Interface
 */
export interface ISuggestionService {
  // Suggestion Generation
  generateSuggestions(context: MemoryContext): Promise<Suggestion[]>;
  
  // Missing Information Detection
  detectMissingInfo(thread: ConversationThread): Promise<MissingInfo[]>;
  
  // Action Recommendations
  recommendActions(message: Message, context: Message[]): Promise<ActionRecommendation[]>;
  
  // Learning and Feedback
  provideFeedback(suggestionId: string, accepted: boolean): Promise<void>;
  getAcceptanceRate(): Promise<number>;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ProcessMessageResult {
  messageId: string;
  threadId: string;
  entities: Entity[];
  intent?: string;
  contactUpdates: ContactUpdate[];
  suggestions: Suggestion[];
  contextSummary: string;
}

export interface ContactUpdate {
  contactId: string;
  name: string;
  updateType: 'created' | 'updated' | 'interaction';
  changes?: Partial<Contact>;
}

export interface SearchFilters {
  startDate?: Date;
  endDate?: Date;
  speaker?: SpeakerRole;
  threadId?: string;
  hasEntities?: EntityType[];
  intent?: string;
}

export interface InteractionRecord {
  timestamp: Date;
  type: 'email' | 'call' | 'meeting' | 'message' | 'mention';
  summary: string;
  threadId?: string;
  metadata?: Record<string, any>;
}

export interface MissingInfo {
  type: string;
  requestedBy?: string;
  requiredFor?: string;
  suggestedAction: string;
  template?: string;
  confidence: number;
}

export interface ActionRecommendation {
  action: string;
  target?: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
  template?: string;
}

// ============================================================================
// REST API Endpoints
// ============================================================================

/**
 * Memory API Endpoints
 */
export const MemoryAPIEndpoints = {
  // Message Processing
  processMessage: 'POST /api/memory/message',
  
  // Thread Management
  createThread: 'POST /api/memory/threads',
  getThread: 'GET /api/memory/threads/:id',
  listThreads: 'GET /api/memory/threads',
  archiveThread: 'DELETE /api/memory/threads/:id',
  
  // Context Operations
  getCurrentContext: 'GET /api/memory/context',
  updateContext: 'PUT /api/memory/context',
  clearContext: 'DELETE /api/memory/context',
  
  // Memory Storage & Recall
  storeMemory: 'POST /api/memory/store',
  recallMemory: 'GET /api/memory/recall',
  searchMemory: 'GET /api/memory/search',
  
  // Query System
  queryConversation: 'POST /api/memory/query',
} as const;

/**
 * Contact API Endpoints
 */
export const ContactAPIEndpoints = {
  // Contact CRUD
  createContact: 'POST /api/contacts',
  updateContact: 'PUT /api/contacts/:id',
  getContact: 'GET /api/contacts/:id',
  deleteContact: 'DELETE /api/contacts/:id',
  
  // Search
  searchContacts: 'GET /api/contacts/search',
  findByName: 'GET /api/contacts/find/name',
  findByEmail: 'GET /api/contacts/find/email',
  
  // Interactions
  recordInteraction: 'POST /api/contacts/:id/interactions',
  getHistory: 'GET /api/contacts/:id/history',
  
  // Entity Processing
  extractContacts: 'POST /api/contacts/extract',
  linkEntity: 'POST /api/contacts/link',
} as const;

/**
 * Suggestion API Endpoints
 */
export const SuggestionAPIEndpoints = {
  // Suggestion Generation
  generateSuggestions: 'POST /api/suggestions/generate',
  
  // Analysis
  detectMissingInfo: 'POST /api/suggestions/missing',
  recommendActions: 'POST /api/suggestions/actions',
  
  // Feedback
  provideFeedback: 'POST /api/suggestions/:id/feedback',
  getStats: 'GET /api/suggestions/stats',
} as const;

// ============================================================================
// WebSocket Events for Real-time Updates
// ============================================================================

export enum MemoryWebSocketEvents {
  // Incoming Events (Client → Server)
  PROCESS_MESSAGE = 'memory:process_message',
  QUERY_CONTEXT = 'memory:query_context',
  UPDATE_CONTACT = 'memory:update_contact',
  REQUEST_SUGGESTIONS = 'memory:request_suggestions',
  
  // Outgoing Events (Server → Client)
  MESSAGE_PROCESSED = 'memory:message_processed',
  CONTEXT_UPDATED = 'memory:context_updated',
  CONTACT_UPDATED = 'memory:contact_updated',
  SUGGESTION_GENERATED = 'memory:suggestion_generated',
  MEMORY_RECALLED = 'memory:memory_recalled',
}

// ============================================================================
// Client SDK Implementation
// ============================================================================

/**
 * Memory Client SDK for Frontend Integration
 */
export class MemoryClient {
  private baseUrl: string;
  private ws?: WebSocket;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Initialize WebSocket connection for real-time updates
   */
  async connect(): Promise<void> {
    this.ws = new WebSocket(`${this.baseUrl.replace('http', 'ws')}/ws`);
    
    return new Promise((resolve, reject) => {
      if (!this.ws) return reject(new Error('WebSocket not initialized'));
      
      this.ws.onopen = () => resolve();
      this.ws.onerror = (error) => reject(error);
    });
  }
  
  /**
   * Process a user message and get memory updates
   */
  async processMessage(content: string): Promise<ProcessMessageResult> {
    const response = await fetch(`${this.baseUrl}/api/memory/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, speaker: SpeakerRole.USER }),
    });
    
    return response.json();
  }
  
  /**
   * Query conversation history with natural language
   */
  async query(question: string): Promise<QueryResult> {
    const response = await fetch(`${this.baseUrl}/api/memory/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    
    return response.json();
  }
  
  /**
   * Search for contacts
   */
  async searchContacts(query: string): Promise<Contact[]> {
    const response = await fetch(
      `${this.baseUrl}/api/contacts/search?q=${encodeURIComponent(query)}`
    );
    
    return response.json();
  }
  
  /**
   * Get current conversation context
   */
  async getContext(): Promise<MemoryContext> {
    const response = await fetch(`${this.baseUrl}/api/memory/context`);
    return response.json();
  }
  
  /**
   * Subscribe to real-time memory updates
   */
  onMemoryUpdate(callback: (update: any) => void): void {
    if (!this.ws) throw new Error('WebSocket not connected');
    
    this.ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.type === MemoryWebSocketEvents.CONTEXT_UPDATED) {
        callback(data.payload);
      }
    });
  }
  
  /**
   * Subscribe to suggestion updates
   */
  onSuggestion(callback: (suggestion: Suggestion) => void): void {
    if (!this.ws) throw new Error('WebSocket not connected');
    
    this.ws.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.type === MemoryWebSocketEvents.SUGGESTION_GENERATED) {
        callback(data.payload);
      }
    });
  }
  
  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
  }
}

// ============================================================================
// React Hooks for Memory Integration
// ============================================================================

/**
 * React hook for memory operations
 */
export function useMemory() {
  const [client, setClient] = useState<MemoryClient | null>(null);
  const [context, setContext] = useState<MemoryContext | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const memoryClient = new MemoryClient(process.env.NEXT_PUBLIC_API_URL || '');
    
    memoryClient.connect().then(() => {
      setClient(memoryClient);
      setIsConnected(true);
      
      // Subscribe to updates
      memoryClient.onMemoryUpdate((update) => {
        setContext(update);
      });
      
      memoryClient.onSuggestion((suggestion) => {
        setSuggestions(prev => [...prev, suggestion]);
      });
      
      // Load initial context
      memoryClient.getContext().then(setContext);
    });
    
    return () => {
      memoryClient.disconnect();
    };
  }, []);
  
  const processMessage = useCallback(async (content: string) => {
    if (!client) return null;
    return client.processMessage(content);
  }, [client]);
  
  const queryMemory = useCallback(async (question: string) => {
    if (!client) return null;
    return client.query(question);
  }, [client]);
  
  const searchContacts = useCallback(async (query: string) => {
    if (!client) return [];
    return client.searchContacts(query);
  }, [client]);
  
  return {
    isConnected,
    context,
    suggestions,
    processMessage,
    queryMemory,
    searchContacts,
    clearSuggestions: () => setSuggestions([]),
  };
}

// ============================================================================
// Example Usage in React Component
// ============================================================================

/**
 * Example React component using the memory system
 */
export const VoiceAgentWithMemory: React.FC = () => {
  const {
    isConnected,
    context,
    suggestions,
    processMessage,
    queryMemory,
    searchContacts,
    clearSuggestions,
  } = useMemory();
  
  const [input, setInput] = useState('');
  const [queryInput, setQueryInput] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const result = await processMessage(input);
    console.log('Message processed:', result);
    setInput('');
  };
  
  const handleQuery = async () => {
    if (!queryInput.trim()) return;
    
    const result = await queryMemory(queryInput);
    setQueryResult(result);
    setQueryInput('');
  };
  
  return (
    <div className="flex flex-col h-screen">
      {/* Connection Status */}
      <div className={`p-2 text-center ${isConnected ? 'bg-green-100' : 'bg-red-100'}`}>
        Memory System: {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      
      {/* Context Display */}
      <div className="p-4 bg-gray-50">
        <h3 className="font-bold">Current Context</h3>
        <p className="text-sm">
          Active Thread: {context?.activeThread?.id || 'None'}
        </p>
        <p className="text-sm">
          Messages in Context: {context?.shortTermMemory?.length || 0}
        </p>
      </div>
      
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="p-4 bg-blue-50">
          <h3 className="font-bold">Suggestions</h3>
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="p-2 mb-2 bg-white rounded">
              <p className="text-sm">{suggestion.description}</p>
              <span className={`text-xs px-2 py-1 rounded bg-${
                suggestion.priority === 'high' ? 'red' : 
                suggestion.priority === 'medium' ? 'yellow' : 'gray'
              }-100`}>
                {suggestion.priority}
              </span>
            </div>
          ))}
          <button 
            onClick={clearSuggestions}
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded"
          >
            Clear Suggestions
          </button>
        </div>
      )}
      
      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Send
          </button>
        </div>
      </div>
      
      {/* Query Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
            placeholder="Ask about past conversations..."
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={handleQuery}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Query
          </button>
        </div>
        
        {/* Query Result */}
        {queryResult && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <p className="font-semibold">{queryResult.answer}</p>
            {queryResult.suggestions && queryResult.suggestions.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">Suggestions:</p>
                {queryResult.suggestions.map((s, i) => (
                  <p key={i} className="text-sm ml-2">• {s.description}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Export all types and utilities
// ============================================================================

export default {
  MemoryClient,
  useMemory,
  MemoryAPIEndpoints,
  ContactAPIEndpoints,
  SuggestionAPIEndpoints,
  MemoryWebSocketEvents,
};