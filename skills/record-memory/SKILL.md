---
name: record-memory
description: Use when a closed, reviewable change unit should be recorded in docs/superpowers/memory/
---

# Record Memory

## Overview

Record durable project memory for a completed change unit.

## Entry Conditions

Create a memory entry only when all of the following are true:

1. The work has one clear goal.
2. The work forms one coherent, reviewable change unit.
3. The work is complete enough to preserve as durable project memory.

Do not use memory entries as work logs for exploration, partial work, or scattered trivial changes.

## Discovery Order

Every entry belongs to exactly one type.

If discovery cannot identify one unique type, stop and ask the user to clarify.

Discover the target type in this order:

1. Scan `docs/superpowers/memory/*/MEMORY.md`.
2. Read each candidate header's `Type`, `Record When`, `Avoid Recording When`, and `Entry Template`.
3. Choose the best-matching type for the completed change unit.
4. After selecting the type, read only that type's `ENTRY.md` before writing.
5. Write the entry under `docs/superpowers/memory/<type>/entries/<YYYY-MM>/`.
6. Update only that type's `INDEX.md` at `docs/superpowers/memory/<type>/INDEX.md`.

Do not hardcode type names or type meaning from this skill alone. Repository memory files are the source of truth.
This skill only routes recording work. It never retrieves, summarizes, or pre-reads historical memory for the current task.
If the task first needs project history to reduce uncertainty, hand off to `using-memory`; `Use When` / `Avoid When` are retrieval-facing fields and are not recording fallbacks.

## Stop Conditions

Stop and ask the user to clarify when:

- multiple discovered types fit and no clear choice exists
- no discovered type fits and a new type may be needed
- the completed work cannot be reduced to one reviewable change unit

## Bootstrap Handoff

Read `bootstrap.md`, restore only the minimum missing structure, then restart discovery when:

- `docs/superpowers/memory/` is missing
- scanning finds no usable `docs/superpowers/memory/*/MEMORY.md`
- a scanned `MEMORY.md` is missing required record-facing fields, or cannot be parsed; treat that type as structurally damaged
- the selected type is missing `ENTRY.md`
- the selected type is missing `INDEX.md`
- the selected type is missing its target month bucket under `entries/<YYYY-MM>/`
