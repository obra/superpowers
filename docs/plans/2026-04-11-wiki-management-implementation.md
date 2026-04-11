# Wiki Management System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:team-driven-development for parallel agent team execution, or superpowers:executing-plans for sequential batch execution in a separate session.

**Goal:** Implement LLM Wiki pattern as a superpowers skill — pre-compiled project knowledge cache that eliminates redundant codebase exploration each session.

**Architecture:** Single `wiki-management` skill with 4 modes (ingest/query/sync/lint). 3 commands (`/wiki-init`, `/wiki-sync`, `/wiki-lint`) as entry points. Existing 6 skills get wiki integration triggers. Target project CLAUDE.md gets wiki schema via wiki-init.

**Tech Stack:** Markdown files, `[[wikilinks]]`, YAML frontmatter, Claude Code skill/command system

**Design Doc:** `docs/plans/2026-04-11-wiki-management-design.md`

---

## Task 1: Create `/wiki-init` Command

**Files:**
- Create: `commands/wiki-init.md`

**Step 1: Write the command file**

```markdown
---
description: "Initialize project wiki knowledge base. Run once per project. Creates docs/wiki/ with initial pages generated from existing docs and codebase analysis."
---

Invoke the superpowers:wiki-management skill in INIT mode.

Context: The user wants to create a wiki knowledge base for this project.

Execute the following steps:

1. Check if `docs/wiki/` already exists. If yes, ask user whether to overwrite.
2. Create `docs/wiki/` directory with template files: index.md, hot.md, log.md, architecture.md, features.md, api-contracts.md, decisions.md, tech-stack.md, changelog.md
3. Scan `docs/specs/`, `docs/api/`, `docs/plans/` for existing documents
4. Analyze current codebase structure (main directories, entry points, config files)
5. Collect key commit history via `git log --oneline -30`
6. Generate initial wiki pages from collected information:
   - architecture.md — current code structure summary
   - features.md — implemented feature list + status
   - api-contracts.md — existing API doc synthesis
   - tech-stack.md — tech stack summary
   - decisions.md — key decisions extracted from git log and docs
   - changelog.md — recent meaningful commit summaries
7. Write index.md with full page catalog
8. Write hot.md with current project state summary (~500 words max)
9. Write log.md with initialization record
10. Ask user whether to add Wiki Knowledge Base section to CLAUDE.md. If yes, add the schema section with `@docs/wiki/hot.md` reference.
11. Commit all wiki files.

Important:
- If `docs/wiki/` exists, MUST confirm with user before overwriting
- Wiki page language follows the language of raw source documents
- hot.md MUST stay under 500 words
- Use the wiki page template format with YAML frontmatter (title, last_updated, sources, related)
- log.md is append-only
```

**Step 2: Verify file created**

Run: `cat commands/wiki-init.md | head -5`
Expected: YAML frontmatter with description

**Step 3: Commit**

```bash
git add commands/wiki-init.md
git commit -m "feat: add /wiki-init command for project wiki creation"
```

---

## Task 2: Create `wiki-management` Skill

**Files:**
- Create: `skills/wiki-management/SKILL.md`

**Step 1: Write the skill file**

The skill file must include all 4 modes (Ingest, Query, Sync, Lint) with clear trigger conditions and workflows. Key sections:

```markdown
---
description: "Manages project wiki knowledge base (LLM Wiki pattern). Modes: Ingest (absorb raw docs into wiki), Query (answer from wiki before code), Sync (full wiki rebuild), Lint (health check). Triggers from existing skill integrations or /wiki-* commands."
---

# Wiki Management

## Overview
[Explain the 3-layer pattern: Raw Sources (immutable) → Wiki (LLM-owned) → Schema (CLAUDE.md rules)]
[Explain L1/L2 cache: hot.md = L1 auto-loaded, wiki pages = L2 on-demand]

## Pre-flight Check
- Verify `docs/wiki/` exists. If not, instruct user to run `/wiki-init` first and STOP.
- Read `docs/wiki/index.md` to understand current wiki state.

## Mode: Ingest
[Trigger conditions, 7-step workflow from design doc]
[Template for wiki pages with YAML frontmatter]
[Rules: never modify raw sources, maintain wikilinks, update index.md, append to log.md, refresh hot.md]

## Mode: Query
[Trigger conditions, 4-step workflow]
[Priority: hot.md → index.md → wiki pages → code exploration (last resort)]
[If code exploration needed, reflect findings back to wiki]

## Mode: Sync
[Full rebuild workflow, 5 steps]
[Spec↔implementation mismatch detection]

## Mode: Lint
[6 health check items]
[Report format and auto-fix suggestions]

## Wiki Page Template
[YAML frontmatter format: title, last_updated, sources, related]
[Body: Summary, Details with wikilinks, Change History with commit hashes]

## Special Pages
- hot.md: 500 words max, overwrite on each update, current state + active work + recent changes
- log.md: append-only, format: `- YYYY-MM-DD HH:MM: [action] target (reason)`
- index.md: one-line summary per page, sorted by topic

## Raw Source Protection
NEVER modify files in: docs/specs/, docs/api/, docs/plans/
These are human-managed. Wiki reads from them but never writes to them.

## Integration Notes
- If `docs/wiki/` doesn't exist, skip all wiki operations silently
- Wiki language follows raw source document language
- Commit hash references use short form (7 chars)
- wikilinks use `[[page-name]]` format (no .md extension)
```

**Step 2: Verify file created**

Run: `cat skills/wiki-management/SKILL.md | head -5`
Expected: YAML frontmatter with description

**Step 3: Commit**

```bash
git add skills/wiki-management/SKILL.md
git commit -m "feat: add wiki-management skill with ingest/query/sync/lint modes"
```

---

## Task 3: Create `/wiki-sync` Command

**Files:**
- Create: `commands/wiki-sync.md`

**Step 1: Write the command file**

```markdown
---
description: "Full wiki synchronization. Scans all raw sources and codebase, rebuilds wiki pages, detects spec↔implementation mismatches."
---

Invoke the superpowers:wiki-management skill in SYNC mode.

Context: The user wants to fully synchronize the wiki with current raw sources and codebase state.

Execute wiki-management Sync workflow:
1. Verify docs/wiki/ exists (if not, suggest /wiki-init)
2. Scan docs/specs/, docs/api/, docs/plans/ for all raw documents
3. Analyze current codebase implementation state
4. Bulk update all wiki pages
5. Mark spec↔implementation mismatches in relevant pages
6. Regenerate hot.md
7. Update index.md
8. Append sync record to log.md
9. Commit updated wiki files
```

**Step 2: Commit**

```bash
git add commands/wiki-sync.md
git commit -m "feat: add /wiki-sync command for full wiki synchronization"
```

---

## Task 4: Create `/wiki-lint` Command

**Files:**
- Create: `commands/wiki-lint.md`

**Step 1: Write the command file**

```markdown
---
description: "Wiki health check. Finds orphan pages, broken wikilinks, stale content, missing coverage, and contradictions."
---

Invoke the superpowers:wiki-management skill in LINT mode.

Context: The user wants to check the health of their project wiki.

Execute wiki-management Lint workflow:
1. Verify docs/wiki/ exists (if not, suggest /wiki-init)
2. Check for orphan pages (not linked from any other page or index)
3. Check for broken [[wikilinks]]
4. Check for stale pages (last_updated older than 30 days)
5. Check for raw docs not reflected in wiki
6. Check for contradictory information across pages
7. Output health report with findings and severity
8. Suggest auto-fixes for each issue found
9. If user approves fixes, apply them and commit
```

**Step 2: Commit**

```bash
git add commands/wiki-lint.md
git commit -m "feat: add /wiki-lint command for wiki health check"
```

---

## Task 5: Add Wiki Integration to `finishing-a-development-branch`

**Files:**
- Modify: `skills/finishing-a-development-branch/SKILL.md` (append after last line)

**Step 1: Read current file ending**

Run: `tail -10 skills/finishing-a-development-branch/SKILL.md`

**Step 2: Append wiki integration section**

Add at end of file:

```markdown

## Wiki Integration

If `docs/wiki/` exists in the project:
1. Run `git log --oneline` for commits in this branch
2. Select meaningful commits (feat, fix, refactor) — hash + one-line summary only
3. Append to `docs/wiki/changelog.md` with date and commit summaries
4. Update related wiki pages with inline commit hash references
5. Refresh `docs/wiki/hot.md` with branch completion summary (keep under 500 words)
6. Append to `docs/wiki/log.md`
7. Update `docs/wiki/index.md` if new pages were created

If `docs/wiki/` does not exist, skip this section entirely.
```

**Step 3: Commit**

```bash
git add skills/finishing-a-development-branch/SKILL.md
git commit -m "feat: add wiki integration trigger to finishing-a-development-branch skill"
```

---

## Task 6: Add Wiki Integration to `verification-before-completion`

**Files:**
- Modify: `skills/verification-before-completion/SKILL.md` (append after last line)

**Step 1: Read current file ending**

Run: `tail -10 skills/verification-before-completion/SKILL.md`

**Step 2: Append wiki integration section**

Add at end of file:

```markdown

## Wiki Integration

If `docs/wiki/` exists in the project:
1. After all verification passes, update wiki to reflect completed work
2. Update `docs/wiki/features.md` if feature status changed
3. Update `docs/wiki/changelog.md` with commit being verified
4. Refresh `docs/wiki/hot.md` (keep under 500 words)
5. Append to `docs/wiki/log.md`

If `docs/wiki/` does not exist, skip this section entirely.
```

**Step 3: Commit**

```bash
git add skills/verification-before-completion/SKILL.md
git commit -m "feat: add wiki integration trigger to verification-before-completion skill"
```

---

## Task 7: Add Wiki Integration to `brainstorming`

**Files:**
- Modify: `skills/brainstorming/SKILL.md` (append after last line)

**Step 1: Append wiki integration section**

Add at end of file:

```markdown

## Wiki Integration

If `docs/wiki/` exists in the project:
1. After saving design doc to `docs/plans/`, run wiki-management Ingest on the new document
2. Extract features and requirements → update `docs/wiki/features.md`
3. Extract key decisions → update `docs/wiki/decisions.md`
4. Append to `docs/wiki/log.md`

If `docs/wiki/` does not exist, skip this section entirely.
```

**Step 2: Commit**

```bash
git add skills/brainstorming/SKILL.md
git commit -m "feat: add wiki integration trigger to brainstorming skill"
```

---

## Task 8: Add Wiki Integration to `writing-plans`

**Files:**
- Modify: `skills/writing-plans/SKILL.md` (append after last line)

**Step 1: Append wiki integration section**

Add at end of file:

```markdown

## Wiki Integration

If `docs/wiki/` exists in the project:
1. After saving implementation plan, run wiki-management Ingest on the plan document
2. Extract feature list and milestones → update `docs/wiki/features.md`
3. Append to `docs/wiki/log.md`

If `docs/wiki/` does not exist, skip this section entirely.
```

**Step 2: Commit**

```bash
git add skills/writing-plans/SKILL.md
git commit -m "feat: add wiki integration trigger to writing-plans skill"
```

---

## Task 9: Add Wiki Integration to `api-edr-validation`

**Files:**
- Modify: `skills/api-edr-validation/SKILL.md` (append after last line)

**Step 1: Append wiki integration section**

Add at end of file:

```markdown

## Wiki Integration

If `docs/wiki/` exists in the project:
1. Before API verification, check `docs/wiki/api-contracts.md` first
2. Use wiki as primary reference; only fall back to code exploration if wiki lacks the answer
3. After verification, if new API information was discovered from code, update `docs/wiki/api-contracts.md`
4. Append to `docs/wiki/log.md`

If `docs/wiki/` does not exist, proceed with normal API validation workflow.
```

**Step 2: Commit**

```bash
git add skills/api-edr-validation/SKILL.md
git commit -m "feat: add wiki integration trigger to api-edr-validation skill"
```

---

## Task 10: Add Wiki Integration to `audit-verification`

**Files:**
- Modify: `skills/audit-verification/SKILL.md` (append after last line)

**Step 1: Append wiki integration section**

Add at end of file:

```markdown

## Wiki Integration

If `docs/wiki/` exists in the project:
1. During audit, reference wiki pages to compare spec vs implementation
2. Check `docs/wiki/features.md` for expected feature status
3. Check `docs/wiki/api-contracts.md` for API contract compliance
4. Flag any wiki↔implementation discrepancies in audit report

If `docs/wiki/` does not exist, proceed with normal audit workflow.
```

**Step 2: Commit**

```bash
git add skills/audit-verification/SKILL.md
git commit -m "feat: add wiki integration trigger to audit-verification skill"
```

---

## Dependency Graph

```
Task 1 (wiki-init command)     ─┐
Task 2 (wiki-management skill) ─┤── Core (no dependencies, can be parallel)
Task 3 (wiki-sync command)     ─┤
Task 4 (wiki-lint command)     ─┘

Task 5 (finishing-a-development-branch) ─┐
Task 6 (verification-before-completion) ─┤
Task 7 (brainstorming)                  ─┤── Skill integrations (no dependencies, can be parallel)
Task 8 (writing-plans)                  ─┤
Task 9 (api-edr-validation)             ─┤
Task 10 (audit-verification)            ─┘
```

All 10 tasks are independent and can be executed in parallel.

---

## Execution Summary

| Group | Tasks | Parallelizable |
|---|---|---|
| Core files | 1, 2, 3, 4 | Yes — all independent |
| Skill integrations | 5, 6, 7, 8, 9, 10 | Yes — all independent |
| Total | 10 tasks | All 10 can run in parallel |
