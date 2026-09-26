---
name: systematic-debugging
description: Use when something is broken or behaves unexpectedly. Find the root cause before fixing; do not patch symptoms.
---

# Systematic Debugging

**Announce:** "I'm using the systematic-debugging skill."

## Phase 1 — Understand

Reproduce the failure deterministically. Read the relevant code and error. State, in one sentence,
what the actual behavior is vs. the expected behavior. Do not start changing code yet.

## Phase 2 — Hypothesize

Form one or more hypotheses about the root cause. For each, predict what you'd observe if it were
true. Prefer the simplest hypothesis that explains all the evidence.

## Phase 3 — Isolate

Test the hypothesis with the smallest experiment that discriminates between candidates. Narrow the
search space. Use logging/tests to confirm which hypothesis holds.

## Phase 4 — Verify the fix

Fix the root cause, then confirm the original failure is gone AND no new failure appeared. Add a
regression test so it can't silently recur.

## Rules

- Do not patch symptoms or silence an error to make it go away.
- Do not retry blindly.
- If you can't reproduce it, you can't fix it — find a deterministic reproduction first.
- Reset to the last known-good state and retry cleanly rather than accumulating broken state.

## When stuck

If the root cause isn't clear after genuine investigation, report what you've ruled out and ask for
input rather than guessing.
