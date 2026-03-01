---
name: managing-kanban
description: Use when markdown-based kanban is configured in the agent config file, or when user asks about project status, assigns work, or requests task tracking setup.
---

# Multi-Project Kanban Management

## Overview

Manages tasks across multiple projects using two markdown files: `kanban.md` (active board)
and `kanbanArchive.md` (completion history). One master file covers all projects via
`[ProjectName]` tags — no per-project files, no sync issues.

**Core principle:** If kanban is configured → read it before any work. If not configured → skip silently and continue.

**Announce at start:** "I'm using the managing-kanban skill to check task context."

## Step 1: Check Configuration

```
1. Look for a "## Kanban" section in the agent config file (e.g. CLAUDE.md / AGENTS.md)
2. If found → read the Board path listed there (proceed to Step 2)
3. If not found → skip kanban entirely, proceed with the user's task directly
```

**Do NOT stop work or prompt setup** if kanban is unconfigured. Setup is opt-in (see Setup Wizard).

## Step 2: Read Board (Configured Users Only)

```
1. Read kanban.md → record current rev:N
2. Review WIP, TODO, FREEZE sections for context
3. Surface blockers or WIP limit issues before starting new work
```

## Setup Wizard (Optional, First Time Only)

Run only when user explicitly asks to set up kanban.

```
1. Ask user: "Where is the master project directory?" (absolute path)
2. Create {dir}/kanban.md from kanban-template.md (in this skill's directory)
3. Create {dir}/kanbanArchive.md with header only
4. Ask user: "Which projects should be registered?" (comma-separated names)
5. Add each project to the ## Projects section in kanban.md
6. Append to agent config file:

## Kanban
- Board: {absolute-path}/kanban.md
- Archive: {absolute-path}/kanbanArchive.md
- RULE: Read Board file before starting any task. If not found: STOP and report path.

7. Confirm: read kanban.md back and show the user the initial state
```

## File Structure

### kanban.md

```markdown
# Kanban Board
_Updated: YYYY-MM-DD_
_rev: 1_

## Projects
- ProjectNameA
- ProjectNameB

## WIP (max 7)
- [ProjectA][P1][@alice] Task description

## TODO
- [ProjectB][P2] Task description

## FREEZE
- [ProjectC][P1][freeze:env][frozen:2026-02-20] Task description

## DONE (recent 10)
- [ProjectA][done:2026-02-26] Completed task
```

### kanbanArchive.md

```markdown
# Kanban Archive

## 2026-02
- [ProjectA][done:2026-02-15] Older completed task
```

## Task Format

`- [ProjectName][Priority][Size][@Assignee] Description`

All fields are bracket-enclosed and **order-independent** (except `[ProjectName]` must be first).

| Tag | Required | Example |
|-----|----------|---------|
| `[ProjectName]` | Always | `[MyApp]` |
| `[P1]` / `[P2]` / `[P3]` | Recommended | `[P2]` |
| `[S]` / `[M]` / `[L]` | Recommended | `[M]` |
| `[@name]` | Optional | `[@alice]` |
| `[ref:path]` | M/L tasks | `[ref:docs/plans/2026-02-26-feature.md]` |
| `[out:path]` | Optional | `[out:docs/Phase4-feature__c20260226.md]` |
| `[freeze:type]` | FREEZE only | `[freeze:env]` |
| `[frozen:YYYY-MM-DD]` | FREEZE only | `[frozen:2026-02-20]` |
| `[done:YYYY-MM-DD]` | DONE only | `[done:2026-02-26]` |

**Freeze reason types:** `env` · `dependency` · `decision` · `external` · `research`

**Rule:** `[ProjectName]` must match an entry in the `## Projects` registry exactly (case-sensitive).

## Task Sizing

| Size | Definition | Plan file |
|------|-----------|-----------|
| `[S]` | Completable in a single session | None |
| `[M]` | Requires 2–4 sessions | Required before WIP |
| `[L]` | Multi-day, spans multiple sessions | Required + decompose into sub-tasks |

M/L tasks: invoke **superpowers:writing-plans** before moving to WIP, add `[ref:path]` to card.

L tasks must be decomposed into S/M sub-tasks before any sub-task enters WIP.

## State Transitions

| From | To | Trigger |
|------|----|---------|
| TODO | WIP | Start working (claim write immediately) |
| WIP | DONE | Completed (`[done:YYYY-MM-DD]`) |
| WIP | FREEZE | Blocked (`[freeze:type]` + `[frozen:date]`) |
| WIP | TODO | Deprioritized |
| FREEZE | WIP/TODO/DONE | Blocker resolved |
| DONE | Archive | DONE count exceeds 10 (move oldest) |

## WIP Protocol (Parallel Agent Safety)

```
1. Read kanban.md → record rev:N
2. Count WIP items → if >= 7: STOP, report to user
3. Move task to WIP in memory, set rev to N+1
4. Write kanban.md immediately (this write is the claim)
5. Re-read kanban.md → verify your task appears in WIP
6. If missing (concurrent write collision): re-read, pick different task or report conflict
```

Never start actual work before the claim write (step 4) completes.

## Archive Rule

After every DONE transition, count `## DONE` items. If count > 10:
- Move the item with the oldest `done:date` to `kanbanArchive.md` under `## YYYY-MM`
- Increment `rev` in `kanban.md`

## Remember

- Kanban not configured → skip silently, never block work
- Setup Wizard only runs when user explicitly asks
- `[ProjectName]` must match registry exactly (case-sensitive)
- Increment `_rev_` on every write
- Claim WIP by writing immediately — never work before the write
- M/L tasks need a plan file before moving to WIP
- DONE count > 10 → archive oldest item

## Integration

**Pairs with:**
- **superpowers:writing-plans** — required for M/L tasks before WIP claim
- **superpowers:executing-plans** — reads kanban state before executing plan batches
- **superpowers:finishing-a-development-branch** — updates kanban to DONE after branch completion
