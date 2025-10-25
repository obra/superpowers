---
name: email-intelligence
description: Use when analyzing email data, detecting leads, tracking communications, or generating business intelligence from email - works with Gmail, Outlook, or any email system via API/MCP
allowed-tools:
  - Bash
  - Read
  - Write
  - MCP
---

# Email Intelligence

Transform your email into a business intelligence system. Answer natural language questions, detect leads, track communications, and generate insights from email data.

**Core principle:** Systematic email analysis with memory, lead scoring, and automated intelligence gathering.

## When to Use

- **Email Search**: "Did the client pick option A or B?"
- **Lead Detection**: Identify and score potential customers
- **Communication Tracking**: Remember client preferences and history
- **Business Intelligence**: Report on unpaid invoices, follow-ups needed, high-priority leads
- **Email Drafting**: Generate responses with context and memory

## Overview

This skill provides a framework for email intelligence regardless of your email provider or business type. It works with:

- **Gmail** (via Gmail API or MCP)
- **Outlook** (via Microsoft Graph API or MCP)
- **IMAP/SMTP** (any email provider)
- **Custom email systems**

## Core Capabilities

### 1. Natural Language Email Search

Answer questions about email content using semantic search:

```
Question: "What date did the client confirm for the meeting?"
Process:
  1. Parse intent (looking for date confirmation)
  2. Search emails with relevant keywords
  3. Extract specific information
  4. Provide answer with source citation
```

**Best Practices:**
- Always cite specific emails as sources
- Include date, sender, and subject
- State confidence level (0-100%)
- Never hallucinate - say "Not found" if unsure

### 2. Lead Detection & Scoring

Identify potential customers and score them systematically:

**Lead Indicators:**
- Keywords: "quote", "pricing", "interested", "budget", "proposal"
- Event mentions: "wedding", "conference", "meeting", "project"
- Action requests: "can you", "would you", "we need"

**Scoring Framework:**

| Factor | Points | Criteria |
|--------|--------|----------|
| Budget mention | 1-3 | Clear budget (3), range (2), vague (1) |
| Urgency | 1-3 | This week (3), this month (2), future (1) |
| Specificity | 1-3 | Detailed (3), moderate (2), vague (1) |
| Decision authority | 1-3 | Final decision (3), influencer (2), researcher (1) |

**Score Total: 12 points**
- **Hot Lead** (9-12): High priority, immediate follow-up
- **Warm Lead** (5-8): Qualified, schedule follow-up
- **Cold Lead** (1-4): Nurture, monitor for engagement

**Output Format:**
```
Lead: [Name]
Email: [Address]
Score: [X/12] - [Hot/Warm/Cold]
Indicators: [What triggered detection]
Context: [Brief summary]
Next Action: [Specific recommendation]
Source: [Email subject, date]
```

### 3. Client Memory & Context

Build persistent knowledge about clients and communications:

**What to Track:**
- Communication history summaries
- Preferences and past decisions
- Follow-up requirements
- Status and stage in pipeline
- Key dates and deadlines

**Memory Storage Options:**
- **Mem0**: Persistent memory with semantic search
- **Local files**: JSON/YAML client profiles
- **Database**: SQLite/PostgreSQL for structured data
- **Vector DB**: ChromaDB/Pinecone for semantic retrieval

**Example Client Profile:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "company": "Acme Corp",
  "preferences": {
    "communication": "email preferred, weekday mornings",
    "past_choices": ["Option B selected", "Monthly billing"]
  },
  "history": [
    {
      "date": "2025-10-15",
      "summary": "Initial inquiry about service",
      "status": "Sent proposal"
    }
  ],
  "lead_score": 8,
  "priority": "warm",
  "next_action": "Follow up on proposal by 2025-10-22"
}
```

### 4. Email Response Drafting

Generate contextual email responses:

**Drafting Process:**
```
1. Retrieve client context from memory
2. Analyze incoming email content
3. Determine intent and required response
4. Draft response with:
   - Appropriate greeting
   - Address all questions/points
   - Include relevant information
   - Clear next steps
   - Professional closing
5. Flag for human review before sending
```

**Tone Guidelines:**
- Professional but warm
- Clear and concise
- Action-oriented
- Appropriate formality for context

### 5. Business Intelligence Queries

Generate reports and insights from email data:

**Common Queries:**

**Unpaid Invoices:**
```
Search: subject:invoice AND (unpaid OR outstanding OR reminder)
Report: List by date, amount, days overdue
Action: Flag for follow-up if >30 days
```

**Follow-Up Needed:**
```
Search: Emails awaiting response >3 days
Report: Prioritize by lead score
Action: Draft follow-up for hot leads
```

**Lead Pipeline:**
```
Search: Recent leads by score (last 30 days)
Report: Hot/Warm/Cold breakdown
Action: Identify bottlenecks
```

**Communication Patterns:**
```
Analysis: Response times, volume trends, common topics
Report: Metrics and insights
Action: Process improvements
```

## Email System Integration

### Gmail (Google Workspace)

**Via Gmail API:**
```python
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

# Authenticate
creds = Credentials.from_authorized_user_file('token.json')
service = build('gmail', 'v1', credentials=creds)

# Search
results = service.users().messages().list(
    userId='me',
    q='from:client@example.com subject:proposal'
).execute()

# Read message
msg = service.users().messages().get(
    userId='me',
    id=message_id
).execute()
```

**Via MCP (Composio/RUBE):**
```
Use RUBE_SEARCH_TOOLS to find Gmail tools
Use GMAIL_SEARCH_PEOPLE for contact search
Use GMAIL_FETCH_EMAILS for message retrieval
```

### Outlook (Microsoft 365)

**Via Microsoft Graph API:**
```python
import requests

# Search emails
endpoint = 'https://graph.microsoft.com/v1.0/me/messages'
params = {
    '$search': '"client proposal"',
    '$select': 'subject,from,receivedDateTime,body'
}
response = requests.get(endpoint, headers=headers, params=params)
```

### IMAP (Generic)

**Via imaplib:**
```python
import imaplib
import email

# Connect
mail = imaplib.IMAP4_SSL('imap.gmail.com')
mail.login('user@example.com', 'password')
mail.select('inbox')

# Search
status, messages = mail.search(None, 'FROM "client@example.com"')

# Fetch
status, msg_data = mail.fetch(message_id, '(RFC822)')
msg = email.message_from_bytes(msg_data[0][1])
```

## Auto-Labeling System

Organize emails automatically with labels/folders:

**Lead Labels:**
- `Lead/Hot` - High-priority leads (score 9-12)
- `Lead/Warm` - Qualified leads (score 5-8)
- `Lead/Cold` - Low-priority leads (score 1-4)

**Status Labels:**
- `Action/Follow_Up` - Requires follow-up
- `Action/Waiting` - Awaiting response
- `Action/Complete` - Resolved

**Financial Labels:**
- `Finance/Invoice_Sent`
- `Finance/Invoice_Paid`
- `Finance/Invoice_Overdue`

**Example (Gmail):**
```python
# Add label
service.users().messages().modify(
    userId='me',
    id=message_id,
    body={'addLabelIds': ['Label_Lead_Hot']}
).execute()
```

## Email Analysis Workflow

### Example: Lead Detection

**User Query:** "Find new leads from this week and score them"

**Process:**
```
1. Search emails from last 7 days
2. For each email:
   a. Check for lead indicators (keywords, patterns)
   b. Calculate lead score
   c. Extract key information
   d. Create client profile
   e. Apply appropriate label
3. Generate summary report
4. Recommend follow-up actions
```

**Output:**
```
Email Intelligence Report - New Leads (Oct 18-25, 2025)

Hot Leads (3):
1. Sarah Johnson <sarah@techcorp.com>
   Score: 10/12
   Subject: "Quote needed for 100 licenses - urgent"
   Context: Clear budget ($50k), decision authority, needs by Nov 1
   Action: Send proposal by EOD today

2. Mike Chen <mike@startup.io>
   Score: 9/12
   Subject: "Demo request for enterprise plan"
   Context: Growing startup, mentioned funding, ready to commit
   Action: Schedule demo this week

Warm Leads (5):
[...]

Total: 8 new leads (3 hot, 5 warm)
Conversion opportunity: ~$125k (hot leads only)
Next actions: 3 immediate follow-ups required
```

## Configuration Setup

Create a configuration file for your business context:

**email-intelligence-config.json:**
```json
{
  "business": {
    "name": "Your Company Name",
    "email": "contact@yourcompany.com",
    "industry": "Your Industry"
  },
  "lead_scoring": {
    "keywords": {
      "high": ["urgent", "asap", "quote", "proposal"],
      "medium": ["interested", "considering", "exploring"],
      "low": ["just looking", "maybe", "someday"]
    },
    "thresholds": {
      "hot": 9,
      "warm": 5,
      "cold": 1
    }
  },
  "auto_labels": {
    "enabled": true,
    "label_prefix": "AI/"
  },
  "memory": {
    "provider": "mem0",
    "retention_days": 365
  }
}
```

## Usage Examples

### Example 1: Answer Specific Question

**Query:** "What pricing did we quote to Acme Corp last month?"

**Process:**
1. Search: `from:acme.com OR to:acme.com subject:(quote OR pricing OR proposal)`
2. Date filter: Last 30 days
3. Extract pricing information from email body
4. Check attachments for proposals
5. Return answer with source

**Response:**
```
We quoted Acme Corp $15,000 for the annual enterprise plan.

Source:
- Email: "Re: Enterprise Plan Quote"
- Date: September 28, 2025
- Sent to: john.smith@acme.com
- Attachment: proposal-acme-corp-2025.pdf

Details:
- Plan: Enterprise Annual
- Price: $15,000/year
- Includes: 50 licenses, priority support
- Valid until: October 31, 2025

Confidence: 100%
```

### Example 2: Detect and Score Leads

**Query:** "Find leads from this week's emails"

**Process:**
1. Search all emails from last 7 days
2. Filter for lead indicators
3. Score each lead
4. Store in memory
5. Generate report

### Example 3: Draft Response

**Query:** "Draft a response to Jane's question about our service"

**Process:**
1. Load Jane's client profile from memory
2. Read her email and extract questions
3. Draft response addressing all points
4. Include relevant information from past conversations
5. Present for approval

**Draft:**
```
Subject: Re: Question about service options

Hi Jane,

Thanks for reaching out! Based on our previous discussions, I think the Pro plan would work well for your needs.

To answer your questions:
1. Setup time: 2-3 business days after contract signing
2. Migration support: Yes, included in Pro plan
3. Custom integrations: Available as add-on ($500/integration)

As we discussed last month, the Pro plan includes everything in Standard plus priority support, which you mentioned was important for your team.

Would you like to schedule a call this week to walk through the setup process?

Best regards,
[Your Name]
```

## Error Handling

**Search returns no results:**
1. Try broader search terms
2. Expand date range
3. Check alternate email addresses
4. Suggest manual search
5. **Never hallucinate** - state clearly "No results found"

**Ambiguous pricing requests:**
1. Reference your pricing documentation
2. Clarify which package/option
3. Include date of last pricing update
4. **Never estimate** - provide exact prices or state "Needs clarification"

**Lead scoring uncertainty:**
1. Score conservatively
2. Flag for manual review
3. Note missing information
4. Update score when more context available

## Best Practices

**Accuracy:**
- Always cite specific emails
- Include message IDs when available
- Verify information before responding
- Cross-reference important details

**Privacy:**
- Respect data protection regulations
- Don't share client data inappropriately
- Secure API credentials
- Use proper authentication

**Maintenance:**
- Regularly update lead scoring criteria
- Review and tune search queries
- Clean up old labels/tags
- Archive resolved threads

**Performance:**
- Batch process when possible
- Cache frequent queries
- Use pagination for large result sets
- Optimize search queries

## Integration with Other Skills

**Works well with:**
- **content-research-writer** - Draft detailed email responses
- **systematic-debugging** - Troubleshoot email integration issues
- **verification-before-completion** - Verify before sending emails
- **notion-template-processor** - Generate proposals from email data

## Quick Reference

| Task | Command Pattern | Tools Needed |
|------|----------------|--------------|
| Search emails | Natural language query | Gmail API / MCP |
| Detect leads | Analyze recent emails | Scoring algorithm |
| Track client | Store/retrieve profile | Mem0 / Database |
| Draft response | Load context + generate | Client memory |
| Generate report | Aggregate + analyze | Query tools |

## Getting Started

1. **Choose email provider** (Gmail, Outlook, IMAP)
2. **Set up authentication** (API keys, OAuth, credentials)
3. **Configure business context** (create config file)
4. **Define lead criteria** (customize scoring)
5. **Test with sample queries** (validate setup)
6. **Enable auto-labeling** (optional)
7. **Integrate memory system** (Mem0, database, files)

## Advanced Features

### Sentiment Analysis

Track client sentiment over time:
```python
from textblob import TextBlob

def analyze_sentiment(email_text):
    blob = TextBlob(email_text)
    return {
        'polarity': blob.sentiment.polarity,  # -1 to 1
        'subjectivity': blob.sentiment.subjectivity  # 0 to 1
    }
```

### Email Thread Tracking

Follow conversation threads:
```
1. Group emails by thread ID
2. Track thread status (open/closed)
3. Identify unanswered threads
4. Monitor response times
```

### Automated Follow-Up

Set reminders for follow-up:
```
IF email sent AND no response after 3 days
THEN flag for follow-up
AND draft reminder email
```

## Troubleshooting

**Rate limits exceeded:**
- Implement exponential backoff
- Batch requests
- Use pagination
- Cache results

**Authentication failures:**
- Refresh OAuth tokens
- Verify API credentials
- Check permissions/scopes
- Re-authenticate if needed

**Incorrect lead scoring:**
- Review scoring criteria
- Adjust keyword weights
- Manual review sample
- Tune thresholds

---

*This skill provides a framework for email intelligence. Customize the configuration, scoring criteria, and labels to match your specific business needs.*
