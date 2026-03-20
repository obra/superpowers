# Agent Integration Developer UI Specification

## Overview

This document outlines a comprehensive developer dashboard for managing agent integrations across multiple platforms (LangChain, Flowise, n8n, etc.). The UI will provide an intuitive interface for configuration, testing, monitoring, and debugging of agent integrations.

## UI Architecture

### **Access & Security**
**URL**: `http://localhost:3002/dev-dashboard` (Development)  
**Production**: `https://app.company.com/admin/agents` (Admin-only access)  
**Authentication**: Developer/Admin role required  
**Security**: Environment-based access control

---

## Dashboard Sections

### **1. Agent Overview Dashboard**

#### **Main Dashboard View**
```
┌─────────────────────────────────────────────────────────────────┐
│ 🤖 Agent Integration Dashboard                    [🔄 Refresh] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│ │ Contract Review │  │ Correspondence  │  │ Document Upload │   │
│ │ 🟢 LangChain    │  │ 🟡 n8n         │  │ 🟢 Native      │   │
│ │ 2.3s avg       │  │ 1.8s avg       │  │ 0.9s avg       │   │
│ │ 98% success     │  │ 94% success     │  │ 100% success    │   │
│ └─────────────────┘  └─────────────────┘  └─────────────────┘   │
│                                                                 │
│ ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│ │ Workspace Mgmt  │  │ [+ Add Agent]   │  │ System Health   │   │
│ │ 🟢 LangChain    │  │                 │  │ 🟢 All Systems  │   │
│ │ 1.2s avg       │  │                 │  │ 🔄 Auto-refresh │   │
│ │ 97% success     │  │                 │  │                 │   │
│ └─────────────────┘  └─────────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

#### **Status Indicators**
- 🟢 **Green**: Healthy (>95% success rate)
- 🟡 **Yellow**: Warning (90-95% success rate)  
- 🔴 **Red**: Critical (<90% success rate)
- ⚫ **Gray**: Offline/Disabled

---

### **2. Agent Configuration Panel**

#### **Individual Agent Configuration**
```
┌─────────────────────────────────────────────────────────────────┐
│ ⚙️ Contract Review Agent Configuration                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Agent Type: [contract-review        ▼] Modal Trigger: [Minutes  │
│                                        Compilation Modal ▼]    │
│                                                                 │
│ ┌─── Primary Platform ─────────────────────────────────────────┐ │
│ │ Platform: [LangChain ▼]              Status: 🟢 Active      │ │
│ │ Endpoint: /api/agents/langchain/contract-review              │ │
│ │ Model:    [gpt-4 ▼]                 Temperature: [0.3    ]  │ │
│ │ Max Tokens: [2000    ]               Timeout: [30s ▼]       │ │
│ │                                                             │ │
│ │ System Prompt:                                              │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ You are a contract review specialist with expertise in  │ │ │
│ │ │ analyzing legal documents, compliance requirements,     │ │ │
│ │ │ and generating meeting minutes...                       │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─── Fallback Platforms ───────────────────────────────────────┐ │
│ │ 1. Flowise   │ Flow ID: contract-review-v2    🟢 Available  │ │
│ │ 2. n8n       │ Workflow: contract-agent-v1    🟡 Slow      │ │
│ │ [+ Add Fallback]                                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [🧪 Test Configuration] [💾 Save] [🔄 Reset] [📋 Export JSON]  │
└─────────────────────────────────────────────────────────────────┘
```

#### **Platform Selection Dropdown**
```
┌─── Select Platform ──────────┐
│ ✅ LangChain                 │
│    • Native integration     │
│    • High performance       │
│    • Full feature support   │
├─────────────────────────────├
│ ⚙️ Flowise                  │
│    • Visual workflow        │
│    • Easy configuration     │
│    • Good for complex flows │
├─────────────────────────────├
│ 🔗 n8n                      │
│    • Automation platform    │
│    • External webhooks      │
│    • Great for integrations │
├─────────────────────────────├
│ 🔌 Custom API               │
│    • External service       │
│    • Custom implementation  │
│    • Full control          │
└─────────────────────────────┘
```

---

### **3. Testing Interface**

#### **Live Agent Testing**
```
┌─────────────────────────────────────────────────────────────────┐
│ 🧪 Agent Testing Console                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Test Agent: [Contract Review ▼]  Platform: [LangChain ▼]       │
│                                                                 │
│ ┌─── Test Configuration ─────────────────────────────────────── │
│ │ User ID: [demo-user-001]    Page ID: [00435-contracts]       │ │
│ │ Modal Context: [MinutesCompileModal]  Environment: [Dev ▼]   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─── Test Message ──────────────────────────────────────────── │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ Help me compile meeting minutes from today's contract   │ │ │
│ │ │ review session. Focus on action items and decisions.   │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │ [🚀 Send Test Message]    [📝 Load Template] [🗑️ Clear]     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─── Response ──────────────────────────────────────────────── │
│ │ Status: ✅ Success (1.2s)   Platform: LangChain             │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ I'll help you compile meeting minutes. Based on your   │ │ │
│ │ │ request, I'll create a structured format focusing on   │ │ │
│ │ │ action items and key decisions...                      │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │ Sources: 3 documents | Tokens: 847 | Cost: $0.02           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [🔄 Test All Platforms] [📊 Performance Comparison] [📋 Export] │
└─────────────────────────────────────────────────────────────────┘
```

#### **A/B Testing Interface**
```
┌─── Platform Comparison ──────────────────────────────────────────┐
│ Test Message: "Help with contract compliance check"              │
├──────────────────┬──────────────────┬──────────────────────────┤
│ LangChain        │ Flowise          │ n8n                      │
│ ✅ 1.2s          │ ✅ 2.1s          │ ⚠️ 4.3s                  │
│ GPT-4 Response   │ Custom Flow      │ Webhook Response         │
│ Quality: 9.2/10  │ Quality: 8.7/10  │ Quality: 7.8/10          │
│ Cost: $0.02      │ Cost: $0.01      │ Cost: $0.00              │
├──────────────────┼──────────────────┼──────────────────────────┤
│ [Select Primary] │ [Select Primary] │ [Select Primary]         │
└──────────────────┴──────────────────┴──────────────────────────┘
```

---

### **4. Monitoring Dashboard**

#### **Performance Analytics**
```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 Agent Performance Analytics                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Time Range: [Last 7 Days ▼]           [📅 Custom Range]        │
│                                                                 │
│ ┌─── Response Time Trends ──────────────────────────────────── │
│ │     │                                                       │ │
│ │ 3s  │    ╭─╮                                               │ │
│ │     │   ╱   ╲     n8n                                      │ │
│ │ 2s  │  ╱     ╲   ╱╲                                        │ │
│ │     │ ╱       ╲ ╱  ╲                                       │ │
│ │ 1s  │╱         ╲╱   ╲╱─╲  LangChain                        │ │
│ │     │           ╲     ╱─╱─╱─╱                              │ │
│ │ 0s  │─────────────────────────                             │ │
│ │     Mon  Tue  Wed  Thu  Fri  Sat  Sun                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─── Success Rate (7 days) ────────────────────────────────── │  
│ │ LangChain:    ████████████████████▓ 98.2%                 │ │
│ │ Flowise:      ██████████████████▒▒▒ 94.1%                 │ │
│ │ n8n:          ████████████████▒▒▒▒▒ 89.7%                 │ │
│ │ Native:       ████████████████████▓ 99.8%                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### **Live System Status**
```
┌─── System Health Monitor ───────────────────────────────────────┐
│ Last Updated: 2025-08-07 10:39:59                               │
├─────────────────────────────────────────────────────────────────┤
│ 🟢 LangChain API        │ Healthy    │ 1.2s avg │ 156 req/min   │
│ 🟡 Flowise Instance     │ Degraded   │ 3.1s avg │  89 req/min   │
│ 🟢 n8n Webhooks         │ Healthy    │ 0.8s avg │  23 req/min   │
│ 🟢 Database             │ Healthy    │ 0.1s avg │ 342 req/min   │
│ 🟢 Redis Cache          │ Healthy    │ 0.02s avg│ 1.2k req/min  │
├─────────────────────────────────────────────────────────────────┤
│ 🔥 Recent Errors:                                              │
│ • 10:35 - Flowise timeout on correspondence agent              │
│ • 10:22 - n8n webhook 429 rate limit exceeded                  │
│ • 09:58 - LangChain token limit warning                        │
└─────────────────────────────────────────────────────────────────┘
```

---

### **5. Configuration Management**

#### **Environment Configuration**
```
┌─────────────────────────────────────────────────────────────────┐
│ 🌍 Environment Configuration                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Current Environment: [Development ▼]                           │
│                                                                 │
│ ┌─── Development Settings ────────────────────────────────────┐  │
│ │                                                             │ │
│ │ LangChain:                                                  │ │
│ │ • Base URL: http://localhost:8000                           │ │
│ │ • API Key: sk-dev-xxxxx••••••••[🔑 Update]                │ │
│ │ • Default Model: gpt-3.5-turbo                              │ │
│ │ • Debug Logging: ✅ Enabled                                 │ │
│ │                                                             │ │
│ │ Flowise:                                                    │ │
│ │ • Instance URL: http://localhost:3000                       │ │
│ │ • API Key: flowise-dev-••••••••[🔑 Update]                 │ │
│ │ • Default Timeout: 30s                                      │ │
│ │                                                             │ │
│ │ n8n:                                                        │ │
│ │ • Webhook Base: http://localhost:5678                       │ │
│ │ • Auth Token: n8n-token-••••••••[🔑 Update]                │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [🔒 Production Settings] [🧪 Staging Settings] [💾 Save All]    │
└─────────────────────────────────────────────────────────────────┘
```

#### **Agent Templates Library**
```
┌─── Agent Templates ─────────────────────────────────────────────┐
│                                                                 │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐     │
│ │📋 Contract      │ │✉️ Correspondence│ │📊 Data Analysis│     │
│ │   Review        │ │   Assistant     │ │   Agent        │     │
│ │                 │ │                 │ │                │     │
│ │ • LangChain     │ │ • n8n Workflow  │ │ • Python API   │     │
│ │ • Meeting mins  │ │ • Email drafts  │ │ • Analytics    │     │
│ │ • Compliance    │ │ • Tone adjust   │ │ • Reporting    │     │
│ │                 │ │                 │ │                │     │
│ │[📋 Use Template]│ │[📋 Use Template]│ │[📋 Use Template]│     │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘     │
│                                                                 │
│ [+ Create New Template] [📥 Import Template] [🗂️ Browse All]    │
└─────────────────────────────────────────────────────────────────┘
```

---

### **6. Debugging & Logs**

#### **Live Log Viewer**
```
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 Agent Integration Logs                    [🔄 Auto-refresh] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Filter: [All Levels ▼] Agent: [All ▼] Platform: [All ▼]       │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 10:39:45 [INFO ] contract-review/langchain                 │ │
│ │          Request: "Help compile meeting minutes"           │ │
│ │          Response: 1.2s, 847 tokens, Success              │ │
│ │                                                            │ │
│ │ 10:39:12 [WARN ] correspondence/n8n                        │ │
│ │          Webhook timeout (15s), falling back to LangChain │ │
│ │                                                            │ │
│ │ 10:38:45 [ERROR] flowise/general                           │ │
│ │          Flow execution failed: Invalid API response      │ │
│ │          Stack: FlowiseAdapter.sendMessage:42              │ │
│ │                                                            │ │
│ │ 10:38:23 [DEBUG] contract-review/langchain                 │ │
│ │          System prompt: "You are a contract specialist..." │ │
│ │          Context: {pageId: "00435", userId: "demo-001"}    │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [📄 Export Logs] [🔍 Advanced Filters] [⚡ Performance View]   │
└─────────────────────────────────────────────────────────────────┘
```

#### **Request/Response Inspector**
```
┌─── Message Inspector ───────────────────────────────────────────┐
│ Request ID: req-20250807-103945-xyz                             │
├─────────────────────────────────────────────────────────────────┤
│ Agent: contract-review | Platform: langchain | Status: ✅       │
│                                                                 │
│ ┌─── Request ─────────────────────────────────────────────────┐ │
│ │ {                                                           │ │
│ │   "message": "Help me compile meeting minutes",            │ │
│ │   "context": {                                             │ │
│ │     "userId": "demo-user-001",                             │ │
│ │     "pageId": "00435-contracts-post-award",                │ │
│ │     "modalContext": "MinutesCompileModal"                  │ │
│ │   }                                                        │ │
│ │ }                                                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─── Response ────────────────────────────────────────────────┐ │
│ │ {                                                           │ │
│ │   "message": "I'll help you compile meeting minutes...",   │ │
│ │   "sources": [                                             │ │
│ │     {"title": "Contract Review Guidelines", ...}          │ │
│ │   ],                                                       │ │
│ │   "metadata": {                                            │ │
│ │     "model": "gpt-4",                                      │ │
│ │     "tokens": 847,                                         │ │
│ │     "duration": "1.2s"                                     │ │
│ │   }                                                        │ │
│ │ }                                                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### **Frontend Architecture**
**File Location**: `client/src/admin/agent-dashboard/`

```
client/src/admin/agent-dashboard/
├── components/
│   ├── AgentOverview.js          # Main dashboard
│   ├── AgentConfig.js            # Configuration panel
│   ├── TestConsole.js            # Testing interface
│   ├── MonitoringDashboard.js    # Performance analytics
│   ├── LogViewer.js              # Debug logs viewer
│   └── EnvironmentConfig.js      # Environment settings
├── hooks/
│   ├── useAgentStatus.js         # Real-time status
│   ├── useAgentMetrics.js        # Performance data
│   └── useAgentLogs.js           # Log streaming
├── styles/
│   └── agent-dashboard.css       # UI styling
└── AgentDashboard.js             # Root component
```

### **Backend API Routes**
**File Location**: `server/src/routes/admin/agent-dashboard-routes.js`

```javascript
// Agent management endpoints
GET    /api/admin/agents              // List all agents
GET    /api/admin/agents/:id          // Get agent details
PUT    /api/admin/agents/:id          // Update agent config
POST   /api/admin/agents/:id/test     // Test agent
DELETE /api/admin/agents/:id          // Remove agent

// Platform management
GET    /api/admin/platforms           // List available platforms
POST   /api/admin/platforms/test      // Test platform connection

// Configuration management  
GET    /api/admin/config/:env         // Get environment config
PUT    /api/admin/config/:env         // Update environment config

// Monitoring and analytics
GET    /api/admin/metrics             // Get performance metrics
GET    /api/admin/logs                // Get filtered logs
GET    /api/admin/health              // System health check
```

### **WebSocket Integration**
```javascript
// Real-time updates for dashboard
const useRealtimeUpdates = () => {
  useEffect(() => {
    const socket = io('/admin-dashboard');
    
    socket.on('agent:status_change', (data) => {
      updateAgentStatus(data);
    });
    
    socket.on('agent:new_log', (logEntry) => {
      addLogEntry(logEntry);
    });
    
    return () => socket.disconnect();
  }, []);
};
```

---

## Access & Security

### **Developer Authentication**
```javascript
// Middleware for admin access
const requireDeveloperAccess = (req, res, next) => {
  const userRole = req.user?.role;
  const allowedRoles = ['admin', 'developer', 'system_admin'];
  
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({
      error: 'Developer access required'
    });
  }
  
  next();
};
```

### **Environment-Based Access Control**
```javascript
// Development: Full access
// Staging: Read-only + limited testing
// Production: Admin-only with approval workflow

const getAccessLevel = (environment, userRole) => {
  const accessMatrix = {
    development: {
      admin: 'full',
      developer: 'full', 
      user: 'none'
    },
    staging: {
      admin: 'full',
      developer: 'read_test',
      user: 'none'  
    },
    production: {
      admin: 'full_with_approval',
      developer: 'read_only',
      user: 'none'
    }
  };
  
  return accessMatrix[environment]?.[userRole] || 'none';
};
```

---

## Benefits of Developer UI

### **1. Easy Configuration Management**
- Visual interface for agent setup
- Environment-specific configurations
- Template library for quick deployment
- Import/export configurations

### **2. Comprehensive Testing**
- Live agent testing console
- A/B platform comparison
- Performance benchmarking
- Message template testing

### **3. Real-time Monitoring**
- System health dashboard
- Performance analytics
- Error tracking and alerting
- Usage metrics and costs

### **4. Debugging Tools**
- Live log streaming
- Request/response inspection
- Error stack traces
- Performance profiling

### **5. Developer Productivity**
- No manual configuration files
- Visual platform switching
- Instant testing and validation
- Centralized management

---

## Implementation Priority

### **Phase 1: Core Dashboard** (Immediate)
- Agent overview with status indicators
- Basic configuration panel
- Simple testing console
- Environment configuration

### **Phase 2: Advanced Features** (Short Term)  
- Performance monitoring dashboard
- A/B testing interface
- Log viewer with filtering
- Real-time updates

### **Phase 3: Enterprise Features** (Long Term)
- Advanced analytics and reporting  
- Cost tracking and optimization
- Automated testing and deployment
- Role-based access controls

---

## Conclusion

This developer UI will dramatically simplify the management of multi-platform agent integrations. Developers will be able to:

- **Configure agents visually** instead of editing JSON files
- **Test integrations instantly** without writing test scripts
- **Monitor performance in real-time** with comprehensive dashboards
- **Debug issues efficiently** with detailed logs and inspection tools
- **Switch platforms easily** with confidence through A/B testing

The UI bridges the gap between complex multi-platform architecture and developer productivity, making agent integration management accessible and efficient.
