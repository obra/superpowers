---
name: progress-bootstrap
description: Use when a project needs progress memory initialized or .progress structure is missing - creates the canonical .progress layout safely and idempotently
---

# progress-bootstrap

## Overview

Initialize project progress memory at `.progress/`.

This skill sets up a canonical, tool-agnostic structure for implementation history and lessons learned.

## When to Use

Use this skill when:
- A repository does not have `.progress/`
- `.progress/PROGRESS.md` is missing
- `.progress/entries/<YYYY>/` is missing
- A user explicitly asks to initialize progress tracking

## Outputs

- `.progress/PROGRESS.md`
- `.progress/entries/<YYYY>/`
- `.progress/entries/<YYYY>/.gitkeep` (if needed)

## Execution Rules

- Canonical location is `.progress/`.
- Do not use `.agents/`.
- Create missing files/directories only.
- Never overwrite existing `PROGRESS.md` or entry files.
- Keep operations idempotent (safe to run repeatedly).

## Execution Steps

1. Check whether `.progress/` exists.
2. Create `.progress/` if missing.
3. Check whether `.progress/PROGRESS.md` exists.
4. If missing, create `.progress/PROGRESS.md` with:
   - Entry Template section
   - Global TOC section with header:

```markdown
| Page ID | Date | Title | Path | Keywords |
| --- | --- | --- | --- | --- |
```

5. Ensure `.progress/entries/<YYYY>/` exists for current year.
6. Create `.progress/entries/<YYYY>/.gitkeep` if the year folder is empty.

## Error Handling

- If write permission is missing, stop and report the exact path.
- If `.progress` path is occupied by a file, stop and report conflict.
- If file creation fails, stop and return the failing command and reason.

## Notes

- This skill initializes structure only.
- Daily recording and TOC updates belong to `progress-tracker`.
