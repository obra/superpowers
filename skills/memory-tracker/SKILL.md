---
name: memory-tracker
description: Use when a closed, reviewable change unit should be recorded in docs/superpowers/memory/ under the appropriate category
---

# memory-tracker

## Overview

Record durable project memory for a completed change unit in a structured, searchable format.

This skill captures what was attempted, what worked, and how one or more related commits map to a single reviewable memory entry.

## When to Use

Use this skill when:
- A closed, independently reviewable change unit has been completed
- The work has a single clear goal and belongs to one memory category
- A user explicitly asks to record memory for completed work

Skip or defer when:
- Work is pure exploration, reading, or experimentation
- Work is still an intermediate state and cannot be reviewed on its own
- Changes are trivial, scattered, or not worth preserving as a memory record

## Trigger Contract

Create a memory entry only when all of the following are true:

1. **Single clear goal** - the related work serves one describable objective
2. **Related commit set** - the work can be represented as one coherent change unit rather than unrelated edits; this may be one commit or multiple related commits
3. **Independently reviewable result** - the result is closed and can be reviewed on its own

Memory is not a work log. It is a record of complete, durable change units.

## Category Admission Rules

Every entry must belong to exactly one category.

Category admission rules are defined by the repository inside `docs/superpowers/memory/<category>/MEMORY.md`, not hardcoded in this skill. The skill's job is to discover and follow that contract:

- inspect the existing category directories under `docs/superpowers/memory/`
- read candidate `docs/superpowers/memory/<category>/MEMORY.md` files
- use each file's `Admission Rule` to decide where the change unit belongs
- update the selected category's `Global TOC` when a new entry is written

Do not assume category names, ordering, or business meaning from this skill alone. The repository is the source of truth.

If no existing category fits, do not invent category structure inside this skill. `memory-bootstrap` automatically guarantees only the default categories. A non-default category may be created through `memory-bootstrap` only when the repository's memory model already explicitly allows that category and its admission rule; otherwise stop and ask for clarification.

Do not treat pure exploration as a recordable category unless the repository explicitly defines a category whose admission rule requires a closed, reusable research outcome.

## Prerequisite

If `docs/superpowers/memory/` is missing, or no repository-defined category structure exists yet, run `memory-bootstrap` first. Expect that bootstrap to create only the default categories unless the repository already explicitly approves additional categories under the same structure contract. If the selected target category is still missing after bootstrap, stop and either extend the repository's category model explicitly or run the approved category extension path before writing. If the selected target month bucket is missing, create that `entries/<YYYY-MM>/` bucket within the already-defined category structure before writing; do not assume `memory-bootstrap` will create arbitrary non-current month buckets.
If a repository still has only the legacy pre-memory structure, do not use it as a supported fallback. Require `memory-bootstrap` or an explicit migration to `docs/superpowers/memory/` before writing.

## Required Entry Fields

Each entry must include:

1. Date
2. Category
3. Title
4. Background / Issue
5. Change Unit
6. Actions / Outcome
7. Lessons / Refinements
8. Related Commits
9. Integration Summary

Optional when useful:

- Commit Range

## Entry Location and Naming

- Root: `docs/superpowers/memory/`
- Category index: `docs/superpowers/memory/<category>/MEMORY.md`
- Entries: `docs/superpowers/memory/<category>/entries/<YYYY-MM>/YYYY-MM-DD-N.md`
- `N` increments for multiple entries in the same category on the same date

Month folders are physical storage buckets only. `docs/superpowers/memory/<category>/MEMORY.md` stays the category-wide global index and declaration file.

## TOC Contract

Maintain the category-specific `Global TOC` table inside `docs/superpowers/memory/<category>/MEMORY.md` using `template/toc-table-template.md`.

Each new entry appends one row to its category `MEMORY.md` only.

Example row format belongs in the repository's category `MEMORY.md`, not in this skill body.

## Entry Lifecycle Rules

- Create an entry only after the change unit is closed.
- One change unit maps to at most one memory entry.
- One memory entry belongs to exactly one memory category.
- After entry creation, only metadata or wording corrections should be made to that entry.
- If new functional commits extend the implementation boundary, treat them as a new change unit and create a new entry instead of expanding the old one.

## Recording Rules

- Canonical location is `docs/superpowers/memory/`.
- Older pre-memory layouts are legacy-only and not a supported canonical root.
- `Related Commits` must list real, existing commits only.
- `Related Commits` should be ordered chronologically or by commit sequence.
- `Keywords` in `MEMORY.md` should be 2-5 short comma-separated terms summarizing the topic, area, or issue.
- Do not record uncommitted work.
- Do not include TODOs, implementation steps, or future option comparisons in memory entries.
- Never rewrite historical sections except intentional corrections.

## Templates

- Entry template: `template/entry-template.md`
- TOC table template: `template/toc-table-template.md`

## Error Handling

- Missing target category structure: initialize defaults via `memory-bootstrap`; extend to a non-default category through `memory-bootstrap` only when the repository's category model explicitly supports that category and admission rule; otherwise stop for clarification.
- Missing target month bucket inside an existing category: create the required `entries/<YYYY-MM>/` directory before writing the entry.
- Missing real commits for `Related Commits`: stop and gather the actual commit list before writing.
- Entry path collision: increment `N` and retry.
- Unclear category selection: stop and choose a single category before writing.
