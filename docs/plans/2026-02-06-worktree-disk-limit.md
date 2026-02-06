# Worktree Disk Limit Enforcement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update all worktree-related skills and references to enforce the 1GiB hard limit, mandatory cleanup, and “no data in worktrees” policy.

**Architecture:** Treat policy as a hard guardrail in `using-git-worktrees` (both superpowers + personal), then propagate explicit reminders into all upstream/downstream skills and examples that reference worktrees. Align cleanup behavior across `finishing-a-development-branch` and references so no option preserves worktrees.

**Tech Stack:** Markdown skills docs; shell command snippets (git/du).

**Constraints:** Do not create new linked worktrees during this change. Avoid deleting any existing user worktrees. All edits are in-place.

### Task 1: Baseline (RED) scenarios for skills TDD

**Files:**
- Create: `/home/gnx/.codex_acc1/superpowers/docs/plans/2026-02-06-worktree-disk-limit-baseline.md`

**Step 1: Write 3 pressure scenarios**
Create prompts that combine time pressure + large artifact + cleanup avoidance.

**Step 2: Run baseline with subagents (no new policy)**
Run each scenario and capture verbatim outputs in the baseline file.

**Step 3: Summarize rationalizations**
Add a short “Failure Patterns” section.

### Task 2: Update `using-git-worktrees` (superpowers)

**Files:**
- Modify: `/home/gnx/.codex_acc1/superpowers/skills/using-git-worktrees/SKILL.md`

**Step 1: Add hard policy section**
Include: 1GiB limit, 1 linked worktree rule, must delete all linked worktrees at end, no data storage.

**Step 2: Insert pre-create checklist**
Add `git worktree list --porcelain` + “if any linked worktree exists, remove via cleanup flow”.

**Step 3: Insert runtime size checks**
Add `du -sm` checks and clean/remove flow when >1024MB.

**Step 4: Add cleanup flow**
Add full command sequence (remove, prune, verify, delete `.worktrees`).

**Step 5: Update Quick Reference / Red Flags / Common Mistakes**
Reflect new policy and remove any “keep worktree” guidance.

### Task 3: Update `using-git-worktrees` (personal)

**Files:**
- Modify: `/home/gnx/.codex_acc1/skills/devtools/using-git-worktrees/SKILL.md`
- Modify: `/home/gnx/.codex_acc1/skills/devtools/using-git-worktrees/references/examples.md`

**Step 1: Mirror policy + cleanup flow**
Add same policy, pre-create checks, runtime checks, and cleanup flow.

**Step 2: Update examples**
Add size check and end-of-task deletion sequence.

### Task 4: Update upstream/downstream skills referencing worktrees

**Files:**
- Modify: `/home/gnx/.codex_acc1/superpowers/skills/brainstorming/SKILL.md`
- Modify: `/home/gnx/.codex_acc1/superpowers/skills/executing-plans/SKILL.md`
- Modify: `/home/gnx/.codex_acc1/superpowers/skills/subagent-driven-development/SKILL.md`
- Modify: `/home/gnx/.codex_acc1/superpowers/skills/finishing-a-development-branch/SKILL.md`
- Modify: `/home/gnx/.codex_acc1/skills/devtools/finishing-a-development-branch/SKILL.md`
- Modify: `/home/gnx/.codex_acc1/skills/devtools/finishing-a-development-branch/references/examples.md`

**Step 1: Add explicit policy reminders**
Add one-line requirements referencing 1GiB limit + mandatory cleanup.

**Step 2: Remove “keep worktree” paths**
Ensure all options mandate cleanup and `.worktrees` deletion.

### Task 5: GREEN verification (skill TDD)

**Files:**
- Modify: `/home/gnx/.codex_acc1/superpowers/docs/plans/2026-02-06-worktree-disk-limit-baseline.md`

**Step 1: Re-run scenarios with updated skills**
Capture outputs and confirm compliance.

**Step 2: Add “Compliant Evidence” section**
Note where behavior changed vs baseline.

### Task 6: REFACTOR / Tighten

**Files:**
- Modify: updated skill files if new rationalizations discovered.

**Step 1: Add explicit counters**
Add red flags and rationalization table in `using-git-worktrees` (both).

**Step 2: Quick scan for consistency**
Ensure all mentions align with new policy.

