---
name: memory-bootstrap
description: Use when a repository needs canonical memory storage initialized under docs/superpowers/memory/
---

# memory-bootstrap

## Overview

Initialize project memory under `docs/superpowers/memory/`.

## When to Use

Use this skill when:
- `docs/superpowers/memory/` is missing
- `docs/superpowers/memory/CATEGORY.md` is missing
- a required default category `MEMORY.md` is missing
- a required default category month bucket is missing
- a user explicitly asks to initialize memory tracking

## Execution Rules

- Canonical location is `docs/superpowers/memory/`.
- Default categories are `milestone`, `debug`, and `refactor`.
- Create missing files and directories only.
- Never overwrite existing `CATEGORY.md`, `MEMORY.md`, or entry files.
- Keep operations idempotent.
- Do not auto-create non-default categories.

## Execution Steps

1. Ensure `docs/superpowers/memory/` exists.
2. Ensure `docs/superpowers/memory/CATEGORY.md` exists using `template/CATEGORY.md`.
3. For each default category (`milestone`, `debug`, `refactor`):
   - ensure `docs/superpowers/memory/<category>/` exists
   - ensure `docs/superpowers/memory/<category>/MEMORY.md` exists from the matching category `memory.md`
   - ensure `docs/superpowers/memory/<category>/entries/<YYYY-MM>/` exists for the current UTC month
   - create `docs/superpowers/memory/<category>/entries/<YYYY-MM>/.gitkeep` if the month folder is empty

Use these template files:

- `CATEGORY.md` -> `template/CATEGORY.md`
- `milestone` -> `template/category/milestone/memory.md`
- `debug` -> `template/category/debug/memory.md`
- `refactor` -> `template/category/refactor/memory.md`

For an explicitly approved non-default category, create the same structure and start from `template/base/memory.md` and `template/base/entry.md`.

## Error Handling

- If write permission is missing, stop and report the exact path.
- If a required memory path is occupied by a file, stop and report the conflict.
- If file creation fails, stop and return the failing path and reason.

## Notes

- This skill initializes structure only.
- Recording entries and updating category TOCs belong to `memory-tracker`.
