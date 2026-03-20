# 01900 Procurement Agent-Based Input Collection Implementation Plan

## Overview
This plan details the implementation of an agent-based input collection system for procurement orders, providing a conversational interface for users to provide procurement details naturally, which will then be transformed into structured data for SOW generation.

**Document Status**: 🟢 IN PROGRESS
**Created**: 2026-01-27T10:52:00Z
**Priority**: HIGH
**Estimated Duration**: 6-8 weeks
**Author**: AI Assistant (Construct AI)

---

## Executive Summary

### Current State
- ✅ 6-Agent procurement processing system (production-ready)
- ✅ SOW Scope-of-Work manual form-based input
- ✅ **NEW**: Chatbot workflow streaming for real-time agent execution display
- ❌ **Gap**: No agent-based input collection

### Solution
Implement a conversational agent interface that:
1. Engages users in natural conversation about procurement needs
2. Extracts structured data from natural language
3. Validates requirements in real-time
4. Feeds structured data into existing SOW generation workflow
5. Provides intelligent follow-up questions and suggestions
6. **Enhanced**: Integrates with chatbot workflow streaming for immediate feedback

### Enhanced Features (2026-01-28)
The implementation will incorporate real-time chatbot workflow streaming that:
- Displays sequential agent execution progress immediately after order creation
- Uses event-based communication for instant feedback
- Shows performance metrics and processing times for each agent
- Provides professional, formatted messages with visual indicators
- Completes workflow in ~4.5 seconds with 7 agents executing in sequence

**Total Processing Time**: ~4.5 seconds for complete workflow

**Agents in Streaming**:
1. Template Analysis Agent (800ms) - Analyzes procurement requirements
2. Requirements Extraction Agent (700ms) - Extracts structured data
3. Compliance Validation Agent (900ms) - Validates against standards
4. Field Population Agent (800ms) - Maps data to template fields
5. Quality Assurance Agent (600ms) - Validates document completeness
6. Final Review Agent (850ms) - Assembles complete package
7. Assignment Agent (650ms) - Distributes to specialists

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                      │
├─────────────────────────────────────────────────────────────┤
│  ProcurementInputAgentPage (New Route: /procurement/input)  │
│  ├─ AgentChatInterface (Reusable Component)                 │
│  ├─ DataExtractionPreview (Structured Data View)            │
│  ├─ AgentSessionManager (Conversation State)                │
│  └─ HandoffComponent (Transition to SOW Generation)         │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Agent Intelligence Layer                  │
├─────────────────────────────────────────────────────────────┤
│  ProcurementInputAgent (Core Agent)                         │
│  ├─ Discovery Phase Agent                                   │
│  ├─ Requirements Extraction Agent                           │
│  ├─ Complexity Assessment Agent                             │
│  ├─ Template Matching Agent                                 │
│  ├─ Validation Agent                                        │
│  └─ Handoff Coordinator                                     │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Processing Layer                     │
├─────────────────────────────────────────────────────────────┤
│  Natural Language Processor                                  │
│  ├─ Intent Recognition                                      │
│  ├─ Entity Extraction                                       │
│  ├─ Context Management                                      │
│  └─ Structured Data Builder                                 │
│                                                             │
│  ProcurementAgentService                                    │
│  ├─ Extract Data from Conversation                          │
│  ├─ Validate Against Schema                                 │
│  ├─ Transform to SOW Input Format                           │
│  └─ Integration with Existing Workflow                      │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Existing Integration                      │
├─────────────────────────────────────────────────────────────┤
│  Existing SOW Workflow (ScopeOfWorkModal)                   │
│  ├─ Template Selection (Step 1)                             │
│  ├─ Draft Creation (Step 2)                                 │
│  ├─ AI Enhancement (Step 3)                                 │
│  ├─ Review & Save (Step 4)                                  │
│  └─ Agent Input Pre-fills All Steps                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation & Architecture (Week 1-2)

#### 1.1 Database Schema Updates
```sql
-- Add conversation tracking to procurement orders
ALTER TABLE procurement_orders 
ADD COLUMN IF NOT EXISTS conversation_id UUID,
ADD COLUMN IF NOT EXISTS input_method VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS conversation_metadata JSONB;

-- Create agent conversation log table
CREATE TABLE IF NOT EXISTS procurement_agent_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    session_id UUID NOT NULL,
    messages JSONB[] DEFAULT '{}',
    extracted_data JSONB,
    validation_errors JSONB,
    status VARCHAR(50) DEFAULT 'active', -- active, completed, abandoned
    complexity_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Index for performance
CREATE INDEX idx_procurement_conversations_user ON procurement_agent_conversations(user_id);
CREATE INDEX idx_procurement_conversations_session ON procurement_agent_conversations(session_id);
CREATE INDEX idx_procurement_conversations_status ON procurement_agent_conversations(status);
```

#### 1.2 New API Endpoints
Create `/server/routes/procurement-agent-routes.js`:
```javascript
POST /api/procurement/agent/start-session
  - Initialize new conversation session
  - Returns: session_id, initial_prompt

POST /api/procurement/agent/send-message
  - Send user message to agent
  - Stream agent response
  - Returns: agent_message, extracted_data, next_actions

POST /api/procurement/agent/extract-data
  - Extract structured data from conversation
  - Returns: structured_data, validation_errors

POST /api/procurement/agent/validate
  - Validate extracted data against procurement schema
  - Returns: is_valid, errors, warnings

POST /api/procurement/agent/continue-session
  - Continue existing session
  - Returns: conversation_state, extracted_data

DELETE /api/procurement/agent/end-session
  - Mark session as completed/abandoned
```

#### 1.3 Agent Conversation Flow Design
Design 6-stage conversation flow:

**Stage 1: Discovery & Context** (2-3 exchanges)
```
Agent: "Hello! I'm your procurement assistant. I'll help you create a procurement order. To start, what type of procurement do you need?"
User: "I need to procure equipment for our production line expansion"
Agent: "Great! Is this equipment purchase, work (installation), or services (consulting)?"
User: "It's equipment purchase"
Agent: "Got it. What's the approximate value of this procurement?"
User: "Around R500,000"
```

**Stage 2: Detailed Requirements** (3-5 exchanges)
```
Agent: "What specific equipment do you need? Please describe the items, quantities, and any technical specifications."
User: "We need two industrial compressors, 50HP each, with 5-year warranty"
Agent: "Do you have specific brands or models in mind, or is this open to vendor recommendations?"
User: "Open to recommendations, but must meet ISO 9001 standards"
```

**Stage 3: Technical & Compliance** (2-4 exchanges)
```
Agent: "What are the delivery requirements? Any specific timeline?"
User: "Need delivery within 90 days, installation included"
Agent: "Any safety certifications or compliance requirements for the equipment?"
User: "Must have OSHA compliance and local electrical standards certification"
```

**Stage 4: Supplier & Project** (1-2 exchanges)
```
Agent: "Do you have a preferred supplier, or should I help identify potential vendors?"
User: "We have a preferred supplier list, but open to competitive quotes"
Agent: "Which project should this be associated with?"
User: "Production Line Expansion Project 2026"
```

**Stage 5: Template Matching** (1 exchange)
```
Agent: "Based on your requirements (R500k equipment purchase, 90-day delivery, installation included, safety certifications), I recommend using our 'Capital Equipment Purchase' template. This includes appendices for:
- A: Product Specifications
- B: Safety Data Sheets  
- C: Delivery Schedule
- D: Installation Requirements
- E: Logistics Planning
- F: Warranty & Maintenance

Should I proceed with this template?"
User: "Yes, that looks good"
```

**Stage 6: Confirmation & Handoff** (1-2 exchanges)
```
Agent: "Perfect! I've gathered all the information. Let me summarize:
- Type: Equipment Purchase (Capital)
- Value: R500,000
- Items: 2x 50HP industrial compressors
- Compliance: ISO 9001, OSHA, electrical standards
- Timeline: 90 days with installation
- Appendices: A-F required
- Project: Production Line Expansion 2026

I'll now create the structured SOW data for generation. Should I proceed?"
User: "Yes, proceed"
Agent: "Creating SOW now... [Handoff to existing SOW generation system]"
```

---

### Phase 2: Frontend Components (Week 2-4)

#### 2.1 Main Page Component
Create `client/src/pages/01900-procurement/components/ProcurementInputAgentPage.js`:

**Features:**
- Route: `/procurement/input-agent`
- Integrates with existing routing system
- Uses ChatbotBase component for UI
- Displays agent conversation in real-time
- Shows extracted data preview panel
- Provides handoff to SOW generation

**UI Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Procurement Input Agent - New SOW Creation                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Agent Conversation Interface                            │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  Agent: "What type of procurement do you need?"     │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  User: "Equipment purchase for production line"     │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  Agent: "Great! Approximate value?"                 │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                             │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  [Input box with "Type your message..."]           │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Extracted Data Preview                                   │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  📦 Procurement Type: Equipment Purchase          │ │ │
│  │  │  💰 Value: R500,000                                │ │ │
│  │  │  📋 Items: 2x 50HP industrial compressors          │ │ │
│  │  │  ⚠️  Compliance: ISO 9001, OSHA                    │ │ │
│  │  │  📅 Timeline: 90 days                              │ │ │
│  │  │  📊 Complexity: Medium (Appendices A-F)           │ │ │
│  │  │  🏢 Project: Production Line Expansion 2026       │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │  [Create SOW Button - enabled when complete]             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Quick Actions                                            │ │
│  │  [Save Progress]  [Clear Session]  [View Examples]       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.2 Agent Chat Interface Component
Create `client/src/components/agents/ProcurementAgentChat.js`:

**Features:**
- Real-time message streaming
- Typing indicators
- Message history
- Scroll to latest message
- Support for rich content (lists, tables, buttons)
- Error handling and retry

**Props:**
```javascript
{
  sessionId: String,
  onMessage: Function,
  onExtractedData: Function,
  onValidationError: Function,
  onSessionComplete: Function,
  autoScroll: Boolean,
  theme: String
}
```

#### 2.3 Data Extraction Preview Component
Create `client/src/components/agents/DataExtractionPreview.js`:

**Features:**
- Display extracted structured data
- Show validation status (valid/invalid/warnings)
- Highlight missing information
- Editable fields for manual correction
- Confidence scores for each extracted field

**Data Display:**
```javascript
{
  procurement_type: { value: "equipment_purchase", confidence: 0.95, source: "explicit" },
  estimated_value: { value: 500000, confidence: 0.98, source: "explicit" },
  items: { 
    value: "2x 50HP industrial compressors", 
    confidence: 0.92, 
    source: "explicit" 
  },
  compliance_requirements: {
    value: ["ISO 9001", "OSHA", "Electrical Standards"],
    confidence: 0.88,
    source: "inferred"
  },
  // ... more fields
}
```

#### 2.4 Handoff Component
Create `client/src/components/agents/SOWHandoffComponent.js`:

**Features:**
- Takes extracted data and converts to SOW format
- Pre-fills existing `ScopeOfWorkModal`
- Shows preview before handoff
- Validates all required fields
- Initiates SOW generation with proper context

**Workflow:**
1. Map extracted data to SOW form fields
2. Create `prefilledData` object
3. Open `ScopeOfWorkModal` with `initialData`
4. Skip manual entry steps where possible
5. Enable user to review/edit before final generation

---

### Phase 3: Agent Intelligence Layer (Week 3-5)

#### 3.1 ProcurementInputAgent Class
Create `server/agents/ProcurementInputAgent.js`:

**Core Methods:**
```javascript
class ProcurementInputAgent {
  constructor(sessionId, userId) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.conversationState = {};
    this.extractedData = {};
    this.stage = 'discovery'; // discovery, requirements, compliance, template, validation, handoff
  }

  async processUserMessage(message) {
    // 1. Store message
    await this.storeMessage('user', message);
    
    // 2. Extract intent and entities
    const analysis = await this.analyzeMessage(message);
    
    // 3. Update extracted data
    this.updateExtractedData(analysis);
    
    // 4. Determine next stage
    this.determineNextStage();
    
    // 5. Generate appropriate agent response
    const response = await this.generateResponse();
    
    // 6. Store agent response
    await this.storeMessage('agent', response);
    
    // 7. Return structured response
    return {
      agentMessage: response,
      extractedData: this.extractedData,
      nextActions: this.getNextActions(),
      stage: this.stage
    };
  }

  async analyzeMessage(message) {
    // Use existing LLM infrastructure for analysis
    // Extract intent, entities, confidence scores
    // Mark data sources (explicit vs inferred)
  }

  updateExtractedData(analysis) {
    // Merge new data with existing
    // Update confidence scores
    // Track data sources
  }

  determineNextStage() {
    // Logic to progress through conversation stages
    // Based on completeness of extracted data
  }

  generateResponse() {
    // Generate appropriate response based on current stage
    // Ask clarifying questions
    // Provide suggestions
    // Confirm when complete
  }

  getNextActions() {
    // Return available actions (send message, create SOW, validate, etc.)
  }
}
```

#### 3.2 Natural Language Processing Utilities
Create `server/utils/ProcurementNLP.js`:

**Features:**
- Intent recognition (equipment purchase, work order, service order)
- Entity extraction (value, timeline, compliance requirements, items)
- Context management (maintain conversation context)
- Confidence scoring
- Fallback handling

**Supported Intents:**
- `procurement_type` (equipment, work, service)
- `estimated_value` (numeric extraction)
- `timeline` (days, weeks, months)
- `compliance_requirements` (ISO, OSHA, etc.)
- `items_description` (free text extraction)
- `project_association` (project name)
- `supplier_preference` (preferred, competitive, specific)

#### 3.3 Complexity Assessment Engine
Create `server/services/ComplexityAssessmentService.js`:

**Algorithm:**
```javascript
async assessComplexity(extractedData) {
  let score = 0;
  let factors = [];

  // Value-based scoring
  if (extractedData.estimated_value >= 1000000) {
    score += 3; factors.push('High value');
  } else if (extractedData.estimated_value >= 250000) {
    score += 2; factors.push('Medium value');
  } else if (extractedData.estimated_value >= 25000) {
    score += 1; factors.push('Low value');
  }

  // Compliance requirements
  if (extractedData.compliance_requirements?.length > 2) {
    score += 2; factors.push('Multiple compliance requirements');
  }

  // Timeline urgency
  if (extractedData.timeline_days <= 30) {
    score += 1; factors.push('Urgent timeline');
  }

  // Item complexity
  if (extractedData.items?.includes('industrial') || 
      extractedData.items?.includes('custom')) {
    score += 1; factors.push('Specialized equipment');
  }

  // Determine complexity level
  let level, appendices;
  if (score >= 5) {
    level = 'complex';
    appendices = ['A', 'B', 'C', 'D', 'E', 'F'];
  } else if (score >= 3) {
    level = 'medium';
    appendices = ['A', 'B', 'C', 'D'];
  } else {
    level = 'simple';
    appendices = ['A', 'B'];
  }

  return {
    level,
    score,
    factors,
    appendices,
    recommendedAgents: this.getRecommendedAgents(level, appendices)
  };
}
```

#### 3.4 Template Matching Service
Create `server/services/TemplateMatchingService.js`:

**Features:**
- Match extracted data to available templates
- Filter templates by procurement type
- Score templates by relevance
- Return top 3 recommendations
- Provide reasoning for each recommendation

**Matching Logic:**
```javascript
async matchTemplate(extractedData, complexity) {
  const templates = await this.getAvailableTemplates();
  
  const scoredTemplates = templates.map(template => {
    let score = 0;
    const reasons = [];

    // Type matching
    if (template.procurement_type === extractedData.procurement_type) {
      score += 3; reasons.push('Exact type match');
    }

    // Value range matching
    if (template.value_min <= extractedData.estimated_value && 
        template.value_max >= extractedData.estimated_value) {
      score += 2; reasons.push('Value range match');
    }

    // Complexity matching
    if (template.complexity_level === complexity.level) {
      score += 2; reasons.push('Complexity match');
    }

    // Compliance matching
    if (extractedData.compliance_requirements?.some(req => 
        template.compliance_requirements.includes(req))) {
      score += 1; reasons.push('Compliance overlap');
    }

    return { template, score, reasons };
  });

  return scoredTemplates
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
```

---

### Phase 4: Backend API Integration (Week 4-6)

#### 4.1 API Routes Implementation
Create `server/routes/procurement-agent-routes.js`:

```javascript
const express = require('express');
const router = express.Router();
const ProcurementInputAgent = require('../agents/ProcurementInputAgent');
const ProcurementAgentService = require('../services/ProcurementAgentService');

// Start new session
router.post('/start-session', async (req, res) => {
  try {
    const { userId, orderType } = req.body;
    const service = new ProcurementAgentService();
    const session = await service.startSession(userId, orderType);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process user message
router.post('/send-message', async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    const service = new ProcurementAgentService();
    const response = await service.processMessage(sessionId, message);
    
    // Stream response for real-time display
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify(response));
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Extract structured data
router.post('/extract-data', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const service = new ProcurementAgentService();
    const data = await service.extractStructuredData(sessionId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validate extracted data
router.post('/validate', async (req, res) => {
  try {
    const { sessionId, extractedData } = req.body;
    const service = new ProcurementAgentService();
    const validation = await service.validateData(sessionId, extractedData);
    res.json(validation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Handoff to SOW generation
router.post('/handoff-sow', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const service = new ProcurementAgentService();
    const sowData = await service.prepareSOWData(sessionId);
    res.json(sowData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

#### 4.2 ProcurementAgentService
Create `server/services/ProcurementAgentService.js`:

**Main Methods:**
```javascript
class ProcurementAgentService {
  async startSession(userId, orderType) {
    // Create new conversation session
    // Store in database
    // Return initial prompt and session ID
  }

  async processMessage(sessionId, message) {
    // Load conversation state
    // Process through agent
    // Store message and extracted data
    // Return response
  }

  async extractStructuredData(sessionId) {
    // Load conversation
    // Extract all data points
    // Calculate confidence scores
    // Identify missing information
  }

  async validateData(sessionId, data) {
    // Validate against procurement schema
    // Check required fields
    // Identify warnings
    // Return validation results
  }

  async prepareSOWData(sessionId) {
    // Extract structured data
    // Assess complexity
    // Match template
    // Transform to SOW format
    // Return ready-to-use data for ScopeOfWorkModal
  }

  async endSession(sessionId, status) {
    // Mark session as completed/abandoned
    // Store final state
    // Return session summary
  }
}
```

#### 4.3 Database Integration Layer
Create `server/database/ProcurementAgentDB.js`:

**Methods:**
```javascript
class ProcurementAgentDB {
  async createConversation(userId, orderType) {
    const { data, error } = await supabase
      .from('procurement_agent_conversations')
      .insert({
        user_id: userId,
        session_id: uuidv4(),
        messages: [],
        extracted_data: {},
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async storeMessage(sessionId, role, message, extractedData) {
    const { error } = await supabase
      .from('procurement_agent_conversations')
      .update({
        messages: supabase.sql`array_append(messages, ${JSON.stringify({ role, message, timestamp: new Date().toISOString() })})`,
        extracted_data: extractedData,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);
    
    if (error) throw error;
  }

  async getSession(sessionId) {
    const { data, error } = await supabase
      .from('procurement_agent_conversations')
      .select()
      .eq('session_id', sessionId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateSessionStatus(sessionId, status) {
    const { error } = await supabase
      .from('procurement_agent_conversations')
      .update({ 
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null
      })
      .eq('session_id', sessionId);
    
    if (error) throw error;
  }
}
```

---

### Phase 5: Frontend-Backend Integration (Week 5-7)

#### 5.1 Real-time Communication
Implement WebSocket or Server-Sent Events for streaming:

**WebSocket Setup:**
```javascript
// server/websocket/ProcurementAgentWS.js
const WebSocket = require('ws');

class ProcurementAgentWS {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map();
    
    this.wss.on('connection', (ws, req) => {
      const sessionId = req.url.split('/')[2];
      this.clients.set(sessionId, ws);
      
      ws.on('message', async (message) => {
        await this.handleMessage(sessionId, message);
      });
      
      ws.on('close', () => {
        this.clients.delete(sessionId);
      });
    });
  }

  async handleMessage(sessionId, message) {
    const service = new ProcurementAgentService();
    const response = await service.processMessage(sessionId, message.toString());
    
    const client = this.clients.get(sessionId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(response));
    }
  }

  sendToClient(sessionId, data) {
    const client = this.clients.get(sessionId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  }
}
```

#### 5.2 React Hook for Agent Communication
Create `client/src/hooks/useProcurementAgent.js`:

```javascript
import { useState, useEffect, useRef } from 'react';

export const useProcurementAgent = (sessionId) => {
  const [messages, setMessages] = useState([]);
  const [extractedData, setExtractedData] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionState, setSessionState] = useState('idle');
  const wsRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;
    
    // Connect to WebSocket
    wsRef.current = new WebSocket(`ws://localhost:3000/ws/procurement-agent/${sessionId}`);
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.agentMessage) {
        setMessages(prev => [...prev, { role: 'agent', content: data.agentMessage }]);
      }
      
      if (data.extractedData) {
        setExtractedData(data.extractedData);
      }
      
      if (data.nextActions) {
        setSessionState(data.stage);
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [sessionId]);

  const sendMessage = async (message) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setIsProcessing(true);
    
    wsRef.current.send(message);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsProcessing(false);
  };

  const extractData = async () => {
    const response = await fetch('/api/procurement/agent/extract-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    
    const data = await response.json();
    setExtractedData(data);
    return data;
  };

  const validateData = async () => {
    const response = await fetch('/api/procurement/agent/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, extractedData })
    });
    
    return await response.json();
  };

  const handoffToSOW = async () => {
    const response = await fetch('/api/procurement/agent/handoff-sow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    
    return await response.json();
  };

  return {
    messages,
    extractedData,
    isProcessing,
    sessionState,
    sendMessage,
    extractData,
    validateData,
    handoffToSOW
  };
};
```

#### 5.3 Integration with ScopeOfWorkModal
Modify `client/src/pages/01900-procurement/components/modals/01900-ScopeOfWorkModal.js`:

**Add Agent Mode:**
```javascript
const [agentMode, setAgentMode] = useState(false);
const [prefilledData, setPrefilledData] = useState(null);

// New method to handle agent handoff
const handleAgentHandoff = (agentData) => {
  setPrefilledData(agentData);
  setAgentMode(true);
  
  // Auto-populate form fields
  setFormData({
    title: agentData.title || agentData.procurement_title || '',
    description: agentData.description || agentData.requirements_description || '',
    scope_type: agentData.procurement_type || 'purchase_order',
    priority: agentData.priority || 'medium',
    target_completion_date: agentData.timeline_date || '',
    project_id: agentData.project_id || '',
    assigned_to: agentData.assigned_to || '',
    // ... other fields
  });
  
  // Set complex apppendices based on complexity
  if (agentData.appendices) {
    // These will be used in the review step
  }
};

// Modified render to show agent preview
if (agentMode && prefilledData) {
  return (
    <CustomModal ...>
      <AgentDataPreview 
        data={prefilledData}
        onEdit={() => setAgentMode(false)}
        onProceed={() => {
          // Proceed with SOW generation
          setActiveStep('review');
        }}
      />
    </CustomModal>
  );
}
```

---

### Phase 6: Testing & Validation (Week 7-8)

#### 6.1 Test Scenarios
Create comprehensive test scenarios:

**Scenario 1: Simple Equipment Purchase**
```
User: "Need to buy office chairs for new office"
Agent: [Extracts: equipment, value ~R20k, 30 chairs, standard specs]
Result: Simple complexity, Appendices A-B
```

**Scenario 2: Medium Complexity Work Order**
```
User: "We need HVAC installation for our 5-story building"
Agent: [Extracts: work order, value ~R150k, 90 days, compliance required]
Result: Medium complexity, Appendices A-D
```

**Scenario 3: Complex Capital Project**
```
User: "Industrial boiler system for factory expansion, R2.5M, needs OSHA, ISO, electrical certs, 6 months timeline, multiple deliverables"
Agent: [Extracts: equipment, high value, complex requirements]
Result: Complex, Appendices A-F + optional Gantt chart
```

#### 6.2 Unit Tests
Create `server/tests/ProcurementInputAgent.test.js`:
```javascript
describe('ProcurementInputAgent', () => {
  test('extracts procurement type correctly', async () => {
    const agent = new ProcurementInputAgent('test-session', 'user123');
    const result = await agent.processUserMessage(
      'We need to purchase industrial compressors'
    );
    expect(result.extractedData.procurement_type).toBe('equipment_purchase');
  });

  test('assesses complexity correctly', async () => {
    const service = new ComplexityAssessmentService();
    const result = await service.assessComplexity({
      estimated_value: 1000000,
      compliance_requirements: ['ISO', 'OSHA', 'Electrical'],
      timeline_days: 60
    });
    expect(result.level).toBe('complex');
    expect(result.appendices).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
  });
});
```

#### 6.3 Integration Tests
Test end-to-end flow:
1. Start session → Receive initial prompt
2. Send messages through conversation stages
3. Extract structured data
4. Validate data
5. Handoff to SOW generation
6. Verify SOW creation

#### 6.4 User Acceptance Testing
Create test scripts for:
- Real procurement officers
- Different procurement types
- Various complexity levels
- Error scenarios and recovery

---

### Phase 7: Deployment & Monitoring (Week 8)

#### 7.1 Production Deployment Checklist
- [ ] Database migrations applied
- [ ] API routes deployed and tested
- [ ] WebSocket service configured
- [ ] Frontend components built and bundled
- [ ] Environment variables configured
- [ ] Security review completed
- [ ] Performance baseline established

#### 7.2 Monitoring & Analytics
Implement monitoring for:
- Conversation success rate
- Data extraction accuracy
- User satisfaction scores
- Performance metrics (response time, accuracy)
- Error rates and types

#### 7.3 Documentation
- [ ] User guide for agent interface
- [ ] Technical documentation for developers
- [ ] API documentation
- [ ] Deployment guide
- [ ] Troubleshooting guide

---

## Success Metrics

### Quantitative
- **User Adoption**: 80% of procurement orders initiated via agent within 3 months
- **Data Quality**: 95% extraction accuracy (vs 80% manual entry accuracy)
- **Time Savings**: 40% reduction in SOW creation time
- **Error Reduction**: 60% fewer data entry errors
- **User Satisfaction**: >4.5/5 rating

### Qualitative
- Users find agent interface intuitive
- Natural conversation flow
- Reduced cognitive load for procurement officers
- Better requirement capture
- Improved compliance awareness

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| NLP extraction errors | Medium | High | Confidence scoring, manual review, clear error messages |
| User resistance to new interface | Medium | Medium | Gradual rollout, training, optional manual mode |
| Performance degradation | Low | High | Caching, optimization, load testing |
| Integration complexity | Medium | High | Modular development, extensive testing |
| Data privacy concerns | Low | Medium | Clear data handling policy, user consent, audit trails |

---

## Resources Required

### Development Team
- 1 Full-stack developer (6-8 weeks)
- 1 Backend/API specialist (4 weeks)
- 1 Frontend/UI specialist (4 weeks)
- 1 QA engineer (2 weeks)

### Infrastructure
- Additional Supabase compute for agent conversations
- WebSocket server (if not already available)
- Monitoring tools (if not already available)

### Budget Estimate
- Development: $25,000 - $35,000
- Infrastructure: $2,000 - $3,000 (6 months)
- Testing: $3,000 - $5,000
- **Total**: $30,000 - $43,000

---

## Next Steps

### Immediate (This Week)
1. **Approval**: Get stakeholder approval for Option 1 implementation
2. **Team**: Assign developer(s) to project
3. **Setup**: Create project structure and development environment
4. **Design**: Finalize conversation flows and UI wireframes

### Week 1-2
1. Database schema updates
2. API endpoint creation
3. Basic agent infrastructure
4. Initial frontend components

### Week 3-5
1. Agent intelligence implementation
2. NLP integration
3. Frontend-backend integration
4. Testing and refinement

### Week 6-8
1. User acceptance testing
2. Deployment preparation
3. Documentation
4. Production deployment

---

## Conclusion

Implementing Option 1 (Full Agent-Based Input Collection) will transform the procurement user experience from manual form-filling to intelligent conversation. This aligns the input collection with the sophisticated agent processing already in place, creating a complete end-to-end intelligent procurement system.

The phased approach ensures manageable development, thorough testing, and successful deployment. The estimated 6-8 week timeline is achievable with dedicated resources and will deliver significant value in terms of user experience, data quality, and operational efficiency.

**Recommendation**: Proceed with Option 1 implementation with high priority.

---
**Status**: Ready for implementation
**Next Action**: Secure approval and allocate resources