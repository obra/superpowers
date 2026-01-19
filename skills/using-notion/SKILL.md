---
name: using-notion
description: Use when you need to interact with Notion for storage or task management
---

# Using Notion

## Overview
Interact with Notion workspaces to store documents or manage tasks.

## Prerequisites
- `NOTION_API_KEY` in environment.
- `NOTION_DATABASE_ID` (for tasks) or `NOTION_PARENT_PAGE_ID` (for docs) in configuration or environment.

## Actions

### Action 1: Store Document
**Goal:** Create a new page in Notion with the document content.

#### Method 1: MCP Tool (Preferred)
Check if `notion_create_page` tool is available.
```json
{
  "parent": { "page_id": "YOUR_PARENT_PAGE_ID" },
  "properties": { "title": "Doc Title" },
  "children": [ ...blocks... ]
}
```

#### Method 2: API Fallback
**Note:** Examples use API version `2022-06-28`. To upgrade to `2025-09-03`:
1. Use `data_source_id` instead of `database_id` (requires fetching the data source ID).
2. Update endpoints to use `/v1/data_sources` if interacting with data sources.

Use `curl` to create a page.
```bash
curl -X POST https://api.notion.com/v1/pages \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Notion-Version: 2022-06-28" \
  --data '{
    "parent": { "page_id": "'"$NOTION_PARENT_PAGE_ID"'" },
    "properties": {
      "title": [
        {
          "text": {
            "content": "Doc Title"
          }
        }
      ]
    },
    "children": [
      {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
          "rich_text": [
            {
              "type": "text",
              "text": {
                "content": "Doc content..."
              }
            }
          ]
        }
      }
    ]
  }'
```

### Action 2: Create Task
**Goal:** Add a row to a Notion Database.

#### Method 1: MCP Tool (Preferred)
Check if `notion_create_database_row` or `notion_create_page` (with database parent) is available.
```json
{
  "parent": { "database_id": "YOUR_DATABASE_ID" },
  "properties": {
    "Name": { "title": "Task Name" },
    "Status": { "select": "To Do" }
  }
}
```

#### Method 2: API Fallback
**Note:** Examples use API version `2022-06-28`. To upgrade to `2025-09-03`:
1. Use `data_source_id` instead of `database_id` (requires fetching the data source ID).
2. Update endpoints to use `/v1/data_sources` if interacting with data sources.

```bash
curl -X POST https://api.notion.com/v1/pages \
  -H "Authorization: Bearer $NOTION_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Notion-Version: 2022-06-28" \
  --data '{
    "parent": { "database_id": "'"$NOTION_DATABASE_ID"'" },
    "properties": {
      "Name": {
        "title": [
          {
            "text": {
              "content": "Task Name"
            }
          }
        ]
      },
      "Status": {
        "select": {
          "name": "To Do"
        }
      }
    }
  }'
```
