---
name: quick-task
description: Use when a small, decision-complete change has one coherent outcome and can ship in one pull request without product shaping.
---

# Quick Task

**Entry:** a small, decision-complete request — the ask itself is the spec.
**Exit:** the shared delivery path returns merged and cleaned up, or the request is redirected to planning.

## 1. Scope check

Confirm the work has one coherent outcome, an established owner surface, no unresolved product decision, and no need for multiple PRs. Explore only enough to name the owning files and binding repository rules. If any condition fails, use `brainstorming` and `writing-plans`. A quick task may reference an existing tracker ticket but never creates one to mirror a tiny local change.

## 2. Mini-plan

Write a git-ignored plan at `.toolbelt/quick/<slug>-plan.md`: one task in one PR boundary with `Risk` set, using writing-plans' task fields and a `## Risks` section, as in [mini-plan-example.md](mini-plan-example.md). Run `bash ../writing-plans/scripts/plan-check PLAN` and fix what it reports. The plan is scratch; never commit it.

## 3. Deliver

Invoke toolbelt:delivery with the mini-plan's absolute path, so it survives the move into the delivery worktree. Delivery owns the worktree, routing, implementer, review, optional UX gate, PR, merge, and cleanup. Do NOT invoke any other skill.
