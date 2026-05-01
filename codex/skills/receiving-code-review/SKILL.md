---
name: receiving-code-review
description: Use when receiving review feedback, requested changes, inline comments, or external suggestions before deciding whether and how to implement them
---

# Receiving Code Review

## Overview

Review feedback is input to evaluate, not an order to apply blindly. Technical correctness matters more than performative agreement.

Core principle: verify before implementing, ask before assuming, and fix one item at a time.

## Response Pattern

When receiving feedback:

1. Read all feedback before reacting.
2. Restate the technical requirement in your own words when needed.
3. Inspect the actual code, tests, requirements, and history.
4. Decide whether the suggestion is correct for this codebase.
5. Respond with action, a technical question, or reasoned pushback.
6. Implement one item at a time and verify each fix.

## Forbidden Responses

Do not use performative agreement such as:
- "You're absolutely right."
- "Great point."
- "Excellent feedback."
- "Let me implement that now" before verification.

Use technical responses instead:
- "Checking whether this path is still used."
- "This conflicts with the documented API contract; verifying before changing."
- "Implemented by changing X and verified with Y."

## Handling Unclear Feedback

If any requested item is unclear, stop before implementing the set.

Clarify:
- Which behavior should change.
- Which files or interfaces are in scope.
- Whether the item is blocking.
- How success should be verified.

Do not partially implement a multi-item request when unclear items may affect the design.

## Evaluating Feedback

For each item, check:
- Is it technically correct for this codebase?
- Would it break existing behavior or compatibility?
- Does the current implementation exist for a reason?
- Is the feature or endpoint actually used?
- Does it conflict with the user's previous decisions?
- Can it be verified with tests or deterministic commands?

If an external reviewer suggests a "proper" feature, search for actual usage before building more surface area. If unused, ask whether to remove the dead path or keep the feature.

## Implementation Order

For multi-item feedback:

1. Clarify blocking ambiguity first.
2. Fix blocking correctness, security, data loss, and regression issues.
3. Apply simple mechanical fixes.
4. Address larger logic or architecture changes.
5. Run focused verification after each meaningful change.
6. Run final regression checks before reporting completion.

## When To Push Back

Push back when:
- The suggestion breaks existing functionality.
- The reviewer lacks necessary context.
- The change violates stated requirements or user decisions.
- The suggestion adds unused functionality.
- The feedback is technically incorrect for the stack or supported versions.
- Verification evidence contradicts the finding.

Push back with facts:
- Cite files, lines, tests, API docs, or command output.
- Ask a precise question when requirements conflict.
- Involve the user for architecture or product tradeoffs.

## Correcting Your Own Pushback

If you pushed back and later verify the reviewer was correct, state the correction plainly:

- "Verified this path and the reviewer is correct. The missing guard allows X. Fixing now."
- "My initial read missed Y. Implemented Z and verified with the focused test."

Avoid long apology or defensive explanation.

## GitHub Inline Comments

When replying to GitHub inline review comments, reply in the existing review thread when tooling supports it. Avoid scattering thread replies as unrelated top-level comments.

If using Codex review findings in a final response, emit one `::code-comment{...}` directive per actionable finding with tight file and line references.

## Completion Standard

For completed review feedback, report:
- What was changed.
- Which feedback items were intentionally not changed and why.
- Verification commands and current pass/fail status.
- Any remaining ambiguity or user decision needed.
