---
name: memory-bootstrap
description: Use when a repository needs category-based memory storage initialized or the canonical docs/superpowers/memory/ structure is missing
---

# memory-bootstrap

## Overview

Initialize project memory under `docs/superpowers/memory/`.

This skill sets up a canonical, tool-agnostic structure for memory records organized by category instead of a single global log.

## When to Use

Use this skill when:
- A repository does not have `docs/superpowers/memory/`
- `docs/superpowers/memory/<category>/MEMORY.md` is missing for a required default category
- `docs/superpowers/memory/<category>/entries/<YYYY-MM>/` is missing for a required default category
- A user explicitly asks to initialize memory tracking

This skill automatically initializes only the default categories. It guarantees the default-category scaffold plus the current UTC month bucket. Non-default categories are outside the automatic bootstrap scope and may be added only after the repository explicitly approves that category and its admission rule, using the same structure contract rather than inferring new categories silently.

## Outputs

- `docs/superpowers/memory/`
- `docs/superpowers/memory/milestone/MEMORY.md`
- `docs/superpowers/memory/milestone/entries/<YYYY-MM>/`
- `docs/superpowers/memory/milestone/entries/<YYYY-MM>/.gitkeep` (if needed)
- `docs/superpowers/memory/debug/MEMORY.md`
- `docs/superpowers/memory/debug/entries/<YYYY-MM>/`
- `docs/superpowers/memory/debug/entries/<YYYY-MM>/.gitkeep` (if needed)
- `docs/superpowers/memory/refactor/MEMORY.md`
- `docs/superpowers/memory/refactor/entries/<YYYY-MM>/`
- `docs/superpowers/memory/refactor/entries/<YYYY-MM>/.gitkeep` (if needed)

## Execution Rules

- Canonical location is `docs/superpowers/memory/`.
- Older pre-memory layouts are legacy-only and not a supported canonical root.
- If a repository still has only the older pre-memory structure, require `memory-bootstrap` or an explicit migration to `docs/superpowers/memory/`; do not treat that layout as a runtime fallback.
- Default categories are `milestone`, `debug`, and `refactor`.
- Automatic bootstrap scope is limited to `milestone`, `debug`, and `refactor`.
- Create missing files/directories only.
- Never overwrite existing `MEMORY.md` or entry files.
- Keep operations idempotent (safe to run repeatedly).
- Do not auto-create non-default categories.
- Non-default categories require explicit repository approval of the category and its admission rule before this skill may create the same structure contract for them.

## Execution Steps

1. Check whether `docs/superpowers/memory/` exists.
2. Create `docs/superpowers/memory/` if missing.
3. For each default category (`milestone`, `debug`, `refactor`):
   - Ensure `docs/superpowers/memory/<category>/` exists.
   - Ensure `docs/superpowers/memory/<category>/MEMORY.md` exists.
   - If `MEMORY.md` is missing, create it from the category-specific template file listed below.
   - Ensure `docs/superpowers/memory/<category>/entries/<YYYY-MM>/` exists for the current UTC month derived from the system clock (`YYYY-MM`).
   - Create `docs/superpowers/memory/<category>/entries/<YYYY-MM>/.gitkeep` if the month folder is empty.

Automatic bootstrap stops after the default categories above. Do not continue by inventing repository-specific categories.

Create the default category files from these exact templates under `template/`:

Use these memory template filenames:

- `milestone` -> `template/milestone-memory-template.md`
- `debug` -> `template/debug-memory-template.md`
- `refactor` -> `template/refactor-memory-template.md`

For the default categories, use these admission rules:

- `milestone`: larger complete changes that form a meaningful feature, architecture adjustment, or workflow closure
- `debug`: complete debugging closures where the problem is identified, fixed, and verified
- `refactor`: larger complete structural improvements that substantially improve code organization, boundaries, or maintainability without centering on new user-facing behavior

Month folders are physical storage buckets only. `docs/superpowers/memory/<category>/MEMORY.md` remains the category-wide global index and is not split per month.

For a non-default category, create the same structure explicitly only after the repository formally adopts that category and defines its admission rule:

- `docs/superpowers/memory/<category>/MEMORY.md`
- `docs/superpowers/memory/<category>/entries/<YYYY-MM>/`
- `docs/superpowers/memory/<category>/entries/<YYYY-MM>/.gitkeep` if needed

For an explicitly approved non-default category, start from `template/category-memory-template.md` and fill in the repository-specific admission rule and notes.

## Error Handling

- If write permission is missing, stop and report the exact path.
- If `docs/superpowers/memory` path is occupied by a file, stop and report conflict.
- If file creation fails, stop and return the failing command and reason.

## Notes

- This skill initializes structure only.
- Recording entries and updating category TOCs belong to `memory-tracker`.
- Automatic support covers only the default categories.
- Additional categories can be added later only when the repository explicitly approves them, by creating the same `MEMORY.md` + `entries/<YYYY-MM>/` structure under `docs/superpowers/memory/`.
