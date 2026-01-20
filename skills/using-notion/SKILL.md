---
name: using-notion
description: Use when you need to store documentation or manage tasks in Notion
---

# Using Notion

## Overview
Interact with Notion workspaces to store documents or manage tasks.

## Prerequisites
- `NOTION_API_KEY` in config (via `lib/config-core.js` logic).
- `project_management.notion.database_id` (for tasks) or `documentation.notion_root_page_id` (for docs) in configuration.

## Actions

### Action 1: Sync Documentation
**Goal:** Sync local markdown files to Notion pages, mirroring directory structure.

**Method:** Use the `lib/notion-sync.js` script.

1. **Sync a single file:**
   ```bash
   node lib/notion-sync.js --file path/to/doc.md
   ```

2. **Sync an entire directory (recursive):**
   ```bash
   node lib/notion-sync.js --dir path/to/docs/
   ```

**Note:** This script handles:
- Creating parent pages if they don't exist.
- Mapping local paths to Notion Page IDs (cached in `.superpowers/notion-map.json`).
- Updating existing pages.

### Action 2: Manage Tasks
**Goal:** Create or update tasks in a Notion Database.

**Method:** Use the Unified Task Manager (`lib/task-manager.js`).
See `skills/using-task-tracker/SKILL.md` for details, or run directly:

```bash
# Create a task in Notion (if configured as provider)
node lib/task-manager.js create --title "Task Name" --desc "Details..."
```
