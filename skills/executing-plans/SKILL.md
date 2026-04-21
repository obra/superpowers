---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

Load plan, review critically, execute in sprint mode, report when done.

**Note:** If subagents are available, prefer `superpowers:subagent-driven-development` — it ships higher-quality output on platforms that support it.

## Process

### 1. Load & Review

Read plan. If concerns (gaps, unclear steps, wrong approach), raise with the user before starting. Otherwise create TodoWrite and proceed.

### 2. Execute (Sprint Mode)

One plan = one sprint. Ceremony at boundaries + critical checkpoints, not between every step. See `using-superpowers` § Sprint Mode.

**Sprint entry (once):**
- Acknowledge the Golden Rule (`using-superpowers` § The Golden Rule)
- Confirm risk tier (default standard; critical if any task touches a Non-Negotiable — see `using-superpowers` § Non-Negotiables)
- For standard/critical, skim the plan once for scope surprises

**Per task:**
- Mark in_progress, follow steps exactly, run only the verifications the plan names, mark completed.

**Batch checkpoints (every 3-5 tasks, or at plan-indicated batch boundaries):**
- Run batch-level verification if the plan specifies; otherwise a light self-check.
- Light self-review for critical tier; skip for trivial/standard unless something feels off.
- No per-task code reviews.

**Sprint exit (once):** → Step 3.

### 3. Finish

`superpowers:finishing-a-development-branch` — verify tests, present options, execute choice.

## When to Stop

Blocker, critical gap, unclear instruction, verification fails repeatedly → stop and ask rather than guess.

If the partner updates the plan based on your feedback, return to Step 1.

Never start implementation on main/master without explicit consent.

## Integration

- `superpowers:using-git-worktrees` — isolated workspace before starting (REQUIRED)
- `superpowers:writing-plans` — creates the plan
- `superpowers:finishing-a-development-branch` — sprint exit
