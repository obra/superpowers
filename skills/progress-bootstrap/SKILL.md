---
name: progress-bootstrap
description: Use when a repository needs category-based progress storage initialized or the canonical docs/superpowers/progress/ structure is missing
---

# progress-bootstrap

## Overview

Initialize project progress memory under `docs/superpowers/progress/`.

This skill sets up a canonical, tool-agnostic structure for progress records organized by category instead of a single global log.

## When to Use

Use this skill when:
- A repository does not have `docs/superpowers/progress/`
- `docs/superpowers/progress/<category>/PROGRESS.md` is missing for a required default category
- `docs/superpowers/progress/<category>/entries/<YYYY-MM>/` is missing for a required default category
- A user explicitly asks to initialize progress tracking

This skill initializes the default categories only. It guarantees the default-category scaffold plus the current UTC month bucket. Non-default categories should only be created after their admission rule is explicitly defined, then they must follow the same structure contract rather than being inferred silently.

## Outputs

- `docs/superpowers/progress/`
- `docs/superpowers/progress/milestone/PROGRESS.md`
- `docs/superpowers/progress/milestone/entries/<YYYY-MM>/`
- `docs/superpowers/progress/milestone/entries/<YYYY-MM>/.gitkeep` (if needed)
- `docs/superpowers/progress/debug/PROGRESS.md`
- `docs/superpowers/progress/debug/entries/<YYYY-MM>/`
- `docs/superpowers/progress/debug/entries/<YYYY-MM>/.gitkeep` (if needed)
- `docs/superpowers/progress/refactor/PROGRESS.md`
- `docs/superpowers/progress/refactor/entries/<YYYY-MM>/`
- `docs/superpowers/progress/refactor/entries/<YYYY-MM>/.gitkeep` (if needed)

## Execution Rules

- Canonical location is `docs/superpowers/progress/`.
- Default categories are `milestone`, `debug`, and `refactor`.
- Default bootstrap scope is limited to `milestone`, `debug`, and `refactor`.
- Create missing files/directories only.
- Never overwrite existing `PROGRESS.md` or entry files.
- Keep operations idempotent (safe to run repeatedly).

## Execution Steps

1. Check whether `docs/superpowers/progress/` exists.
2. Create `docs/superpowers/progress/` if missing.
3. For each default category (`milestone`, `debug`, `refactor`):
   - Ensure `docs/superpowers/progress/<category>/` exists.
   - Ensure `docs/superpowers/progress/<category>/PROGRESS.md` exists.
   - If `PROGRESS.md` is missing, create it from the category-specific template file listed below.
   - Ensure `docs/superpowers/progress/<category>/entries/<YYYY-MM>/` exists for the current UTC month derived from the system clock (`YYYY-MM`).
   - Create `docs/superpowers/progress/<category>/entries/<YYYY-MM>/.gitkeep` if the month folder is empty.

Create the default category files from these exact templates under `template/`:

- `milestone` -> `template/milestone-progress-template.md`
- `debug` -> `template/debug-progress-template.md`
- `refactor` -> `template/refactor-progress-template.md`

For the default categories, use these admission rules:

- `milestone`: larger complete changes that form a meaningful feature, architecture adjustment, or workflow closure
- `debug`: complete debugging closures where the problem is identified, fixed, and verified
- `refactor`: larger complete structural improvements that substantially improve code organization, boundaries, or maintainability without centering on new user-facing behavior

Month folders are physical storage buckets only. `docs/superpowers/progress/<category>/PROGRESS.md` remains the category-wide global index and is not split per month.

For non-default categories, create the same structure explicitly when that category is formally adopted:

- `docs/superpowers/progress/<category>/PROGRESS.md`
- `docs/superpowers/progress/<category>/entries/<YYYY-MM>/`
- `docs/superpowers/progress/<category>/entries/<YYYY-MM>/.gitkeep` if needed

For non-default categories, start from `template/category-progress-template.md` and fill in the repository-specific admission rule and notes.

## Error Handling

- If write permission is missing, stop and report the exact path.
- If `docs/superpowers/progress` path is occupied by a file, stop and report conflict.
- If file creation fails, stop and return the failing command and reason.

## Notes

- This skill initializes structure only.
- Recording entries and updating category TOCs belong to `progress-tracker`.
- Additional categories can be added later by creating the same `PROGRESS.md` + `entries/<YYYY-MM>/` structure under `docs/superpowers/progress/`.
