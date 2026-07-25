# Two-Tier Workflow Design

**Date:** 2026-07-26
**Status:** Approved

## Problem

The minipowers workflow is a single fixed pipeline: brainstorming → writing-plans → subagent-driven-development. Every change, regardless of size, pays the full cost: a separate plan document, per-task implementer/reviewer loops, a progress ledger, and a commit at every step. For small changes (a small feature, a bugfix, a few files touched) this is too much process, and in practice the user bypasses minipowers entirely and uses plain plan mode. The diligent brainstorm → spec front half is worth keeping for all sizes; the heavy back half is only worth it for large changes.

## Solution Overview

Add a tier fork at the end of brainstorming, after the spec is approved:

- **Light tier:** brainstorm → spec → direct subagent execution → one single commit at the end. No plan document, no per-task review gates, no ledger. New skill: `executing-specs`.
- **Heavy tier:** the current flow, unchanged: brainstorm → spec → writing-plans → subagent-driven-development, with per-step commits.

The controller recommends a tier based on concrete signals and the user confirms with one word. Borderline cases default to heavy.

## Tier Triage (change to `skills/brainstorming/SKILL.md`)

The brainstorming skill's terminal state changes from "invoke writing-plans" to a routing step that runs after the user approves the written spec:

1. Controller assesses tier from concrete signals:
   - **Light:** single subsystem; roughly 1-5 files touched; no schema or API migrations; no new cross-component interfaces to design; work fits about 1-3 implementer dispatches.
   - **Heavy:** multiple subsystems; many files; new interfaces between components; migrations; anything needing task-by-task interface pinning.
2. Controller states its recommendation with a one-line rationale and asks one confirmation question. Borderline cases default to heavy.
3. Route: light → invoke `executing-specs`; heavy → invoke `writing-plans` (unchanged).

**Light-path spec requirement:** when the controller expects to recommend light, the spec MUST include an **Implementation notes** section — files to create/modify, key interfaces, and test intent. On the light path the spec is the implementer's brief; there is no plan document to fill the gap. Heavy-path specs do not need this section (the plan carries it).

Spec commit behavior on the light path also changes: the spec is not committed separately. It is included in the single final commit (see below). The existing "do NOT commit the spec during drafting" rule stays as-is for both tiers.

## New Skill: `skills/executing-specs/SKILL.md`

**Description (frontmatter):** "Use when executing an approved small-scope spec directly, without an implementation plan — produces a single commit at the end."

**Flow:**

1. **Setup:** record the base SHA. Same branch rule as SDD: never start on main/master without explicit user consent.
2. **Implement:** dispatch implementer subagent(s) sequentially. The spec file (including its Implementation notes section) is the brief — no task-brief extraction. TDD applies (invoke minipowers:test-driven-development). Checkpoint commits are allowed and encouraged during execution: they give rollback points and let review diffs use commit ranges. Never dispatch implementers in parallel.
3. **Review:** one final reviewer subagent over the whole diff (base..HEAD), checking spec compliance and code quality with the same rubric as SDD's final whole-branch review. Generate the diff with SDD's `scripts/review-package BASE HEAD` (referenced from the SDD skill directory).
4. **Fix loop:** if the reviewer finds Critical/Important issues, dispatch one fix subagent with the complete findings list, then re-review. Repeat until clean.
5. **Verify:** minipowers:verification-before-completion gate — full test suite green, evidence before claims.
6. **Squash:** `git reset --soft <base SHA>`, then create ONE commit containing all code changes plus the spec file. Conventional Commits subject line.
7. **Wrap-up:** if on a branch, ask the user about branch disposition (merge / PR / keep), same as SDD. Otherwise done.

**Explicitly absent (by design):** progress ledger, kickoff docs commit, task-brief files, per-task report files, per-task review gates.

**Model selection:** one short paragraph inheriting SDD's principle — cheap model for mechanical single-file work with pinned-down requirements, standard model otherwise; always specify the model explicitly when dispatching.

**Implementer prompt:** own trimmed `implementer-prompt.md` in the skill directory — SDD's version is coupled to task briefs and report files, which do not exist on this path. The trimmed prompt keeps: TDD contract, self-review, checkpoint commits, question-before-work escape hatch, and the four-status report contract (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED). It drops: brief-file reading, report-file writing.

**Escalation valve:** if implementation reveals the scope was misjudged — file count ballooning past the light criteria, or interface ambiguity between components emerging — STOP. Report to the user and offer to route the remaining work through writing-plans + subagent-driven-development. Checkpoint commits make partial work recoverable; do not squash before escalating.

## Change to `skills/writing-plans/SKILL.md`

One added line near the top noting that this skill is the heavy path, reached via brainstorming's tier triage. No behavior change.

## Unchanged

`subagent-driven-development`, `test-driven-development`, `verification-before-completion`, `writing-skills`.

## Implementation Notes

- **Modify:** `skills/brainstorming/SKILL.md`
  - Replace the "terminal state is invoking writing-plans" language (appears in the Checklist intro, checklist item 8, and the "Implementation" subsection) with the triage step above.
  - Add the light-path spec requirement (Implementation notes section) to the "After the Design" documentation guidance.
  - Update the HARD-GATE wording if it references writing-plans as the only exit.
- **Create:** `skills/executing-specs/SKILL.md` — full flow as specified above.
- **Create:** `skills/executing-specs/implementer-prompt.md` — trimmed from SDD's implementer prompt as specified above.
- **Modify:** `skills/writing-plans/SKILL.md` — one-line heavy-path note; also update its "Execution Handoff" section only if wording implies it is the sole path out of brainstorming.
- **Test intent:** validate per minipowers:writing-skills (subagent testing of skill docs): (a) a small-change scenario routed through brainstorming lands on executing-specs and produces exactly one commit; (b) a large-change scenario still routes to writing-plans; (c) executing-specs escalation triggers when scope balloons. Frontmatter descriptions checked for trigger accuracy.
