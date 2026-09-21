# RED Baseline — Upstream Brainstorming

Baseline source: `obra/superpowers` main, `skills/brainstorming/SKILL.md`.

## Observed structural failures

The current upstream skill:

1. Carries **intent** into design, but has no required **Acceptance Contract** before design.
2. Bounded work requires a short design and human approval, but no Mini Acceptance Contract.
3. Spike work requires a question + probe, but no explicit evidence threshold or decision rule.
4. Architectural design covers architecture, components, data flow, error handling, and testing, but does not require an observable oracle for critical behavior.
5. The self-review ambiguity rule says to pick one interpretation and make it explicit; this can silently turn a product/behavior assumption into a specification decision.
6. The self-review has no required check for regression invariants or Acceptance -> Design traceability.
7. The transition to `writing-plans` is gated by user review/approval, not by a separate Acceptance Readiness condition.

## RED verdict

The baseline fails the acceptance-focused contract represented by S1-S5.

It also has no rule that protects against the opposite failure introduced by this change: over-designing trivial bounded work (S6).

## Limitation

This environment does not expose Superpowers' external live agent-eval harness, so this RED record is a deterministic structural baseline plus executable pressure-scenario definitions, not a claim that fresh-agent repetitions were run here.

The scenarios are intentionally written so they can be copied into the Superpowers eval harness later for multi-run behavioral evaluation.