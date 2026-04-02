---
name: using-memory
description: Use when design, planning, or implementation may depend on prior project decisions, existing boundaries, or earlier similar work
---

# Using Memory

## Overview

Use project memory only when history can materially improve the current decision.

This skill is retrieval-only. It helps find the smallest amount of relevant history, then stop.

## When to Use

Memory is worth consulting when one or more of these are true:

- current work depends on why something was designed, fixed, or reorganized before
- the task may already have a precedent worth reusing
- the task needs to stay consistent with earlier project decisions or boundaries
- several reasonable directions exist and project history may narrow the choice

Do not use memory when the current request, code, spec, and plan already make the path clear.
Do not keep reading once extra history would add background but not change the decision.

## Retrieval Order

1. Start by scanning `docs/superpowers/memory/*/MEMORY.md`.
2. Use `grep` to find only the `## Use When` and `## Avoid When` field titles first.
3. Use the reported line numbers to `read` only small windows around those sections.
4. Expand the read window only if the section boundary is still unclear.
5. Choose the smallest useful set of candidate memory types.
6. Only after choosing candidate types, inspect their `INDEX.md` files.
7. From those candidates, inspect only the specific entries that look relevant.
8. Stop as soon as the current task has enough history to move forward.

`MEMORY.md` files define when a type is worth consulting. `INDEX.md` helps find likely entries inside a chosen type. Specific entries provide evidence only after the type has already been chosen.

If `docs/superpowers/memory/` is missing, or scanning finds no usable `MEMORY.md` files, stop and report that no project memory is available. This skill does not create or repair memory structure.

## Stop Conditions

Stop reading when any of these are true:

- you can tell whether relevant precedent exists
- you have the 1-3 history constraints that matter for the task
- you know the needed background well enough to continue safely
- reading more would add detail but not change the decision
- continuing would require whole-file or whole-index reading instead of targeted lookup

Never:

- reading whole `MEMORY.md` files by default
- treating `INDEX.md` as type-definition metadata
- doing global history summaries when the task only needs local precedent
- writing new memory entries from the retrieval skill
- reading entries before deciding which memory type is worth consulting

## Output Contract

Return only:

- whether relevant memory was found
- the small set of sources used
- the history facts or constraints that matter now
- any open questions that still need another source
