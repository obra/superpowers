# Claude Skill Trigger Analysis

**Date**: 2026-05-12

## Scope

This document summarizes the Claude Code findings from the skill-trigger evaluation work on branch `codex/skill-compat-review`, based on the completed Round 1 baseline in `tests/skill-trigger/runs/2026-05-11-baseline-v1.yaml`.

## Current Status

- Claude observed cases with explicit outcomes: 48 / 48
- Claude remaining placeholders: 0 / 48
- Current Claude outcome breakdown:
  - `exact`: 21
  - `acceptable`: 3
  - `wrong`: 3
  - `miss`: 21

## Current Usability Update (2026-05-13)

A later Claude-only route-only recovery pass materially changed the practical picture.

- The original `2026-05-11-baseline-v1.yaml` remains the historical Round 1 baseline and should not be reinterpreted as a current usability score.
- Under the corrected official runner, filtered skill-directory injection, stronger first-response rules, and tightened startup disambiguation, the previously problematic `wrong` / `miss` samples were rerun as route-only prompts.
- In that route-only recovery pass, the 24 targeted Claude samples all produced a usable first routing response:
  - `writing-plans`
  - `executing-plans`
  - `subagent-driven-development`
  - `systematic-debugging`
  - `test-driven-development`
  - `requesting-code-review`
  - `document-management`

Working interpretation:

- Claude Code has now reached a usable state for skill-trigger routing when evaluated as "first routing response only".
- The remaining instability is better described as Claude CLI host flake in some batch runs, not as a broad routing blind spot.
- For future comparisons, keep two lenses separate:
  - historical baseline behavior
  - current route-only trigger usability

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

## Reduced Corpus Follow-Up

### Shared-description experiment result

A reduced 10-sample Claude-only corpus was run after strengthening the shared skill descriptions.

Observed:

- `writing-plans`
  - `weak` sample routed correctly and produced an explicit planning response
  - `confusion` sample timed out with empty stdout
- `systematic-debugging`
  - `weak` sample routed correctly and asked for symptoms/details first
  - `confusion` sample timed out with empty stdout
- `test-driven-development`
  - both `weak` and `confusion` samples timed out with empty stdout
- `requesting-code-review`
  - `weak` sample timed out with empty stdout
  - `confusion` sample routed correctly and produced a review-style critique
- `document-management`
  - `weak` sample routed correctly and produced a doc-search response
  - `confusion` sample did not complete cleanly in the batch and was left for a single-case retry, which also stalled

### Interpretation of the reduced corpus

- Shared description strengthening helped the clearer `writing-plans`, `systematic-debugging`, `requesting-code-review`, and `document-management` prompts.
- `test-driven-development` is still unstable on Claude, even after wording strengthening.
- Confusion prompts remain the most timeout-prone class, so the next layer to tune is still likely host/startup guidance rather than more shared description edits.

### Startup-strengthening follow-up

After adding a short mandatory-routing paragraph to `tests/skill-trigger/claude/startup-v1.md` and tightening `test-driven-development` trigger phrasing, a second focused verification round showed:

- `writing-plans`
  - `weak` sample: still routed correctly
  - `confusion` sample: improved from timeout to a usable planning response
- `systematic-debugging`
  - `weak` sample: still routed correctly
  - `confusion` sample: still timed out / empty stdout, including single-case rerun
- `test-driven-development`
  - both `weak` and `confusion` samples: still timed out / empty stdout
- `requesting-code-review`
  - results were unstable across batch vs single-case runs; one batch run produced a usable review-style response for a confusion sample, but single-case rerun stalled
- `document-management`
  - `weak` sample: still routed correctly
  - `confusion` sample: still timed out / empty stdout

Interpretation:

- The startup guidance helped `writing-plans` confusion routing materially.
- It did not resolve `systematic-debugging` confusion, `test-driven-development`, or `document-management` confusion stalls.
- `requesting-code-review` remains partly host-unstable, so it should not be treated as fully fixed yet.

### Startup-injected single-case verification

The earlier reduced-corpus harness did not explicitly inject `tests/skill-trigger/claude/startup-v1.md` into the Claude CLI invocation. A follow-up single-case runner was added to test the startup profile directly.

Observed with explicit startup injection:

- `systematic_debugging_confusion_002`
  - recovered from prior timeout / empty stdout in the ad hoc single-case runner
  - but still timed out with empty stdout/stderr under the corrected official queue runner, even in a serial rerun with `startup_profile_loaded: true`
- `tdd_weak_002`
  - recovered from prior timeout / empty stdout
  - under the corrected official queue runner, also produced a stable `test-driven-development` style opening with `startup_profile_loaded: true`
- `tdd_confusion_002`
  - produced a short TDD-style response in the ad hoc single-case runner
  - but still timed out with empty stdout/stderr under the corrected official queue runner serial rerun
- `code_review_weak_002`
  - still hung with no stdout or stderr written to disk, even when using Claude CLI's native `--append-system-prompt`
  - after the harness fix, the same sample still timed out under the official queue runner with `startup_profile_loaded: true`, `SKILL_TRIGGER_CLAUDE_BARE=true`, and `--plugin-dir /Users/zego/Zego/horspowers`
- `document_management_confusion_002`
  - timed out with empty stdout/stderr in both the corrected official queue runner and the ad hoc single-case runner

Interpretation:

- at least part of the earlier `TDD` startup-strengthening result was masked by harness fidelity rather than pure routing failure
- `systematic_debugging_confusion_002` remains inconsistent between the ad hoc single-case runner and the corrected official queue runner, so it is not yet a confirmed fix
- `tdd_confusion_002` also remains inconsistent between the ad hoc single-case runner and the corrected official queue runner, so it is not yet a confirmed fix
- the Claude startup profile is materially useful when it is actually injected into the host
- `requesting-code-review` still shows a lower-level host/runtime anomaly on at least one weak sample, so it should now be treated as a confirmed runtime anomaly rather than a simple miss-route
- `document-management` confusion currently looks like a stable runtime anomaly rather than a mere routing miss

### Harness fidelity correction

The root measurement bug is now identified: `tests/skill-trigger/run_queue_batch.rb` and `tests/skill-trigger/run_full_baseline.rb` previously recorded `startup_profile` paths in YAML metadata but did not load those profiles into Claude or Codex invocations.

Consequences:

- previous "startup-strengthening" observations were directionally useful but not fully attributable
- any host-specific startup experiment run before this harness fix should be treated as provisional
- future Claude/Codex comparisons must use the corrected harness or an explicitly documented single-case runner

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

### 4. Clean fixture reduced the state variable, but not the host/runtime anomaly

An isolated execution-lane fixture was created with:

- one unfinished plan
- no completed checkpoint history
- minimal docs configuration

Early execution-lane runs showed that `executing-plans` and `subagent-driven-development` samples still produced empty stdout in Claude even inside the clean fixture.

Interpretation:

- repository-state pollution is real, but it is not the whole explanation
- there is still a lower-level Claude CLI / host runtime failure mode for execution-oriented prompts
- execution-oriented skills should remain in a dedicated anomaly lane rather than being tuned through shared descriptions

## Working Classification For Remaining Claude Placeholders

### Bucket 1: treat as host anomaly / deferred regression

Round 1 now classifies these without further reruns:

- all `executing_plans_*`
- all `subagent_dev_*`

These should move to a dedicated Claude regression track with host-focused investigation.

### Bucket 2: completed late in Round 1

Resolved from captured stdout:

- `tdd_weak_002`
- `tdd_confusion_002`

Both now have explicit TDD-style outputs and no longer need reruns.

## Next Optimization Steps

### Step 1: freeze current findings

- Keep current baseline as the Round 1 Claude reference
- Mark `executing-plans` and `subagent-driven-development` as deferred anomaly groups

### Step 1 update (2026-05-13 evening)

- The anomaly-group classification is no longer the best current summary for route-only trigger evaluation.
- Execution-lane prompts were recovered after:
  - stronger `executing-plans` and `subagent-driven-development` descriptions
  - explicit first-response rules in those two skill bodies
  - startup-level wording that distinguishes checkpointed execution from continuous in-session task flow
- The remaining recommendation is not "keep classifying execution lane as broken", but:
  - treat route-only trigger routing as usable
  - keep monitoring batch-level Claude flake separately from routing correctness

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

1. freeze `executing-plans` and `subagent-driven-development` as anomaly groups
2. use the completed Round 1 baseline as the frozen reference
3. treat `test-driven-development` as the next shared-description candidate for deeper host/startup inspection
4. investigate execution-oriented skills separately in a cleaner repo context
