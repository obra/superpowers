# Upstream Parity Hardening Design

Date: 2026-04-04
Status: Draft for review

## Goal

Restore the core execution workflow to upstream Superpowers semantics as closely as Codex actually allows, while strengthening validation so the fork can prove both:

1. upstream workflow parity for the core execution path
2. real Codex executability for the current checkout

This task is not about undoing the Codex-only fork. It is about removing unnecessary workflow drift and replacing weak proof with explicit parity and executability checks.

## Problem Statement

The repository currently has two distinct problems.

### 1. Over-adapted workflow semantics

`subagent-driven-development` was changed beyond what Codex requires:

- the coordinator now owns the canonical workspace as a core workflow rule
- review fixes default to spawning fresh fix agents
- the implementer prompt forbids handoff/checkpoint commits

Those choices are not required by Codex itself. Codex supports reusing the same worker through follow-up agent messaging, so the upstream loop of:

- implementer works
- reviewer finds issues
- same implementer fixes
- reviewer re-reviews

is still possible.

The current skill therefore changes workflow semantics, not just tool names.

### 2. Validation is weaker than the drift it tries to guard

The current Codex test suite proves useful things:

- the active surface is Codex-only
- the current checkout can be loaded by `codex exec`
- some workflow phrases are present or absent

But it still does not clearly separate:

- "this is runnable in Codex"
- "this preserves upstream workflow semantics"

As a result, the suite can go green while meaningful parity drift remains in the core skills.

## Design Constraints

- Preserve the Codex-only product identity.
- Preserve the upstream workflow philosophy and wording wherever Codex does not force a change.
- Only translate mechanics that are genuinely incompatible with Codex.
- Keep Codex-native execution viable in the current tool model.
- Do not broaden this task into installation changes.
- Do not broaden this task into whole-repository text restoration.

## Non-Goals

- Reverting the repository back to a multi-platform project
- Restoring Claude-specific terminology, files, or plugin surfaces
- Rewriting unrelated skills such as `using-superpowers` or `writing-skills` back to upstream wording
- Adding a full long-running behavioral eval harness in this task
- Solving native Windows runtime automation in this task

## Success Criteria

This task succeeds when all of the following are true:

1. `subagent-driven-development` once again describes the upstream execution loop as the default behavior.
2. The same implementer is the default reviewer-fix path unless a new worker is explicitly needed for escalation.
3. Coordinator-owned canonical-state language is reduced to minimal Codex execution guidance rather than treated as the workflow's defining principle.
4. The implementer prompt once again expects implementation, testing, verification, commit, self-review, and report-back in that order.
5. Validation distinguishes Codex executability from upstream parity instead of collapsing them into one green status.
6. The full suite can still prove the current checkout loads correctly in Codex.

## Decision Summary

Adopt a two-layer restoration model:

1. Restore upstream text and flow for the core execution workflow as closely as possible.
2. Apply only minimal Codex translations where the original mechanics are not directly expressible.
3. Add explicit parity checks for the restored workflow semantics.
4. Keep the existing Codex runtime smoke path as the executability proof.

## Options Considered

### Option A: Keep the current Codex-native rewrite and only document the drift

Leave `subagent-driven-development` as coordinator-owned and fresh-fix-agent-first, then merely explain that this is the Codex version.

Rejected because:

- it preserves unnecessary semantic drift
- it fails the stated goal of keeping upstream flow intact
- Codex does not actually require these specific workflow changes

### Option B: Restore upstream semantics with minimal Codex translation

Restore upstream wording and flow wherever possible, but translate only the mechanics Codex needs:

- `TodoWrite` -> `update_plan`
- Task-tool phrasing -> `spawn_agent`
- same implementer follow-up -> `send_input` or `resume_agent` when needed

Accepted because:

- it preserves upstream behavior rather than just tone
- it remains executable in Codex
- it gives validation a clear target

### Option C: Fresh-agent model as default, same-implementer as optional note

Keep the current fresh-fix-agent pattern as the default and mention same-agent reuse as an alternative.

Rejected because:

- it reverses the priority the user explicitly chose
- it still treats the Codex adaptation as more important than upstream parity
- it would continue to encode workflow drift in the main skill body

## Detailed Design

### 1. Restore upstream `subagent-driven-development` semantics

The default workflow should once again read as:

1. dispatch implementer
2. implementer asks questions if needed
3. implementer implements, tests, commits, self-reviews, reports
4. dispatch spec reviewer
5. if spec issues exist, the same implementer fixes them
6. re-run spec review
7. dispatch code quality reviewer
8. if quality issues exist, the same implementer fixes them
9. re-run quality review
10. mark task complete

The following current ideas should be removed from the core flowchart, example, and red flags as default behavior:

- fresh fix agent as the standard response to review findings
- coordinator-owned canonical workspace as the core organizing principle
- coordinator-created checkpoint commits as a default review gate

### 2. Keep only the minimal Codex execution translations

Some upstream wording cannot be copied literally because the current fork is intentionally Codex-only.

Those translations should be limited to:

- `TodoWrite` -> `update_plan`
- generic Task-tool instructions -> `spawn_agent`
- "same implementer fixes it" -> send follow-up instructions to the same worker thread with `send_input`
- if that worker is no longer active, allow `resume_agent`

Important rule:

- same-implementer follow-up is the default
- fresh fix agent is allowed only as an escalation path when the original worker is unavailable, stale, or clearly blocked

That keeps the meaning of the upstream workflow while still fitting the Codex tool model.

### 3. Re-scope coordinator responsibilities

The coordinator should still exist, but with a smaller job than the current skill gives it.

Coordinator responsibilities after this task:

- read the plan and dispatch workers
- answer worker questions
- maintain `update_plan`
- dispatch reviewers
- send reviewer findings back to the same implementer by default
- manage commits and diffs only to the extent required for the current Codex session

Coordinator responsibilities that should no longer be treated as defining workflow semantics:

- owning the canonical workspace as the primary principle of the skill
- re-integrating all worker changes as a mandatory step before review
- spawning fresh fix agents as the standard review loop

If Codex needs temporary coordination glue for review, that should appear as implementation detail, not as the main workflow identity.

### 4. Restore prompt-template behavior

#### `implementer-prompt.md`

Restore the upstream job sequence:

1. implement exactly the task
2. write tests
3. verify implementation works
4. commit work
5. self-review
6. report back

Restore upstream escalation and self-review discipline wherever possible.

Remove or demote:

- "coordinator owns the canonical workspace"
- "do not make handoff or checkpoint commits"
- "fix findings only against canonical context"

Add only the minimal Codex-safe note that follow-up review fixes may be delivered through a later message to the same worker.

#### `spec-reviewer-prompt.md`

Keep the upstream distrust posture:

- do not trust the implementer report
- inspect code directly
- compare requirements line by line
- flag missing and extra work explicitly

This reviewer should validate the implementation itself, not a coordinator summary.

#### `code-quality-reviewer-prompt.md`

Restore upstream structure:

- review happens only after spec compliance passes
- review is based on the task diff and requirements
- output remains findings-oriented

Codex-only changes should be limited to how the reviewer is invoked, not to what it reviews for.

### 5. Reframe validation into two explicit proof layers

Validation should no longer read as one generic "Codex-only green suite."
It should be structured as two proofs.

#### Layer A: Codex executability

Purpose:

- prove the current checkout actually loads in Codex

Checks:

- current `AGENTS.md` is loaded
- current `skills/using-superpowers/SKILL.md` is loaded
- current checkout can be surfaced through isolated `codex exec`

This layer is already partly present through `test-runtime-smoke.sh` and should remain.

#### Layer B: Upstream workflow parity

Purpose:

- prove the core execution workflow still means what upstream means

Checks should enforce invariants such as:

- `subagent-driven-development` describes same-implementer fix loops
- `fresh fix agent` is not the default workflow language
- `implement, test, verify, commit, self-review, report back` remains in the implementer prompt
- spec review happens before code quality review
- `executing-plans` stays free of baked-in mandatory re-review loops

This layer should be expressed as targeted static tests, not hand-wavy prose.

### 6. Update documentation claims

`docs/testing.md` should explicitly describe the two proof layers:

- Codex executability
- upstream workflow parity

It should also explicitly say what the suite does not prove:

- full live-session parity across all possible behaviors
- installation correctness in a user's normal environment
- native Windows automation coverage

The important change is not to make the suite sound weaker than it is.
It is to make the meaning of each green result precise.

## Files in Scope

Core workflow restoration:

- `skills/subagent-driven-development/SKILL.md`
- `skills/subagent-driven-development/implementer-prompt.md`
- `skills/subagent-driven-development/spec-reviewer-prompt.md`
- `skills/subagent-driven-development/code-quality-reviewer-prompt.md`

Supporting alignment:

- `skills/requesting-code-review/SKILL.md`
- `agents/code-reviewer.md`

Validation and docs:

- `docs/testing.md`
- `scripts/validate-codex-only.sh`
- `tests/codex/test-workflow-parity.sh`
- `tests/codex/test-runtime-smoke.sh`
- any additional parity-focused test file needed for cleaner separation

## Acceptance Criteria

The task is complete when all of the following are true:

1. `subagent-driven-development` describes the upstream same-implementer review loop as the default flow.
2. The implementer prompt again includes commit-before-report in the main task sequence.
3. Fresh fix agents are described as fallback or escalation, not default loop behavior.
4. The parity test suite fails if the core workflow drifts back to coordinator-owned-state-first language.
5. The runtime smoke still proves that the current checkout loads in Codex.
6. `docs/testing.md` clearly distinguishes parity proof from executability proof.

## Testing Strategy

Run:

```bash
tests/codex/test-workflow-parity.sh
tests/codex/test-runtime-smoke.sh
scripts/validate-codex-only.sh
```

Review output for two separate questions:

1. Did the current checkout load correctly in Codex?
2. Does the restored workflow still match upstream semantics?

If needed, add one more focused parity test rather than overloading `test-doc-consistency.sh` with workflow semantics.

## Risks

### Risk 1: Over-literal restoration breaks Codex execution

Mitigation:

- restore upstream meaning first
- translate only the mechanics Codex truly requires
- keep `send_input` or `resume_agent` as the mechanism for same-implementer follow-up

### Risk 2: Parity tests become brittle string snapshots

Mitigation:

- test workflow invariants rather than every exact sentence
- enforce default semantics, ordering, and forbidden drift patterns

### Risk 3: Coordinator behavior leaks back into core workflow language

Mitigation:

- treat coordinator glue as implementation detail
- keep the core skill centered on implementer-reviewer loops, as upstream does

## Out of Scope

- installation changes
- full multi-session behavioral eval infrastructure
- native Windows runtime automation
- repository-wide rewording outside the execution workflow and its proof model
