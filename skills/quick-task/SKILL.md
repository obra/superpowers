---
name: quick-task
description: Use when one or more small, decision-complete changes can ship together in one pull request without product shaping.
---

# Quick Task

**Entry:** one or more small, decision-complete requests — the asks themselves are the spec.
**Exit:** the shared delivery path returns merged and cleaned up, or the request is redirected to planning.

## 1. Scope check

Confirm each change has an established owner surface and no unresolved product decision, and that together they need no more than one PR. Several small fixes may share that PR, one task each. Explore only enough to name the owning files and binding repository rules. If any condition fails, use `brainstorming` and `writing-plans`. A quick task may reference an existing tracker ticket but never creates one to mirror a tiny local change.

## 2. Mini-plan

Write a git-ignored plan at `.toolbelt/quick/<slug>-plan.md`: one task per fix in one PR boundary with `Risk` set, using writing-plans' task fields and a `## Risks` section, as in [mini-plan-example.md](mini-plan-example.md). Run `bash ../writing-plans/scripts/plan-check PLAN` and fix what it reports. The plan is scratch; never commit it.

## 3. Deliver

Invoke toolbelt:delivery with the mini-plan's absolute path, so it survives the move into the delivery worktree. Delivery owns the worktree, routing, implementer, review, optional UX gate, PR, merge, and cleanup. Do NOT invoke any other skill.
