---
name: memory-tracker
description: Use when a closed, reviewable change unit should be recorded in docs/superpowers/memory/
---

# memory-tracker

## Overview

Record durable project memory for a completed change unit.

## When to Use

Use this skill when:
- a closed, independently reviewable change unit has been completed
 - the work has a single clear goal and fits one repository-defined memory type
- a user explicitly asks to record memory for completed work

Skip or defer when:
- work is pure exploration, reading, or experimentation
- work is still intermediate and cannot be reviewed on its own
- changes are trivial, scattered, or not worth preserving as memory

## Trigger Contract

Create a memory entry only when all of the following are true:

1. **Single clear goal** - the related work serves one describable objective
2. **Related commit set** - the work can be represented as one coherent change unit
3. **Independently reviewable result** - the result is closed and can be reviewed on its own

Memory is not a work log. It is a record of complete, durable change units.

## Discovery and Routing

Every entry must belong to exactly one type.

If `docs/superpowers/memory/` or `docs/superpowers/memory/TYPE.md` is missing, or if routing selects a type whose required docs structure is absent, read `bootstrap.md`, restore only the minimum missing structure, then restart discovery.

Discover repository rules in this order:

1. Read `docs/superpowers/memory/TYPE.md`.
2. Choose a candidate type from its `Use When` and `Avoid When` guidance.
3. Read `docs/superpowers/memory/<type>/MEMORY.md`.
4. Discover that type's `Entry Template` there before writing.
5. Update only the selected type's `Global TOC`.

Do not hardcode type names or business meaning from this skill alone. The repository is the source of truth.

If no existing type fits, do not invent one inside this skill. Stop and confirm whether a new type should be added.

## New Type

- If no existing type fits, stop and confirm a new type with the user before extending taxonomy.
- After confirmation, read `bootstrap.md` and follow its new-type introduction steps before writing.

## Structural Contract

- Canonical root: `docs/superpowers/memory/`
- Type router: `docs/superpowers/memory/TYPE.md`
- Type index: `docs/superpowers/memory/<type>/MEMORY.md`
- Entries: `docs/superpowers/memory/<type>/entries/<YYYY-MM>/YYYY-MM-DD-N.md`
- Before writing an entry, the target type must have both `MEMORY.md` and `entries/<YYYY-MM>/`.
- `N` increments for multiple entries in the same type on the same date
- Month folders are storage buckets only; each type `MEMORY.md` remains that type's global index

## Recording Rules

- Maintain the type-specific `Global TOC` table directly inside `docs/superpowers/memory/<type>/MEMORY.md`.
- Each new entry appends one row to its type `MEMORY.md` only.
- One change unit maps to at most one memory entry.
- One memory entry belongs to exactly one memory type.
- After entry creation, only metadata or wording corrections should be made to that entry.
- If new functional commits extend the implementation boundary, treat them as a new change unit and create a new entry instead of expanding the old one.
- `Related Commits` must list real, existing commits only.
- `Related Commits` should be ordered chronologically or by commit sequence.
- `Keywords` in `MEMORY.md` should be 2-5 short comma-separated terms summarizing the topic, area, or issue.
- Do not record uncommitted work.
- Do not include TODOs, implementation steps, or future option comparisons in memory entries.

## Error Handling

- Missing root, router, or required type docs structure: read `bootstrap.md`, restore only the minimum missing structure, then restart discovery.
- Missing real commits for `Related Commits`: stop and gather the actual commit list before writing.
- Entry path collision: increment `N` and retry.
- Unclear type selection or structure branch: stop and clarify before writing.
