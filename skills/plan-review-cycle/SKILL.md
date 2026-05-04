---
name: plan-review-cycle
description: Use when an implementation plan has been written and needs independent verification, issue triage, documented finding dispositions, or repeated review before execution
---

# Plan Review Cycle

## Quick Reference

1. Dispatch a fresh reviewer.
2. Record every finding in the Plan Review Log.
3. Assign each finding a severity and status.
4. For each finding, propose either `Resolved` or `No Plan Change`.
5. Get human partner approval before changing the plan or closing a finding.
6. Do not execute while `Critical`, `Major`, or `Minor` findings are `Open`.
7. Recommend another review round after substantial plan changes.

## Overview

Run an independent verification loop for an existing implementation plan before execution begins. Every reviewer finding must be closed by either changing the plan or documenting why no plan change is needed.

At the start, clearly state that you are running the plan-review-cycle to verify and refine the plan.

Core invariant: **No reviewer finding disappears.** It is either resolved with a plan change or preserved with an explicit no-change rationale approved by your human partner.

## When to Use

Use this after a complete implementation plan exists and before implementation starts.

Use when:

- Your human partner asks for plan verification, plan review, a reviewer subagent, or another review round
- A plan may have missing requirements, vague tasks, contradictions, or buildability risks
- Review findings need to become tracked follow-up items
- The plan should preserve rationale for issues intentionally left unchanged

Do not use for:

- Creating the initial implementation plan
- Reviewing implemented code
- Debugging a failing implementation
- Replacing the inline self-review required by `superpowers:writing-plans`

## Required Inputs

- Plan file path
- Spec, requirements, or design file path when available
- Constraints, priorities, or non-goals from your human partner

If the spec path is missing, explicitly ask for it before starting the review unless your human partner confirms to proceed without it.

## Cycle

1. Dispatch a fresh reviewer subagent.
2. Ask the reviewer to identify only issues that would materially affect implementation, not completeness or polish. Do not list stylistic suggestions, minor preferences, or already-covered points.
3. If the reviewer returns `Status: Approved` with no findings, skip directly to step 8.
4. Convert each reviewer issue into a tracked finding.
5. Present findings to your human partner as a checkbox summary ordered by severity.
6. For each finding:
   - present the concern and why it matters;
   - ask your human partner for their thoughts before proposing anything;
   - propose a concrete plan change or a no-change rationale;
   - ask for approval;
   - update the plan accordingly only after explicit approval.
7. Ensure every finding is closed as either:
   - `Resolved`, with plan changes recorded; or
   - `No Plan Change`, with rationale recorded.
8. Ask your human partner whether to run another review round.
9. If yes, repeat the cycle with a fresh reviewer subagent.
10. If no, ask whether to proceed to the next workflow step.

## Reviewer Subagent Prompt

Use `reviewer-prompt.md` from this skill when dispatching the reviewer. Fill in the plan path, spec path, and any constraints.

The reviewer must ignore issues already closed in the Plan Review Log unless there is new evidence that invalidates the prior disposition.

## Plan Review Log

If the plan does not already contain a `Plan Review Log`, append one near the end of the plan after the implementation tasks and before any execution handoff notes.

For each review round, add:

```markdown
### Review Round N

**Reviewer:** subagent
**Date:** YYYY-MM-DD
**Spec reviewed:** `path/to/spec.md`
**Plan reviewed:** `path/to/plan.md`

#### Findings
```

For each finding:

Finding IDs are scoped by review round. Use `R<N>-PRC<NNN>` where `N` is the review round number and `NNN` is the finding number within that round. Do not reuse IDs across rounds.

```markdown
##### Finding R<N>-PRC<NNN>: Short title

**Status:** Open | Resolved | No Plan Change  
**Severity:** Critical | Major | Minor | Advisory  
**Location:** Plan section, task, or step

**Reviewer concern:**  
[What the reviewer flagged.]

**Why it matters:**  
[Implementation risk, ambiguity, missing requirement, contradiction, or other concrete impact.]

**Decision:**  
Change plan | No plan change

**Plan changes made:**

- [Task/section changed]
- [Exact summary of modification]

**Reason if no plan change:**  
[Explicit rationale explaining why the original plan remains valid, why the issue is out of scope, or why the concern is intentionally deferred.]

**Human partner approval:**  
Approved | Rejected | Deferred
```

Delete unused placeholder lines. Do not leave template text in the plan.

## Finding Disposition Rules

Every reviewer finding starts as `Open`.

A finding may be closed only when one of these is true:

### Resolved

The plan was changed. Record the reviewer concern, decision, exact plan sections or tasks changed, summary of the change, and approval from your human partner.

### No Plan Change

The plan was not changed. Record the reviewer concern, why the existing plan is already sufficient, out of scope, intentionally deferred, or superseded by another task, and approval from your human partner.

Never silently discard a finding. Never decide a finding is invalid without documenting the rationale and getting approval from your human partner.

Never update the plan unless your human partner explicitly confirms the disposition.  
Do not partially update the plan while a finding is still under discussion.
If operating in build mode, pause and wait for confirmation before making changes.

## Severity Semantics

- `Critical`: Blocks execution until resolved or explicitly closed as `No Plan Change` with human partner approval. Use for missing requirements, contradictions, unsafe paths, or tasks that cannot be executed.
- `Major`: Blocks execution unless your human partner explicitly approves deferring or accepting the risk. Use for issues likely to cause rework or incorrect behavior.
- `Minor`: Blocks execution until closed. Should be resolved or explicitly documented, but should not require large plan changes.
- `Advisory`: Does not block execution. Record only if your human partner wants it tracked.

Do not proceed to implementation while any `Critical`, `Major`, or `Minor` finding remains `Open`.

## Human Partner Interaction

After reviewer findings are returned, present a summary ordered by severity using checkbox syntax, then ask whether to begin:

```text
Review found N issue(s):

- [ ] R<N>-PRC001 [Critical] Short title
- [ ] R<N>-PRC002 [Major] Short title
- [ ] R<N>-PRC003 [Minor] Short title
- [ ] R<N>-PRC004 [Advisory] Short title

Would you like to review the first item on the list?
```

For each finding, present the concern and why it matters, then ask:

```text
What are your thoughts on this? Do you see it the same way, or is there context I'm missing?
```

After the human responds, propose a concrete plan change or no-change rationale, then ask:

```text
Approve this disposition?
```

Once a finding is approved, mark its checkbox and move to the next item.

If your human partner rejects a proposed disposition, keep the finding open and ask what outcome they want: revise the change, document no-change rationale, defer, or stop the review cycle.

## Repeat Review Guidance

Recommend another round when:

- Critical or Major findings caused substantial plan changes
- The plan structure changed significantly
- New tasks, files, or dependencies were introduced
- Multiple material issues were found

Do not strongly recommend another round when:

- The review returned no findings or only Advisory findings
- Findings were closed as `No Plan Change` with clear rationale
- Plan changes were small and localized

Ask:

```text
All review findings are closed. Another verification round is [recommended/optional/not necessary]. Would you like to run another round?
```

If yes, start another review round, include the existing Plan Review Log in the reviewer instructions, and tell the reviewer not to repeat already-closed findings unless there is new evidence.

If no, ask whether to proceed to the next step:

```text
Plan review cycle complete. Should we proceed to implementation with superpowers:subagent-driven-development or superpowers:executing-plans?
```

Do not start execution until your human partner confirms.

## Red Flags

Stop and fix if:

- A reviewer finding is discussed but not recorded
- A plan is unchanged but no rationale is documented
- A finding is treated as "implicitly resolved" without explicit closure
- The agent decides a finding is invalid without approval
- A review round repeats already-closed findings without new evidence
- Execution starts while findings remain open
- The Plan Review Log contains unresolved template placeholders
