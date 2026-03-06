# Token-Lean Agents & Skills Design

**Date:** 2026-03-06
**Status:** Approved
**Approach:** Hybrid A+B — Confidence-threshold skill loading + tiered review protocol

---

## Goal

Reduce token consumption across agents and skills without meaningful quality regression, by targeting the two highest-cost behaviors: unnecessary skill loading and flat-rate 3-agent review per task.

## Drivers

- API cost reduction
- Faster response latency
- Context window headroom in long sessions

## Scope

Two changes to two skill files. No new files. No changes to plan format, worktree workflow, or writing-plans.

---

## Change 1: Skill Loading — Confidence Threshold

**File:** `skills/using-superpowers/SKILL.md`

### Problem

The current 1% trigger rule causes Claude to invoke the Skill tool speculatively, loading multi-KB skill files into context for tasks that only tangentially touch a skill's domain. At scale across a session, this adds significant unnecessary input tokens.

### Solution

Replace the "even 1% chance" trigger with a **>50% confidence threshold**.

The new heuristic:

> Load a skill when the task **clearly or probably** maps to that skill — not just possibly.

**Wording change (The Rule section):**

Before:
> Invoke relevant or requested skills BEFORE any response or action. Even a 1% chance a skill might apply means that you should invoke the skill to check.

After:
> Invoke relevant or requested skills BEFORE any response or action. Load a skill when you are more likely than not that it applies — when the task clearly or probably maps to a named skill, not just tangentially.

**Red Flags table:** Keep existing entries. Remove the entry `"This doesn't need a formal skill" | "If a skill exists, use it."` — it's inconsistent with the new threshold. Replace with:

> `"It probably applies" | "Probably = load it. Tangentially = skip it."`

### Token impact

Skills like `systematic-debugging` (~2K tokens), `subagent-driven-development` (~3K tokens), and `brainstorming` (~3K tokens) stop loading for tasks that merely mention debugging, agents, or planning in passing.

### Risk

A relevant skill might be missed. Mitigation: the Red Flags table still prevents rationalization, and users can always invoke skills explicitly.

---

## Change 2: Tiered Review Protocol in SDD

**Files:**
- `skills/subagent-driven-development/SKILL.md`
- `skills/subagent-driven-development/implementer-prompt.md`

### Problem

Every SDD task currently runs the full 3-agent pipeline: implementer → spec reviewer → code quality reviewer. For simple, pattern-following tasks (e.g., "add one test following existing pattern"), the two reviewer invocations are often redundant — they confirm what was obvious from the plan.

### Solution

Add a **Task Classification** step where the controller assigns each task a tier before dispatch. Tier determines which reviews run.

#### Tiers

| Tier | Signals | Review pipeline |
|------|---------|-----------------|
| **Simple** | ≤2 files touched, follows existing pattern explicitly, no new abstraction, pure addition | Implementer self-review only |
| **Standard** | 3–5 files, new feature with clear spec, no new abstractions | Implementer + spec reviewer |
| **Complex** | New abstractions, cross-cutting concerns, >5 files, architectural change, ambiguous spec | Full: implementer + spec reviewer + quality reviewer |

#### Classification rules

- Tier is assigned by the **controller** (main session agent), not the subagent.
- Default to **Standard** when uncertain — never round down.
- Tier is declared in the task context passed to the implementer: `**Review tier: Simple / Standard / Complex**`
- Controller may escalate tier mid-task if implementer report reveals hidden complexity.

#### Process flow change

Add a "Classify task" step between "Read plan" and "Dispatch implementer subagent." The existing per-task loop branches based on tier:

```
Classify task tier
    |
    +-- Simple  --> Dispatch implementer --> Self-review --> Mark complete
    |
    +-- Standard --> Dispatch implementer --> Spec reviewer --> Mark complete
    |
    +-- Complex --> Dispatch implementer --> Spec reviewer --> Quality reviewer --> Mark complete
```

#### Implementer prompt update

Add to the task context block in `implementer-prompt.md`:

```
**Review tier:** [Simple / Standard / Complex]

[Simple: Your self-review IS the review. Be thorough.]
[Standard: A spec reviewer will check your work after.]
[Complex: Both a spec reviewer and a quality reviewer will check your work.]
```

### Token impact

On a representative 5-task plan with 2 Simple + 2 Standard + 1 Complex:
- Current: 15 agent invocations (3 per task)
- New: 9 agent invocations (1 + 1 + 2 + 2 + 3)
- Savings: ~40% fewer subagent calls on that plan

### Risk

Misclassifying a Simple task that has hidden complexity. Mitigation:
- Default is Standard, never Simple — Simple must be earned by meeting all signals
- Implementer self-review is still required for Simple tasks
- Controller can escalate after reading implementer report

---

## What This Does NOT Change

- `writing-plans` skill — plan format unchanged
- `executing-plans` skill — no review pipeline there
- `dispatching-parallel-agents` — unrelated
- Lean context (from 2025-11 feedback) — still optional, not addressed here
- Skill file verbosity — not in scope

---

## Success Metrics

- Fewer Skill tool calls per session (visible in `rtk gain` output)
- Fewer subagent invocations on plans with routine tasks
- No regression in spec-gap bugs reaching production

---

## Implementation Plan

See implementation plan file (to be created by writing-plans skill).

**Commit 1:** Update `skills/using-superpowers/SKILL.md` (confidence threshold)
**Commit 2:** Update `skills/subagent-driven-development/SKILL.md` + `implementer-prompt.md` (tiered reviews)
