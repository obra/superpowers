---
name: using-jira
description: Use when you need to manage tasks in Jira
---

# Using Jira

## Overview
Manage tasks and bugs in Jira.

## Prerequisites
- `JIRA_API_TOKEN` and `JIRA_EMAIL` in environment.
- `JIRA_DOMAIN` (e.g., `your-domain.atlassian.net`) in configuration or environment.
- `JIRA_PROJECT_KEY` in configuration.

## Actions

### Action 1: Create Ticket
**Goal:** Create a new issue in Jira.

**Method 1: MCP Tool (Preferred)**
Check if `jira_create_issue` tool is available.

**Method 2: API Fallback**
Use `curl` to create an issue.

```bash
curl -D- \
  -u $JIRA_EMAIL:$JIRA_API_TOKEN \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{
    "fields": {
       "project":
       {
          "key": "'"$JIRA_PROJECT_KEY"'"
       },
       "summary": "Task Summary",
       "description": "Detailed description...",
       "issuetype": {
          "name": "Task"
       }
   }
}' \
"https://$JIRA_DOMAIN/rest/api/2/issue"
```

### Action 2: Update Ticket
**Goal:** Update status or add comments.

**Method 1: MCP Tool**
Check for `jira_update_issue` or `jira_add_comment`.

**Method 2: API Fallback**
Refer to Jira REST API documentation for updates.
