# Claude Skill Trigger Optimization

**Date**: 2026-05-12

## Goal

Improve Claude Code skill routing quality without regressing Codex.

Primary focus:

- `executing-plans`
- `subagent-driven-development`
- `writing-plans`
- `systematic-debugging`
- `test-driven-development`
- `requesting-code-review`

## Problem Summary

The current Claude baseline is not uniformly bad. It splits into three categories:

### 1. Stable on Claude

- `brainstorming`
- part of `writing-plans`
- part of `systematic-debugging`
- part of `test-driven-development`

These already produce usable outputs and often route correctly.

### 2. Wrong-route but responsive

Claude returns text, but chooses the wrong workflow.

Examples:

- `writing_plans_confusion_002` -> drifted to `brainstorming`
- `executing_plans_strong_002` -> drifted to plan/status triage

This is mostly a routing / boundary problem.

### 3. Silent timeout groups

Claude often returns:

- `exit_code: 143`
- `timed_out: true`
- empty `stdout`

This cluster is concentrated in:

- `executing-plans`
- `subagent-driven-development`
- part of tail `tdd`

This is not a normal routing miss. It is a host/runtime or state-collision problem.

## Working Diagnosis

### A. Description strength is too weak for most skills

`brainstorming` is the only core workflow skill with very strong imperative wording.

Most other skills still use soft "Use when..." phrasing.

On Claude, that likely means:

- `brainstorming` is treated as mandatory
- other workflow skills are treated as optional suggestions

Codex is less affected because its native skill discovery is more proactive.

### B. Execution-oriented skills collide with real repo state

`executing-plans` and `subagent-driven-development` both assume:

- there is an unfinished plan
- the next step is execution

In this repo, the real implementation plan is already mostly complete. Claude sees that and often pivots to:

- asking for the next plan
- asking for scope clarification
- summarizing current state

That means some current failures are not purely wording failures. They are wording plus state collision.

### C. Startup profile is directionally correct but not strong enough

The Claude startup profile already includes boundary rules for all workflow skills.

So the issue is not "missing routing rules".

The issue is more likely:

- descriptions too soft
- execution-oriented skills too dependent on clean plan state
- Claude preferring generic helpfulness over explicit workflow invocation

## Optimization Strategy

Use a three-lane approach instead of one global prompt rewrite.

### Lane 1: Shared description strengthening

Target skills:

- `writing-plans`
- `systematic-debugging`
- `test-driven-development`
- `requesting-code-review`
- `document-management`

Do not start with `executing-plans` or `subagent-driven-development`.

For each target skill:

- replace soft "Use when..." wording with stronger imperative wording
- add one explicit positive trigger sentence
- add one explicit negative boundary sentence

Example pattern:

Current:

`Use when you have a spec or requirements for a multi-step task, before touching code.`

Proposed:

`You MUST use this when the user wants an approved spec or agreed approach turned into a concrete implementation plan before coding begins.`

Boundary:

`Do NOT use this when the approach is still unclear; use brainstorming first.`

Reason:

- this is the cheapest experiment
- low risk to Codex
- directly tests the strongest current hypothesis

### Lane 2: Claude-only startup strengthening

Do not use this first. Use it after the shared description experiment.

If shared description strengthening improves Claude but not enough, then adjust only the Claude startup profile:

- add a short "workflow skills are mandatory routing choices, not optional style suggestions" paragraph
- explicitly say Claude should not directly absorb these workflows as generic behavior
- emphasize execution boundary rules:
  - approved design -> `writing-plans`
  - unfinished existing plan -> `executing-plans`
  - independent tasks in current session -> `subagent-driven-development`

Reason:

- keep the experiment layered
- avoid mixing shared wording changes with host-specific startup changes

### Lane 3: Execution-skill regression harness

Treat `executing-plans` and `subagent-driven-development` as a separate track.

Do not evaluate them only inside the current real repo state.

Create a minimal regression fixture with:

- one unfinished plan document
- one fake active task state
- no confusing completed checkpoint history

Then test:

- explicit skill invocation
- strong natural-language trigger
- confusion-case trigger

Reason:

- current repo state is contaminating these skills
- we need to separate routing failure from state conflict

## Recommended Rollout Order

### Phase 1: Freeze anomaly groups

Temporarily exclude from routing-quality scoring:

- `executing-plans`
- `subagent-driven-development`

Mark them as "host/state-sensitive regression lane".

### Phase 2: Run shared description experiment

Update these skills only:

- `writing-plans`
- `systematic-debugging`
- `test-driven-development`
- `requesting-code-review`
- `document-management`

Then rerun a reduced Claude corpus:

- weak + confusion samples only
- no Codex change yet

Success criterion:

- fewer wrong-route responses
- more direct skill-style opening moves
- no regressions in already-good samples

### Phase 3: If needed, strengthen Claude startup profile

Only if Phase 2 produces partial improvement.

### Phase 4: Separate regression for execution skills

Use clean fixture repo context.

## Concrete Changes To Make

### Change Set A: Description wording

For each target skill:

- start with `You MUST use this when...`
- include 2-3 concrete trigger phrasings
- include 1 explicit non-trigger condition

### Change Set B: Boundary sharpening

Add one-line distinctions:

- `brainstorming` vs `writing-plans`
- `writing-plans` vs `executing-plans`
- `executing-plans` vs `subagent-driven-development`
- `systematic-debugging` vs `test-driven-development`
- `requesting-code-review` vs generic code help

### Change Set C: Claude startup text

Add a short instruction:

`For workflow skills, do not simply perform the behavior generically. First route to the narrowest matching workflow skill, then follow that skill's workflow.`

## Success Metrics

### Primary

- Claude exact rate improves on non-execution workflow skills
- wrong-route count drops

### Secondary

- fewer silent timeout / empty-output cases outside execution groups
- Codex performance remains stable

### Non-goal for first round

- fully fixing `executing-plans` inside the current repo context

## Recommendation

Do not start by rewriting everything.

Start with:

1. shared description strengthening for the non-execution workflow skills
2. reduced Claude rerun
3. separate execution-skill regression fixture

This gives the cleanest signal with the lowest regression risk.
