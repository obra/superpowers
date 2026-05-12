# Claude Skill Trigger Analysis

**Date**: 2026-05-12

## Scope

This document summarizes the current Claude Code findings from the skill-trigger evaluation work on branch `codex/skill-compat-review`, based on the partially completed baseline in `tests/skill-trigger/runs/2026-05-11-baseline-v1.yaml`.

## Current Status

- Claude observed cases with explicit outcomes: 35 / 48
- Claude remaining placeholders: 13 / 48
- Current Claude outcome breakdown:
  - `exact`: 19
  - `acceptable`: 3
  - `wrong`: 3
  - `miss`: 10

## What Is Stable

Claude can route correctly for these categories often enough that the main issue is not "skills are entirely broken":

- `brainstorming`
  - Strongest-performing group on Claude
  - Consistent with the fact that this skill uses unusually strong description wording (`MUST`)
- `writing-plans`
  - Mixed but functional
  - Claude can enter plan-writing mode when the request is explicit enough
- `systematic-debugging`
  - At least some prompts return the expected "ask for concrete symptoms first" behavior
- `requesting-code-review`
  - Claude can produce proper review-style findings when the prompt clearly asks for pre-ship review
- `test-driven-development`
  - At least some prompts return explicit TDD framing
- `document-management`
  - Archive / cleanup oriented prompts can route correctly when the action is operationally concrete

## What Is Not Stable

### Group A: Host/CLI anomaly candidates

These groups repeatedly ended with:

- `exit_code: 143`
- `timed_out: true`
- empty `stdout`

Observed repeatedly even after reducing batch size and isolating cases.

Affected prompts:

- `executing_plans_*`
- most `subagent_dev_*`
- some tail `tdd_*`
- one `systematic_debugging_confusion_*`

This pattern is different from a normal wrong-route response. It means Claude often produced no usable content at all.

### Group B: Wrong-route but with usable text

These are more actionable because Claude did respond, but chose the wrong workflow:

- `writing_plans_confusion_002`
  - Routed into `brainstorming`
- `executing_plans_strong_002`
  - Routed into plan/status triage rather than execution with checkpoints
- `systematic_debugging_confusion_002`
  - Returned a general analysis memo instead of entering the debugging workflow

These are routing/description/startup-guidance problems, not host silence problems.

## Interpretation

### 1. Brainstorming is advantaged by stronger description wording

`brainstorming` is the only core workflow skill whose description uses hard language like "You MUST use this...".

Most other skills use soft "Use when..." wording.

This strongly correlates with Claude behavior:

- Claude reliably respects `brainstorming`
- Claude is much less reliable on the softer workflow skills

### 2. The startup profile is directionally correct but insufficient

`tests/skill-trigger/claude/startup-v1.md` already includes explicit boundary rules for:

- `brainstorming`
- `writing-plans`
- `executing-plans`
- `subagent-driven-development`
- `systematic-debugging`
- `test-driven-development`
- `requesting-code-review`
- `document-management`

This means the current problem is not simply "no boundary rules exist".

Likely outcomes:

- for `writing-plans`, the startup profile is sometimes enough
- for `executing-plans`, it is not enough to overcome the host/runtime failure mode
- for `subagent-driven-development`, the startup profile is not enough to overcome context drift

### 3. Current repository state interferes with execution-oriented prompts

The explicit `subagent-driven-development` diagnostic prompt returned a coherent answer, but it first checked whether the existing plan had already been completed.

That is a key clue: in this repository, Claude sees a real implementation plan whose tasks are already largely complete. So execution-oriented prompts can conflict with actual repo state.

This affects:

- `executing-plans`
- `subagent-driven-development`

It does not affect abstract skills like:

- `brainstorming`
- `writing-plans`
- `systematic-debugging`
- `test-driven-development`

So part of Claude's poor performance here is not pure routing failure; it is routing plus state collision.

## Working Classification For Remaining Claude Placeholders

### Bucket 1: treat as host anomaly / deferred regression

Do not spend more baseline time forcing these in the current round:

- all remaining `executing_plans_*`
- all remaining `subagent_dev_*`

These should move to a dedicated Claude regression track with host-focused investigation.

### Bucket 2: continue baseline completion

Still worth finishing in this round:

- `tdd_weak_002`
- `tdd_confusion_002`

These still have a reasonable chance of yielding useful text without changing the environment.

## Next Optimization Steps

### Step 1: freeze current findings

- Keep current baseline as the Round 1 Claude reference
- Mark `executing-plans` and `subagent-driven-development` as deferred anomaly groups

### Step 2: run a description-strength experiment

Priority target skills:

- `writing-plans`
- `systematic-debugging`
- `test-driven-development`
- `requesting-code-review`
- `document-management`

Change pattern:

- replace soft `Use when...` with stronger imperative wording
- add one sentence of explicit negative boundary where needed
- keep startup profile unchanged for this experiment

Purpose:

- isolate whether description strength alone materially improves Claude routing

### Step 3: keep `executing-plans` out of the wording experiment

Do not use `executing-plans` as evidence for description tuning yet.

Reason:

- it currently looks like a runtime/host-output anomaly, not just weak wording

It needs its own focused regression test:

- explicit skill invocation
- simpler repository context
- maybe `--output-format json`
- maybe a minimal sandbox repo with an unfinished plan

### Step 4: create a reduced Claude regression corpus

Build a small follow-up set with:

- 2 `executing-plans` prompts
- 2 `subagent-driven-development` prompts
- 2 control prompts from stable skills

Use that to answer one question cleanly:

- is the failure caused by wording, startup guidance, or repo-state collision?

## Practical Conclusion

For Claude optimization, the best next move is not another broad baseline sweep.

The best next move is:

1. finish the few remaining non-execution/non-subagent samples
2. freeze `executing-plans` and `subagent-driven-development` as anomaly groups
3. run a description-strength A/B experiment on the softer but otherwise healthy skill groups
4. investigate execution-oriented skills separately in a cleaner repo context
