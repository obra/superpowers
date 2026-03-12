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
4. If missing, create `.progress/PROGRESS.md` with the complete file content below.
   Do not replace it with section names, summaries, or alternate headings.
   Preserve the line order and blank lines exactly as shown, using LF line endings and a trailing newline.

~~~text
## Entry Template

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

## Global TOC

| Page ID | Date | Title | Path | Keywords |
| --- | --- | --- | --- | --- |
~~~

5. Ensure `.progress/entries/<YYYY>/` exists for the UTC year derived from the current system clock (`new Date().getUTCFullYear()`); in CI or distributed runs, every agent must use that same UTC-based year so `YYYY` resolves consistently.
6. Create `.progress/entries/<YYYY>/.gitkeep` if the year folder is empty.

## Error Handling

- If write permission is missing, stop and report the exact path.
- If `.progress` path is occupied by a file, stop and report conflict.
- If file creation fails, stop and return the failing command and reason.

## Notes

- This skill initializes structure only.
- Daily recording and TOC updates belong to `progress-tracker`.
