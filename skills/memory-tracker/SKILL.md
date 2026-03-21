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
- the work has a single clear goal and fits one repository-defined memory category
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

Every entry must belong to exactly one category.

Discover repository rules in this order:

1. Read `docs/superpowers/memory/CATEGORY.md`.
2. Choose a candidate category from its `Use When` and `Avoid When` guidance.
3. Read `docs/superpowers/memory/<category>/MEMORY.md`.
4. Discover that category's `Entry Template` there before writing.
5. Update only the selected category's `Global TOC`.

Do not hardcode category names or business meaning from this skill alone. The repository is the source of truth.

If no existing category fits, do not invent one inside this skill. Stop and ask for clarification.

## Prerequisite

If `docs/superpowers/memory/` or `docs/superpowers/memory/CATEGORY.md` is missing, run `memory-bootstrap` first. If the selected target category or its `MEMORY.md` is still missing after bootstrap, stop and extend the repository structure explicitly before writing. If the selected target month bucket is missing, create that `entries/<YYYY-MM>/` directory inside the existing category structure before writing.

## Structural Contract

- Canonical root: `docs/superpowers/memory/`
- Category router: `docs/superpowers/memory/CATEGORY.md`
- Category index: `docs/superpowers/memory/<category>/MEMORY.md`
- Entries: `docs/superpowers/memory/<category>/entries/<YYYY-MM>/YYYY-MM-DD-N.md`
- `N` increments for multiple entries in the same category on the same date
- Month folders are storage buckets only; each category `MEMORY.md` remains that category's global index

## Recording Rules

- Maintain the category-specific `Global TOC` table inside `docs/superpowers/memory/<category>/MEMORY.md` using `template/toc-table-template.md`.
- Each new entry appends one row to its category `MEMORY.md` only.
- One change unit maps to at most one memory entry.
- One memory entry belongs to exactly one memory category.
- After entry creation, only metadata or wording corrections should be made to that entry.
- If new functional commits extend the implementation boundary, treat them as a new change unit and create a new entry instead of expanding the old one.
- `Related Commits` must list real, existing commits only.
- `Related Commits` should be ordered chronologically or by commit sequence.
- `Keywords` in `MEMORY.md` should be 2-5 short comma-separated terms summarizing the topic, area, or issue.
- Do not record uncommitted work.
- Do not include TODOs, implementation steps, or future option comparisons in memory entries.

## Templates

- TOC table template: `template/toc-table-template.md`
- Entry templates are category-specific and must be discovered from the selected category's `MEMORY.md`.

## Error Handling

- Missing router or target category structure: initialize defaults via `memory-bootstrap`; if still missing, stop for clarification.
- Missing target month bucket inside an existing category: create the required `entries/<YYYY-MM>/` directory before writing the entry.
- Missing real commits for `Related Commits`: stop and gather the actual commit list before writing.
- Entry path collision: increment `N` and retry.
- Unclear category selection: stop and choose a single category before writing.
