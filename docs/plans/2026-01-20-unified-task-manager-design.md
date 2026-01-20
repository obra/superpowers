# Design: Unified Task Management Integration

## Overview
Create a unified abstraction layer (`lib/task-manager.js`) to handle task management operations across different providers (Jira, Notion, Trello, etc.). This decouples the "skills" (which just say "create a task") from the specific backend implementation.

## Goals
- **Provider Agnostic**: Skills don't need to know if it's Jira or Notion.
- **Extensible**: Easy to add Trello, Linear, etc.
- **Consistent DX**: `node lib/task-manager.js create ...` works the same everywhere.

## Architecture

### 1. Configuration (`lib/config-core.js`)
Extend config to support provider selection and credentials:
```json
{
  "project_management": {
    "provider": "jira", // or "notion", "local", "trello"
    "jira": { ... },
    "notion": { "database_id": "..." }
  }
}
```

### 2. The Manager (`lib/task-manager.js`)
A CLI entry point that delegates to specific provider adapters.
- **Commands**:
  - `create`: Create a new task/ticket.
  - `update`: Update status, assign, etc.
  - `log-work`: Add work logs/time tracking.
  - `breakdown`: Create subtasks from a list.

### 3. Adapters (`lib/adapters/`)
- `jira-adapter.js`: Wraps Jira REST API / MCP tools.
  - Supports Native Subtasks (Issue Type: "Sub-task").
- `notion-adapter.js`: Wraps Notion API / MCP tools.
  - Supports Sub-items (Relation property to self).
- `local-adapter.js`: Manages local markdown/todo lists (fallback).

## Subtask Strategy
- **Native Support**: The manager will attempt to use the provider's native subtask capability.
- **Jira**: Creates issues with `issuetype="Sub-task"` and `parent={key: "PARENT-123"}`.
- **Notion**: Uses the "Parent Item" / "Sub-item" relation property if configured in the database.
- **Fallback**: If not supported/configured, appends a checklist to the parent task description.

## Implementation Details

### CLI Usage Example
```bash
# Create a task
node lib/task-manager.js create --title "Fix login bug" --type "Bug" --desc "..."

# Log work
# Time format: "1h 30m", "15m", "2d"
node lib/task-manager.js log-work --id "PROJ-123" --time "2h" --comment "Investigated root cause"
```

## Work Logging Strategy
- **Time Duration**: Uses standard format (e.g. "1h 30m").
- **Jira**: Maps to `timeSpent`.
- **Notion**: Maps to a "Time Spent" property (Text or Number).
- **Local**: Appends a log entry to the task file: `- [x] 2h: Investigated root cause`.

### Skill Updates
- Update `skills/using-jira/SKILL.md` -> `skills/using-task-tracker/SKILL.md` (generalized).
- The new skill instructs the agent to use `lib/task-manager.js`.

## Next Steps
1. Create `lib/adapters/` directory.
2. Implement `jira-adapter.js` (move logic from `using-jira`).
3. Implement `notion-adapter.js` (move logic from `using-notion`).
4. Create `lib/task-manager.js` dispatcher.
5. Create generic `skills/using-task-tracker/SKILL.md`.
