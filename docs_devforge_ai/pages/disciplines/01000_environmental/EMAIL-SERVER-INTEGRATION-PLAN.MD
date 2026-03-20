# Email Server Integration Plan - n8n Implementation

## Overview
This document outlines a comprehensive plan for integrating the email UI system with email servers using n8n as the middleware layer. The approach prioritizes seamless user experience, quick implementation, and robust functionality.

## Architecture Overview

### High-Level Architecture
```
Email Providers (Gmail, Outlook, IMAP/SMTP) 
    ↓
n8n Workflow Engine (Middleware)
    ↓
Application API (Node.js/Express)
    ↓
Email UI System (React Components)
```

### Integration Flow
1. **Email Providers** → n8n workflows for email operations
2. **n8n** → Application API endpoints for data exchange
3. **Application API** → Email UI components for user interaction
4. **Real-time updates** via WebSocket connections

## Phase 1: Quick Implementation (1-2 weeks)

### 1.1 n8n Setup and Configuration

#### n8n Installation Options
```bash
# Option 1: Docker (Recommended for quick setup)
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Option 2: npm installation
npm install n8n -g
n8n start
```

#### Environment Configuration
```env
# n8n Configuration
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your_secure_password
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=https
N8N_WEBHOOK_URL=https://your-domain.com/webhook/

# Email Provider Credentials
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
OUTLOOK_CLIENT_ID=your_outlook_client_id
OUTLOOK_CLIENT_SECRET=your_outlook_client_secret
IMAP_HOST=your_imap_host
IMAP_PORT=993
SMTP_HOST=your_smtp_host
SMTP_PORT=587
```

### 1.2 Core n8n Workflows

#### Workflow 1: Email Fetching and Synchronization
```json
{
  "name": "Email Sync Workflow",
  "nodes": [
    {
      "name": "Email Trigger",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "rule": {
          "interval": [{"field": "minute", "value": 5}]
        }
      }
    },
    {
      "name": "Gmail Fetch",
      "type": "n8n-nodes-base.gmail",
      "parameters": {
        "operation": "getAll",
        "returnAll": false,
        "limit": 50,
        "filters": {
          "labelIds": ["INBOX"],
          "q": "is:unread"
        }
      }
    },
    {
      "name": "Process Emails",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "// Process and normalize email data\nconst processedEmails = items.map(item => ({\n  id: item.json.id,\n  threadId: item.json.threadId,\n  subject: item.json.payload.headers.find(h => h.name === 'Subject')?.value,\n  sender: item.json.payload.headers.find(h => h.name === 'From')?.value,\n  recipient: item.json.payload.headers.find(h => h.name === 'To')?.value,\n  sentDate: new Date(parseInt(item.json.internalDate)),\n  snippet: item.json.snippet,\n  isRead: !item.json.labelIds.includes('UNREAD'),\n  hasAttachments: item.json.payload.parts?.some(part => part.filename) || false,\n  body: extractEmailBody(item.json.payload),\n  attachments: extractAttachments(item.json.payload)\n}));\n\nreturn processedEmails.map(email => ({json: email}));"
      }
    },
    {
      "name": "Store in Database",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "insert",
        "table": "emails",
        "columns": "id,thread_id,subject,sender,recipient,sent_date,snippet,is_read,has_attachments,body_content,metadata",
        "onConflict": "DO UPDATE SET"
      }
    },
    {
      "name": "Notify Application",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "httpMethod": "POST",
        "path": "email-sync-complete",
        "responseMode": "onReceived"
      }
    }
  ]
}
```

#### Workflow 2: Email Sending
```json
{
  "name": "Email Send Workflow",
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "httpMethod": "POST",
        "path": "send-email"
      }
    },
    {
      "name": "Validate Email Data",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "// Validate required fields\nconst emailData = items[0].json;\nif (!emailData.to || !emailData.subject || !emailData.body) {\n  throw new Error('Missing required email fields');\n}\nreturn items;"
      }
    },
    {
      "name": "Send via Gmail",
      "type": "n8n-nodes-base.gmail",
      "parameters": {
        "operation": "send",
        "toList": "={{$json.to}}",
        "subject": "={{$json.subject}}",
        "message": "={{$json.body}}",
        "ccList": "={{$json.cc}}",
        "bccList": "={{$json.bcc}}"
      }
    },
    {
      "name": "Log Sent Email",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "insert",
        "table": "sent_emails",
        "columns": "message_id,to_address,subject,sent_date,status"
      }
    },
    {
      "name": "Return Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "responseBody": "={{JSON.stringify({success: true, messageId: $json.id})}}"
      }
    }
  ]
}
```

### 1.3 Application API Integration

#### Email Service Layer
```javascript
// server/services/emailService.js
class EmailService {
  constructor() {
    this.n8nBaseUrl = process.env.N8N_WEBHOOK_URL;
    this.webhookAuth = process.env.N8N_WEBHOOK_AUTH;
  }

  async sendEmail(emailData) {
    try {
      const response = await fetch(`${this.n8nBaseUrl}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.webhookAuth}`
        },
        body: JSON.stringify(emailData)
      });
      
      return await response.json();
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  async fetchEmails(userId, filters = {}) {
    try {
      // Trigger n8n email sync workflow
      await fetch(`${this.n8nBaseUrl}/trigger-email-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.webhookAuth}`
        },
        body: JSON.stringify({ userId, filters })
      });

      // Fetch from local database
      const emails = await this.getEmailsFromDatabase(userId, filters);
      return emails;
    } catch (error) {
      console.error('Email fetching failed:', error);
      throw new Error('Failed to fetch emails');
    }
  }

  async markAsRead(emailIds) {
    try {
      const response = await fetch(`${this.n8nBaseUrl}/mark-emails-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.webhookAuth}`
        },
        body: JSON.stringify({ emailIds })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Mark as read failed:', error);
      throw new Error('Failed to mark emails as read');
    }
  }
}

module.exports = new EmailService();
```

#### API Routes
```javascript
// server/routes/email-routes.js
const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const { authenticateUser } = require('../middleware/auth');

// Get emails
router.get('/emails', authenticateUser, async (req, res) => {
  try {
    const { tab, search, status, limit = 50, offset = 0 } = req.query;
    const emails = await emailService.fetchEmails(req.user.id, {
      tab, search, status, limit, offset
    });
    res.json({ success: true, emails });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send email
router.post('/emails/send', authenticateUser, async (req, res) => {
  try {
    const emailData = {
      ...req.body,
      userId: req.user.id,
      userEmail: req.user.email
    };
    const result = await emailService.sendEmail(emailData);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark emails as read
router.patch('/emails/mark-read', authenticateUser, async (req, res) => {
  try {
    const { emailIds } = req.body;
    await emailService.markAsRead(emailIds);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

### 1.4 Frontend Integration Updates

#### Email Service Client
```javascript
// client/src/services/emailService.js
class EmailService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || '/api';
  }

  async fetchEmails(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(`${this.baseUrl}/emails?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch emails');
      return await response.json();
    } catch (error) {
      console.error('Email fetch error:', error);
      throw error;
    }
  }

  async sendEmail(emailData) {
    try {
      const response = await fetch(`${this.baseUrl}/emails/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(emailData)
      });
      
      if (!response.ok) throw new Error('Failed to send email');
      return await response.json();
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  }

  async markAsRead(emailIds) {
    try {
      const response = await fetch(`${this.baseUrl}/emails/mark-read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ emailIds })
      });
      
      if (!response.ok) throw new Error('Failed to mark as read');
      return await response.json();
    } catch (error) {
      console.error('Mark as read error:', error);
      throw error;
    }
  }
}

export default new EmailService();
```

## Phase 2: Enhanced Features (2-3 weeks)

### 2.1 Real-time Email Synchronization

#### WebSocket Integration
```javascript
// server/websocket/emailSocket.js
const WebSocket = require('ws');

class EmailWebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map();
    
    this.wss.on('connection', (ws, req) => {
      const userId = this.extractUserId(req);
      this.clients.set(userId, ws);
      
      ws.on('close', () => {
        this.clients.delete(userId);
      });
    });
  }

  notifyEmailUpdate(userId, emailData) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'email_update',
        data: emailData
      }));
    }
  }

  notifyNewEmail(userId, email) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'new_email',
        data: email
      }));
    }
  }
}

module.exports = EmailWebSocketServer;
```

### 2.2 Advanced n8n Workflows

#### AI-Enhanced Email Processing
```json
{
  "name": "AI Email Processing",
  "nodes": [
    {
      "name": "New Email Trigger",
      "type": "n8n-nodes-base.webhook"
    },
    {
      "name": "Extract Email Content",
      "type": "n8n-nodes-base.function"
    },
    {
      "name": "AI Sentiment Analysis",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "operation": "text",
        "prompt": "Analyze the sentiment of this email: {{$json.content}}"
      }
    },
    {
      "name": "AI Priority Detection",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "operation": "text",
        "prompt": "Determine the priority level (high/medium/low) of this email: {{$json.content}}"
      }
    },
    {
      "name": "AI Action Items",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "operation": "text",
        "prompt": "Extract action items from this email: {{$json.content}}"
      }
    },
    {
      "name": "Update Email Metadata",
      "type": "n8n-nodes-base.postgres"
    }
  ]
}
```

### 2.3 Multi-Provider Support

#### Provider Configuration
```javascript
// server/config/emailProviders.js
const emailProviders = {
  gmail: {
    type: 'oauth2',
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    scopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'],
    n8nNodeType: 'n8n-nodes-base.gmail'
  },
  outlook: {
    type: 'oauth2',
    clientId: process.env.OUTLOOK_CLIENT_ID,
    clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
    scopes: ['https://graph.microsoft.com/mail.read', 'https://graph.microsoft.com/mail.send'],
    n8nNodeType: 'n8n-nodes-base.microsoftOutlook'
  },
  imap: {
    type: 'credentials',
    host: process.env.IMAP_HOST,
    port: process.env.IMAP_PORT,
    secure: true,
    n8nNodeType: 'n8n-nodes-base.emailReadImap'
  }
};

module.exports = emailProviders;
```

## Phase 3: Production Optimization (1 week)

### 3.1 Performance Optimization

#### Caching Strategy
```javascript
// server/services/emailCacheService.js
const Redis = require('redis');

class EmailCacheService {
  constructor() {
    this.redis = Redis.createClient({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT
    });
  }

  async cacheEmails(userId, emails) {
    const key = `emails:${userId}`;
    await this.redis.setex(key, 300, JSON.stringify(emails)); // 5 min cache
  }

  async getCachedEmails(userId) {
    const key = `emails:${userId}`;
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async invalidateCache(userId) {
    const key = `emails:${userId}`;
    await this.redis.del(key);
  }
}

module.exports = new EmailCacheService();
```

### 3.2 Error Handling and Monitoring

#### n8n Error Handling Workflow
```json
{
  "name": "Email Error Handler",
  "nodes": [
    {
      "name": "Error Trigger",
      "type": "n8n-nodes-base.errorTrigger"
    },
    {
      "name": "Log Error",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "console.error('Email workflow error:', $json.error);\nreturn items;"
      }
    },
    {
      "name": "Notify Admin",
      "type": "n8n-nodes-base.slack",
      "parameters": {
        "operation": "postMessage",
        "channel": "#email-alerts",
        "text": "Email workflow error: {{$json.error.message}}"
      }
    },
    {
      "name": "Store Error Log",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "insert",
        "table": "error_logs"
      }
    }
  ]
}
```

## Implementation Timeline

### Week 1: Foundation Setup
- [ ] n8n installation and configuration
- [ ] Basic email fetching workflow
- [ ] Email sending workflow
- [ ] Database schema setup
- [ ] API endpoint creation

### Week 2: Core Integration
- [ ] Frontend service integration
- [ ] Email synchronization testing
- [ ] Basic error handling
- [ ] User authentication integration
- [ ] Multi-provider configuration

### Week 3: Enhanced Features
- [ ] Real-time WebSocket integration
- [ ] AI processing workflows
- [ ] Advanced filtering and search
- [ ] Attachment handling
- [ ] Performance optimization

### Week 4: Production Readiness
- [ ] Comprehensive testing
- [ ] Error monitoring setup
- [ ] Security hardening
- [ ] Documentation completion
- [ ] Deployment preparation

## Security Considerations

### 1. Authentication and Authorization
- OAuth2 implementation for email providers
- JWT tokens for API authentication
- Role-based access control
- Secure credential storage in n8n

### 2. Data Protection
- Email content encryption at rest
- Secure transmission (HTTPS/TLS)
- PII data handling compliance
- Regular security audits

### 3. n8n Security
- Basic authentication for n8n interface
- Webhook endpoint security
- Environment variable protection
- Network isolation

## Monitoring and Maintenance

### 1. Health Checks
- n8n workflow monitoring
- Email provider connectivity
- Database performance
- API response times

### 2. Logging
- Comprehensive error logging
- Email processing metrics
- User activity tracking
- Performance monitoring

### 3. Backup and Recovery
- Database backup strategy
- n8n workflow backup
- Configuration backup
- Disaster recovery plan

## Cost Considerations

### Infrastructure Costs
- n8n hosting (self-hosted or cloud)
- Database storage
- Redis caching
- Email provider API costs

### Development Effort
- Initial setup: 20-30 hours
- Testing and refinement: 15-20 hours
- Documentation: 5-10 hours
- Maintenance: 2-4 hours/month

## Success Metrics

### Performance Metrics
- Email sync latency < 30 seconds
- API response time < 500ms
- 99.9% uptime
- Zero data loss

### User Experience Metrics
- Email load time < 2 seconds
- Search response time < 1 second
- 95% user satisfaction
- Minimal support tickets

## Conclusion

This n8n-based email integration plan provides a robust, scalable, and maintainable solution for connecting the email UI system with various email providers. The phased approach ensures quick implementation while allowing for future enhancements and optimizations.

The solution leverages n8n's visual workflow capabilities to create maintainable email processing pipelines, while the application API provides a clean interface for the frontend components. Real-time updates and AI-enhanced features ensure a modern, responsive user experience.
