# Design: Enhanced Notion Integration for Documentation

## Overview
Improve the `using-notion` skill to support mirroring the local file system structure to Notion. This allows for organized documentation storage that reflects the project's directory hierarchy.

## Goals
- Support recursive document storage.
- Mirror local directory structure to Notion nested pages.
- Handle "update vs. create" logic (idempotency).

## Proposed Workflow
1. **Configuration**:
   - `NOTION_ROOT_PAGE_ID`: The top-level page under which the project docs will live.
   - `DOCS_ROOT`: Local directory to mirror (default: `docs/`).

2. **Logic (`using-notion` skill update)**:
   - When saving a document (e.g., `docs/architecture/system-design.md`):
     1. Check if `architecture` page exists under `NOTION_ROOT_PAGE_ID`.
     2. If not, create it.
     3. Check if `system-design` page exists under `architecture`.
     4. If not, create it; if yes, update it.
   - Requires a way to map local paths to Notion Page IDs (caching or search).

## Technical Approach
- **Path Mapping**: The authoritative source for mapping is the Notion Database (configured as `project_management.notion.map_database_id`).
  - The local `.superpowers/notion-map.json` file is a **transient, read-through cache** for performance.
  - Columns: `Path` (Title), `Page ID` (Text), `Last Updated` (Date).
  - Advantages: Shared across team members/agents; robust against local file deletion.
- **Search Fallback**: If not in database/cache, search Notion for a page with the directory name under the parent.
- **Skill Instructions**:
   - Update `skills/using-notion/SKILL.md` to include a recursive strategy or a script reference.
   - Since skills are text instructions, we might need a helper script in `lib/notion-sync.js` to handle the recursion complexity, which the skill then invokes.

## Sync Strategy (Rename/Delete)
- **Philosophy**: Local File System is the Source of Truth.
- **New Files**: Created in Notion and added to the Map Database.
- **Renamed/Moved Files**:
  - Treated as a **Deletion** of the old path and **Creation** of the new path.
  - Old path entry in Map Database is marked as 'Archived' or removed.
  - Old page in Notion is archived (soft delete).
- **Deleted Files**:
  - Detected when scanning the Map Database against local files.
  - Notion page archived; Map entry removed.
- **Database Update**: The `notion-sync.js` script will handle updating the Map Database rows to reflect these changes.

## User Interface (Skill)
- The user (Agent) invokes: `node lib/notion-sync.js --file docs/path/to/doc.md`
- The skill guide recommends using this script for all doc saves.

## Next Steps
- Create `lib/notion-sync.js`
- Update `skills/using-notion/SKILL.md`
