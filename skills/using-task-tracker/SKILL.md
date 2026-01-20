---
name: using-task-tracker
description: Use when you need to manage tasks (Jira, Notion, or Local)
---

# Using Task Tracker

## Overview
Manage tasks using a unified interface that supports multiple providers (Jira, Notion, Local, etc.).
The provider is configured in `.superpowers/config.json`.

## Configuration
Ensure `project_management.provider` is set in your config.
- `local`: Uses a `TODO.md` file.
- `jira`: Requires `jira` config (host, email, api_token, project_key).
- `notion`: Requires `notion` config (api_key, database_id).

## Actions

### Action 1: Create Task
**Goal:** Create a new task/ticket/issue.

```bash
node lib/task-manager.js create --title "Title of Task" --desc "Description of task" --type "Task"
```

### Action 2: Log Work
**Goal:** Log time spent on a task.

```bash
# Time format examples: "1h", "30m", "1d 2h"
node lib/task-manager.js log-work --id "TASK-123" --time "1h 30m" --comment "Working on implementation"
```

### Action 3: Create Subtask
**Goal:** Create a subtask under a parent task.

```bash
node lib/task-manager.js subtask --parent "PARENT-123" --title "Subtask Title"
```

### Troubleshooting
- If using `jira`, ensure API token is valid.
- If using `notion`, ensure the bot integration has access to the Database.
