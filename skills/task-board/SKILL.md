---
name: task-board
description: Use to view the current Synchestra task board showing all tasks, their status, and assignments
---

# Task Board

## Overview

Display the current state of all Synchestra tasks in the project. Shows what's queued, in progress, blocked, completed, and failed.

**Announce at start:** "I'm using the task-board skill to show the current task state."

## Prerequisites

Synchestra must be installed and the project initialized. Check:

```bash
command -v synchestra >/dev/null 2>&1 && ls synchestra.yaml 2>/dev/null
```

If not available, tell the user:
> "Synchestra is not set up in this project. Use `superpowers:install-synchestra` to enable persistent task state."

## Display Board

### Full board

```bash
synchestra task list
```

### Filtered views

```bash
# What's available to work on
synchestra task list --status queued

# What's currently being worked on
synchestra task list --status in_progress

# What's blocked
synchestra task list --status blocked

# What's done
synchestra task list --status completed
```

### Task details

```bash
synchestra task info <task-id>
```

## Presentation

Format the output for the user as a clear summary:

**In Progress:**
- Task 3: "Add authentication middleware" (claimed by agent-session-abc)

**Blocked:**
- Task 5: "Integration tests" — blocked on: "waiting for API credentials"

**Queued (available):**
- Task 6: "Add rate limiting"
- Task 7: "Write documentation"

**Completed:**
- Task 1: "Set up project structure"
- Task 2: "Add database models"
- Task 4: "Add user endpoints"

## Session Continuity

If tasks are `in_progress` from a previous session, highlight them:

> "Task 3 was in progress when the last session ended. Would you like to resume it or release it back to the queue?"

This is the key benefit of Synchestra state — work doesn't get lost between sessions.
