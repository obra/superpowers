---
description: "Initialize a project wiki knowledge base in docs/wiki/. Creates template pages from existing project docs and codebase analysis. Run once per project."
---

Invoke the superpowers:wiki-management skill in INIT mode and follow the workflow below exactly.

## INIT Mode Workflow

### Step 1: Pre-flight Check
- Check if `docs/wiki/` directory already exists
- If it exists, show the user what files are present and ask for confirmation before overwriting
- If user declines, abort with no changes

### Step 2: Scan Existing Documentation
- Scan `docs/specs/` for specs, PRDs, and requirements documents
- Scan `docs/api/` for API contracts and schemas
- Scan `docs/plans/` for implementation plans
- Build a list of all discovered raw source documents with one-line summaries

### Step 3: Analyze Codebase
- Identify the tech stack (languages, frameworks, key dependencies)
- Identify the project architecture (directory structure, entry points, key modules)
- Identify active features and their implementation status

### Step 4: Create docs/wiki/ Directory
Create the `docs/wiki/` directory with all 9 template files:

### Step 5: Generate index.md
Create `docs/wiki/index.md` — page catalog with one-line summaries of every wiki page. Use this template:
```yaml
---
title: Wiki Index
last_updated: YYYY-MM-DD
sources: []
related: []
---
```

### Step 6: Generate Content Pages
Create each wiki page using YAML frontmatter template:
```yaml
---
title: Page Title
last_updated: YYYY-MM-DD
sources:
  - docs/specs/example.md
related: [[architecture]], [[features]]
---
```

Create these pages populated from scanned docs and codebase analysis:
1. `docs/wiki/architecture.md` — Architecture summary from codebase structure
2. `docs/wiki/features.md` — Feature list + status from specs and code
3. `docs/wiki/api-contracts.md` — API contract summary from docs/api/
4. `docs/wiki/decisions.md` — Key decisions with rationale from plans and specs
5. `docs/wiki/tech-stack.md` — Tech stack + config summary from codebase analysis

### Step 7: Generate hot.md (L1 Cache)
Create `docs/wiki/hot.md` — current project state summary for auto-loading.
- **500 words max** strictly enforced
- Content: project overview, tech stack, architecture highlights, active work, recent major changes
- This is overwritten (not appended) on each wiki update

### Step 8: Generate log.md and changelog.md
- Create `docs/wiki/log.md` — append-only change history
  - Format: `- YYYY-MM-DD HH:MM: [action] target page (reason)`
  - Initialize with: `- YYYY-MM-DD HH:MM: [init] all pages (wiki initialized by /wiki-init)`
- Create `docs/wiki/changelog.md` — commit-based change history from recent git log

### Step 9: Update CLAUDE.md
Add the following Wiki Knowledge Base section to the project's CLAUDE.md file:

```markdown
## Wiki Knowledge Base

@docs/wiki/hot.md

### Session Start Protocol
1. hot.md is auto-loaded via @ reference above
2. Look up related pages in docs/wiki/index.md if needed
3. Only explore code when wiki lacks the answer

### Wiki Update Rules
- Update related wiki pages on feature completion / branch finish
- All updates are recorded in log.md (append-only)
- Maintain [[wikilinks]] between wiki pages
- Each wiki page includes last_updated and sources

### Raw Sources (immutable — never modify)
- docs/specs/   : Specs, PRDs, requirements
- docs/api/     : API contracts, schemas
- docs/plans/   : Implementation plans

### Wiki (LLM-owned)
- docs/wiki/    : Knowledge pages generated and maintained by LLM
```

### Step 10: Summary Report
Display a summary to the user:
- Number of raw source documents discovered
- List of all wiki pages created with word counts
- hot.md word count (must be under 500)
- Confirmation that CLAUDE.md was updated
- Suggest running `/wiki-sync` if raw sources change significantly
