---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements
---

# Requesting Code Review

Dispatch `superpowers:code-reviewer` subagent. Give it curated context (diff, plan/requirements, SHAs) — never your session's history. Keeps the review focused and your context clean.

## When to Request

**Mandatory:**
- At the end of each batch (3-5 tasks) in subagent-driven development
- After completing a major feature
- Before merge to main
- Sprint/plan exit (final global review)

**Opt-in per task:**
- Risk tier critical (see `using-superpowers` § Risk Tiers / Non-Negotiables)
- Blocked on a complex bug, want a fresh perspective mid-batch
- Task touches a non-negotiable — early check

**Skip:**
- Trivial tier (typo, copy, config one-liner) — self-check
- Intermediate commits inside a batch the batch review will catch
- Refactor already covered by the current batch's reviewer pass

## How

```bash
BASE_SHA=$(git rev-parse HEAD~N)   # or origin/main, or batch-start SHA
HEAD_SHA=$(git rev-parse HEAD)
```

Dispatch with `superpowers:code-reviewer` type, filling the template at `code-reviewer.md` (placeholders: `WHAT_WAS_IMPLEMENTED`, `PLAN_OR_REQUIREMENTS`, `BASE_SHA`, `HEAD_SHA`, `DESCRIPTION`).

Act on feedback:
- Critical → fix now
- Important → fix before proceeding
- Minor → note for later
- Reviewer wrong → push back with technical reasoning and evidence

## Integration

- **Subagent-driven dev:** review per batch (3-5 tasks), per-task only if critical or blocked; final global review before `finishing-a-development-branch`
- **Executing plans:** review at batch checkpoints and sprint exit
- **Ad-hoc:** review before merge, or when stuck

Template: `requesting-code-review/code-reviewer.md`.
