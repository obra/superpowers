---
description: "Full synchronization of wiki with current raw sources and codebase. Scans all raw docs, compares with implementation, bulk updates wiki pages, detects mismatches, and regenerates hot.md."
disable-model-invocation: true
---

Invoke the superpowers:wiki-management skill in SYNC mode and follow these steps exactly:

## Pre-flight

1. Verify `docs/wiki/` directory exists. If not, abort and instruct user to run `/wiki-init` first.
2. Verify `docs/wiki/index.md` and `docs/wiki/hot.md` exist.

## Sync Workflow

### Step 1: Scan Raw Sources

Scan all raw source directories for current content:
- `docs/specs/` — Specs, PRDs, requirements
- `docs/api/` — API contracts, schemas
- `docs/plans/` — Implementation plans

Build a manifest of all raw source files with their last-modified dates.

### Step 2: Analyze Codebase

Read the current codebase to understand actual implementation state. Focus on:
- Project structure and architecture
- Implemented features and their status
- API endpoints and contracts in code
- Key technical decisions reflected in code

### Step 3: Bulk Update Wiki Pages

For each wiki page in `docs/wiki/`, compare against raw sources and codebase:
- `architecture.md` — Update from codebase structure and `docs/specs/`
- `features.md` — Update feature list and status from code and `docs/plans/`
- `api-contracts.md` — Update from `docs/api/` and actual API implementations
- `decisions.md` — Update from `docs/plans/` and code patterns
- `tech-stack.md` — Update from package files, configs, and dependencies
- `changelog.md` — Update from recent git history

Create new wiki pages for any raw source topics not yet covered.

### Step 4: Detect Mismatches

Compare spec vs implementation and mark discrepancies:
- Raw docs that describe features not yet implemented
- Implemented features not documented in raw sources
- API contracts that differ between docs and code
- Outdated information in wiki pages

Add mismatch warnings directly in relevant wiki pages using this format:
```
> **Mismatch**: [description of discrepancy] (detected: YYYY-MM-DD)
```

### Step 5: Regenerate hot.md

Overwrite `docs/wiki/hot.md` with a fresh summary (500 words max):
- Current project state
- Active work and recent major changes
- Key mismatches or areas needing attention

### Step 6: Update index.md

Rebuild `docs/wiki/index.md` catalog:
- One entry per wiki page with one-line summary
- Remove entries for deleted pages
- Add entries for newly created pages

### Step 7: Append to log.md

Append sync record to `docs/wiki/log.md`:
```
- YYYY-MM-DD HH:MM: [sync] full wiki synchronization (pages updated: N, mismatches found: N, new pages: N)
```

### Step 8: Commit

Stage and commit all wiki changes:
```
git add docs/wiki/
git commit -m "docs(wiki): full sync — update wiki from raw sources and codebase"
```

## Post-sync

Report a summary of what changed:
- Pages updated
- New pages created
- Mismatches detected
- hot.md regenerated (yes/no)
