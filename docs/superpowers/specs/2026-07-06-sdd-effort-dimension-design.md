# SDD Effort Dimension Design

**Status:** Proposed. Ships the effort-control mechanism and dispatch
guidance. Makes no measured cost claim (see Validation).
**Issue:** obra/superpowers#1747.
**Objective:** give SDD a per-role reasoning-effort dial, so a subagent's
effort matches its task instead of inheriting the session's.

## Overview

SDD dispatches every subagent (implementer, task reviewer, fix, final
reviewer) at the session's reasoning effort, because effort cannot be set at
dispatch. A high-effort session spends high-effort reasoning transcribing a
plan that already contains the code. A default-effort session runs the final
whole-branch review, which SDD pins to the most capable model, at default
effort. SDD already matches the *model* to the task (the Model Selection
section, from the #1744 cost-tiering work). Effort is the same dial's second
axis, fixed at the session level today.

This design adds effort as an explicit SDD dispatch dimension. On Claude Code
it ships a small roster of effort-pinned worker agents (the only mechanism
that sets per-role effort there). On Codex it documents the native
`model_reasoning_effort` key. On other harnesses it documents the
session-level limitation. The role prompts, the dispatch flow, and the model
choice are all unchanged.

## Relationship to existing work

This sits directly beside the Model Selection section produced by the
strict-cost SDD work (`2026-06-10-strict-cost-sdd-design.md`, PR #1744) and
reuses its structure and its guardrails:

- **Effort is the second axis of the model dial.** The task-type boundaries
  are the same ones Model Selection already validated (transcription vs
  standard vs judgment). This design does not introduce new task
  categories; it maps the existing ones to an effort level.
- **The judgment guardrail applies unchanged: cheapen mechanics, never
  judgment.** Low effort is used only where the work is mechanical
  (deterministic, cheaply verifiable, gated by the task review). High
  effort stays on every judgment point: the final whole-branch review,
  subtle reviews, BLOCKED diagnosis, and adjudication. Matching effort to
  task type this way does not trade quality for cost, which is what lets
  the guidance ship ahead of the full eval campaign (see Validation).

The strict-cost L1 ladder proposed a per-task complexity tag from the
planner (`mechanical / standard / judgment`). If that ships, the same tag
can drive both the model tier and the effort level. This design does not
depend on it and does not implement it.

## Mechanism, per harness

The harnesses expose reasoning depth at different points, which is why the
mechanism is harness-conditional while the guidance is harness-general.

- **Claude Code.** The Task tool overrides `model` per dispatch but not
  `effort`. The only per-subagent effort control is agent-definition
  frontmatter. Subagent calls carry the agent's frontmatter effort on the
  wire and are sent with thinking disabled, so prompt-level thinking cues
  are inert for subagents. Therefore effort control requires named agent
  files. A dispatch-time `model` override takes precedence over an agent's
  frontmatter model, so an agent file can pin *only* effort and leave the
  model to the dispatch. The two axes stay independent.
- **Codex.** `model_reasoning_effort` is a first-class per-custom-agent key
  that inherits from the session when unset. The knob exists natively; the
  guidance simply tells SDD to set it.
- **Other harnesses (Gemini CLI and similar).** Reasoning depth is exposed
  at session or model-selection level, with no per-role mechanism. No
  change beyond documenting the session-effort tax.

## Component 1: effort-pinned worker roster

New directory `agents/` at the plugin root (Claude Code auto-discovers it).
Three files, each a general-purpose worker distinguished only by its effort
frontmatter:

```
agents/worker-low-effort.md      effort: low
agents/worker-medium-effort.md   effort: medium
agents/worker-high-effort.md     effort: high
```

**Frontmatter.** `name`, `description`, `effort`. No `model` key, so the
dispatch-time model override supplies the model (and the agent falls back to
the session model if a dispatch ever omits it). No `tools` key, so the agent
inherits the full toolset, which implementers need for edits and reviewers
use read-only by their prompt. The `description` states that the agent is an
explicit dispatch target for superpowers dispatch skills and not for
automatic delegation, so Claude does not auto-select it for unrelated tasks.

**Body.** A short, role-neutral system prompt that fixes only the effort
posture and defers everything else to the dispatch prompt. It must not
impose a role, since the same worker serves implementers and reviewers.
Example for `worker-low-effort.md`:

```markdown
---
name: worker-low-effort
description: Effort-pinned general-purpose worker running at low reasoning
  effort. Explicit dispatch target for superpowers dispatch skills
  (subagent-driven-development, dispatching-parallel-agents) when the caller
  has judged the task transcription-grade or mechanical. The caller supplies
  the role, task, and model at dispatch; this agent only fixes the reasoning
  effort the Task tool cannot set per invocation. Not for automatic delegation.
effort: low
---

You are a general-purpose worker running at low reasoning effort. Your role,
task, and instructions come entirely from the dispatch prompt you were given.
Follow it exactly and do not expand scope. If the task turns out to need more
reasoning than low effort supports, say so plainly and stop, so the caller can
re-dispatch you at a higher tier.
```

`worker-medium-effort.md` and `worker-high-effort.md` are identical except
for the effort level and a body tuned to it (medium: "take the reasoning the
task needs without over-investing"; high: "take the time the task needs,
state your reasoning, and flag uncertainty rather than smoothing it over").

**Naming.** `worker-<level>-effort`, referenceable bare or as
`superpowers:worker-<level>-effort`. The plugin namespace disambiguates from
any other effort agents a user has installed. The names are role-agnostic on
purpose, so `dispatching-parallel-agents` can use them too.

**Effort levels.** Low, medium, high cover the three task-type tiers and are
supported across the models SDD uses. xhigh and max are deliberately omitted
from the first roster (YAGNI); adding a file later is trivial if a role
needs one.

**Haiku caveat.** Haiku has no effort parameter, so `worker-low-effort`
dispatched on Haiku runs Haiku with no effort change. That is acceptable for
the cheapest tier, since Haiku is already the reasoning floor. When low
effort is wanted on a non-floor model, pair `worker-low-effort` with a model
that honors effort (for example Sonnet). The guidance states this.

## Component 2: Effort Selection section in the SDD skill

A new `## Effort Selection` subsection in
`skills/subagent-driven-development/SKILL.md`, placed immediately after
`## Model Selection` and mirroring its shape. Content:

- Effort is the second axis of the same capability match; set it to the
  least effort the role needs, for the same cost reason model is set.
- The judgment guardrail, restated: cheapen mechanics, never judgment.
- Role-to-effort map:
  - Transcription-grade implementation (the plan carries the complete code)
    and single-file mechanical fixes: low.
  - Standard implementation from a prose spec, and integration work: medium.
  - Design or architecture implementation: high.
  - The final whole-branch review: high, on the most capable model. It is a
    judgment task, so do not lower its effort.
  - Task reviewer: scale effort to the diff exactly as the model is scaled.
    A small mechanical diff does not need high effort. A subtle change
    (concurrency, a contract change, shared state) does. Reviewing is
    judgment, so do not default reviewer effort to the floor.
  - Fix subagents: match the task's tier, one step up if the fix itself
    needs judgment the original task did not.
- The dispatch rule, the analog of "always specify the model explicitly":
  on Claude Code, always dispatch through the effort-matched worker agent.
  An omitted effort inherits the session's and defeats this section.
- The per-harness mechanism note (Claude Code worker agents, Codex
  `model_reasoning_effort`, other harnesses session-level with the effort
  tax), and the Haiku caveat.

## Component 3: dispatch template edits

`skills/subagent-driven-development/implementer-prompt.md` and
`task-reviewer-prompt.md` each change their dispatch header. Today it reads
`Subagent (general-purpose):` with a required `model:` placeholder. It
becomes a dispatch target that names the effort-matched worker on Claude
Code, keeps `general-purpose` as the fallback when the roster is absent or on
non-Claude-Code harnesses, keeps the `model:` placeholder unchanged, and
adds an `effort:` note that points at the new Effort Selection section (and,
for Codex, at `model_reasoning_effort`). The templates stay harness-general.

## Component 4: final review and standalone code review

SDD's final whole-branch review dispatches via `worker-high-effort` on the
most capable model. This is stated in the Effort Selection section (Component
2), since SDD's final review reuses the `requesting-code-review` template
rather than owning one. One line is added to
`skills/requesting-code-review/code-reviewer.md` noting effort selection, so
the standalone use of that skill is not left without the dimension. The
substantive guidance stays in SDD.

## Component 5: tests

A shell test under `tests/claude-code/`, following the existing convention
(bash, sourced `test-helpers.sh`), doing static validation with no CLI
invocation:

- Every `agents/worker-*-effort.md` parses, has a `name`, a `description`,
  and an `effort` value in the supported set (low, medium, high).
- Every worker name referenced in `SKILL.md` and the two templates has a
  matching file in `agents/` (a drift guard against renaming one and not the
  other).

Static and deterministic, so it runs fast and does not depend on a live
model.

## Validation

The mechanism (Components 1, 3, 4, 5) and the fact that effort is a
dispatchable second axis are unconditional. They add capability and make no
cost or quality claim.

The role-to-effort defaults (Component 2) make no *measured* cost claim. The
repo's standard for behavior-changing cost guidance is the N=5 eval gate
campaign (`sdd-quality-reviewer-catches-planted-defect`,
`sdd-rejects-extra-features`, deliverable parity), and this design does not
run it. The defaults are safe to ship ahead of that campaign for one
specific reason: the direction respects the judgment guardrail by
construction. High effort stays on every judgment point, and low effort is
applied only to task types Model Selection already validated as mechanical,
where the task review gate catches errors. So the guidance cannot regress
quality by matching effort to task type, whatever the eventual measured
magnitude of the cost saving turns out to be.

What remains eval-pending, and is called out as such rather than claimed:
the magnitude of the cost saving from lowering implementer effort, and
whether effort-token dynamics differ from the thinking-cap result the
strict-cost campaign measured backfiring (effort is the model's own
target-depth control, not a truncation cap, so that result should not
transfer a priori, but it is not measured here). If the maintainer wants the
defaults gated, the same harness that gated the model tiers applies
unchanged, since the task categories are identical.

## Scope boundaries

**Touches:** new `agents/` directory (three worker files),
`skills/subagent-driven-development/SKILL.md`, its two prompt templates, one
line in `skills/requesting-code-review/code-reviewer.md`, one new test.

**Does not touch:** the Model Selection section's content (effort sits beside
it, does not rewrite it), the model-tiering work, other skills, or Codex and
Gemini config files. Codex is documented, not shipped, because superpowers
ships no per-role Codex custom-agent TOMLs today; when it does, the effort key
goes in alongside the model choice.

**Non-goals:** running the eval campaign, implementing the planner complexity
tag, adding xhigh/max workers, or changing role prompts or the dispatch flow.

## Open decisions

- **RELEASE-NOTES entry.** Whether this PR adds a RELEASE-NOTES stanza and a
  version bump, or leaves both to the maintainer at release time. Default:
  leave the bump to the maintainer; add a notes stanza only if the
  maintainer's PRs conventionally include one.
- **Worker naming.** `worker-<level>-effort` versus a more explicit prefix
  (`sp-worker-...`). Default: `worker-<level>-effort`, relying on the
  `superpowers:` plugin namespace to disambiguate.
