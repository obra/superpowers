---
name: using-integrations
description: Use when you need to store artifacts remotely or manage tasks in an external system
---

# Using Integrations

## Overview
This skill routes storage and project management requests to the configured provider (Notion, Jira, or Local).

**Usage:**
- "I need to save this artifact."
- "Create a ticket for this task."

## Actions

### 1. Determine Configuration
First, run this Node.js script to check configuration:
```javascript
import { loadConfig } from './lib/config-core.js';
const config = loadConfig();
console.log(JSON.stringify({
    storage: config.storage?.provider || 'local',
    project_management: config.project_management?.provider || 'local'
}, null, 2));
```

### 2. Route Request

Based on the JSON output from Step 1:

**If Action is "Save Artifact" / "Store Document":**
- If `storage` is `notion`:
  - Invoke `superpowers:using-notion`
  - Action: "Store Document"
- If `storage` is `local` (default):
  - Save to local filesystem (e.g., `docs/`).

**If Action is "Manage Tasks" / "Create Ticket":**
- If `project_management` is `jira`:
  - Invoke `superpowers:using-jira`
  - Action: "Create Ticket"
- If `project_management` is `notion`:
  - Invoke `superpowers:using-notion`
  - Action: "Create Task"
- If `project_management` is `local` (default):
  - Use `superpowers:writing-plans` (Todo lists) or simple Markdown files.
