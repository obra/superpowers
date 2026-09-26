---
name: requesting-code-review
description: Use when completing a task, implementing a major feature, or before merging. Review each task against the plan and re-run verification before moving on.
---

# Requesting Code Review

Review early, review often. A review catches issues before they cascade.

## When to request (mandatory)

- After each task in a plan.
- After completing a major feature.
- Before merging to the main branch.

## What to review

- **Spec compliance** — does the change do what the plan/spec said?
- **Code quality** — correctness, edge cases, error handling, scope (no unrelated changes).
- **Verification** — was the test/lint/build actually run, with real output?

## How

- Give the reviewer precise context: what changed, why, and how it was verified.
- Keep the diff small and reviewable: one logical change per commit, clear messages.
- Block on critical issues. A review finding must be resolved before the task is considered done.

## After review

- Address findings, re-run verification, then proceed to the next task.
- Do not batch unrelated changes into one review.

Nothing merges without human review. See `verification-before-completion`.
