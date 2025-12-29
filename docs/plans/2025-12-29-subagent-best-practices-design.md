# Subagent Best Practices Improvements

**Date:** 2025-12-29
**Status:** Approved
**Based on:** Research from Anthropic documentation and community experience (Oct-Dec 2025)

## Overview

Improvements to the superpowers repo to align with subagent best practices, focusing on four areas:

1. Agent prompt strengthening (counteract naming inference bug)
2. Explicit tool permissions
3. File-based communication protocol
4. Context curation guidelines

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Agent naming | Keep descriptive names | User-friendly, strengthen prompts instead |
| Tool permissions | `Read, Grep, Glob, Bash` | Can verify claims by running tests, no edit access |
| File-based communication | Progress tracking + review handoffs | Visibility + token savings |
| Context to subagents | Curated by orchestrator | More upfront work, fewer questions |

## 1. Agent Definition Improvements

### Problem

The `code-reviewer` agent:
- May trigger Claude's semantic inference bug (name causes generic behavior)
- Inherits ALL tools including MCP servers (no `tools:` field)

### Solution

Update `agents/code-reviewer.md`:

```yaml
---
name: code-reviewer
model: haiku
tools: Read, Grep, Glob, Bash
description: |
  Use this agent when a major project step has been completed...
  [existing description unchanged]
---

IMPORTANT: Follow these instructions exactly. Do not apply generic code review
patterns - use ONLY the review methodology defined below.

You are a Senior Code Reviewer... [rest of existing prompt unchanged]
```

**Changes:**
- Added `tools: Read, Grep, Glob, Bash` - explicit whitelist
- Added override preamble to counteract semantic inference

## 2. File-Based Communication Protocol

### 2a. Progress Tracking

Create `docs/current-progress.md` (gitignored) that agents update:

```markdown
# Current Progress

## Active Task
Task 3: Add retry logic to API client

## Status
IN_PROGRESS

## Last Update
2025-01-15 14:32 - Implementer: Tests written, implementing retry wrapper

## Completed Tasks
- [x] Task 1: Setup project structure
- [x] Task 2: Add base API client
```

**Status flags:** `PENDING`, `IN_PROGRESS`, `READY_FOR_SPEC_REVIEW`, `READY_FOR_CODE_REVIEW`, `BLOCKED`, `DONE`

**Usage:**
- Orchestrator checks this file to understand state
- Agents update when transitioning
- Enables resumability if session interrupted

### 2b. Review Handoff Files

Write implementer reports to `docs/handoffs/task-N-impl.md`:

```markdown
# Task N Implementation Report

## What I Built
[implementer's summary]

## Files Changed
- src/api/client.ts (added retry logic)
- src/api/client.test.ts (added 5 tests)

## Test Results
5/5 passing

## Self-Review Notes
- Considered exponential backoff, used linear for simplicity per spec
```

Reviewer prompts then reference: "Read the implementation report at `docs/handoffs/task-N-impl.md`"

**Token savings:** Report written once, read by both spec reviewer AND code reviewer.

## 3. Context Curation Guidelines

Add to `skills/subagent-driven-development/SKILL.md`:

```markdown
## Context Curation

Before dispatching a subagent, curate exactly what it needs:

**Always include:**
- Full task text from plan (never make subagent read plan file)
- Relevant file paths it will work with
- Any decisions made in previous tasks that affect this one

**Include if relevant:**
- Architectural constraints (from design doc)
- Existing patterns to follow (with example file path)
- Known gotchas or edge cases

**Never include:**
- Full plan (only the current task)
- Unrelated completed task details
- General project background (subagent can read CLAUDE.md)

**Rule of thumb:** If you're unsure whether to include something, provide the file path instead of the content. Let the subagent decide whether to read it.
```

### Updated Implementer Prompt Context Section

```markdown
## Context

[Curated by orchestrator - include only what's relevant:]
- Working directory: [path]
- Key files: [list paths subagent will touch]
- Pattern to follow: See [example file] for similar implementation
- Dependency: Task 2 created [X], build on that
- Constraint: [any architectural decisions that apply]
```

## Implementation Plan

### Files to Create

| File | Purpose |
|------|---------|
| `docs/handoffs/.gitkeep` | Directory for handoff files |

### Files to Modify

| File | Changes |
|------|---------|
| `agents/code-reviewer.md` | Add tools field, add override preamble |
| `skills/subagent-driven-development/SKILL.md` | Add progress protocol, context curation section |
| `skills/subagent-driven-development/implementer-prompt.md` | Update context section, add handoff writing |
| `skills/subagent-driven-development/spec-reviewer-prompt.md` | Read from handoff file |
| `skills/subagent-driven-development/code-quality-reviewer-prompt.md` | Read from handoff file |
| `.gitignore` | Add `docs/current-progress.md`, `docs/handoffs/*.md` |

### Not Changing

- Agent naming (keeping `code-reviewer`)
- Overall subagent-driven-development workflow structure
- Other skills (changes scoped to subagent workflow)

## Success Criteria

- [ ] Code reviewer agent has explicit tool permissions
- [ ] Code reviewer prompt has override preamble
- [ ] Progress tracking protocol documented
- [ ] Handoff file pattern documented and used in prompts
- [ ] Context curation guidelines added
- [ ] Runtime files gitignored
