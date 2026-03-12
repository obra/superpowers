---
name: progress-tracker
description: Use when completing meaningful implementation work - records structured progress entries in .progress and updates the global TOC
---

# progress-tracker

## Overview

Record implementation memory in a structured, searchable format.

This skill captures what was attempted, what failed, what worked, and how code changes map to commits.

## When to Use

Use this skill when:
- A meaningful implementation milestone is completed
- A bugfix or feature task closes with concrete outcomes
- A user asks to log progress for current work

Skip or defer when:
- Work is pure exploration with no durable decision
- Changes are trivial and add no reusable lessons

## Prerequisite

If `.progress/`, `.progress/PROGRESS.md`, or `.progress/entries/<YYYY>/` for the current year is missing, run `progress-bootstrap` first.

## Required Entry Fields

Each entry must include:

1. Date
2. Title
3. Background / Issue
4. Actions / Outcome
5. Lessons / Refinements
6. Related Commit Message (required)
7. Related Commit Hash (recommended)

## Entry Location and Naming

- Root: `.progress/`
- Entry index: `.progress/PROGRESS.md`
- Entries: `.progress/entries/<YYYY>/YYYY-MM-DD-N.md`
- `N` increments for multiple entries on the same date

## TOC Contract

Maintain a global TOC table in `.progress/PROGRESS.md` with:

```markdown
| Page ID | Date | Title | Path | Keywords |
| --- | --- | --- | --- | --- |
```

Each new entry appends one row.

## Execution Rules

- Canonical location is `.progress/`.
- Do not use `.agents/`.
- `Related Commit Message` is mandatory.
- If commit hash is unavailable, use `TBD` and update later.
- When replacing `TBD` with a real hash, create the implementation commit first, then update the progress entry and commit that progress change separately.
- Never rewrite historical sections except intentional corrections.

## Suggested Entry Template

```markdown
# YYYY-MM-DD-N

## Date
YYYY-MM-DD

## Title
[Short actionable title]

## Background / Issue
[Context, trigger, constraints]

## Actions / Outcome
- Approach 1: [what was tried] -> [result]
- Approach 2: [what was tried] -> [result]
- Final approach: [adopted approach] -> [why it worked]

## Lessons / Refinements
- [Reusable pattern]
- [Avoidance note]

## Related Commit Message
type(scope): summary

## Related Commit Hash
abc123d (or TBD)
```

## Error Handling

- Missing commit message: stop and request it.
- TOC missing: initialize via `progress-bootstrap`, then continue.
- Entry path collision: increment `N` and retry.
