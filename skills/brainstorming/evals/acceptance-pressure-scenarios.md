# Brainstorming Acceptance Pressure Scenarios

These scenarios are the RED/GREEN contract for the acceptance-driven brainstorming change.
They are intentionally behavior-focused rather than wording-focused.

## Scoring

For each scenario, score every required behavior as PASS/FAIL.
A GREEN candidate must pass all blocking behaviors and must not fail the anti-overdesign check.

## S1 — Bounded change under time pressure

**Prompt**

> We only need a tiny change. When the network comes back, retry failed photo uploads.
> It is obvious and we are in a hurry. Please do not over-design this.

**Required behavior**

- Classify as bounded if the existing upload flow is present.
- Before implementation, state a Mini Acceptance Contract.
- Capture the changed behavior.
- Capture at least one relevant invariant: completed uploads must not be retried/duplicated.
- Capture the critical failure semantic: backend rejection must not become success.
- Keep the acceptance artifact short; do not enumerate speculative edge cases.

**Failure signature**

Short design -> approval -> implementation, with no explicit acceptance obligations.

---

## S2 — Architectural change with a weak success statement

**Prompt**

> Design a resilient photo upload subsystem. It should automatically recover after connectivity loss and process death.

**Required behavior**

- Define acceptance obligations before selecting the final technical approach.
- Include observable evidence for the critical recovery behavior.
- Include at least one invariant preventing duplicate completed uploads.
- Evaluate candidate approaches against the critical obligations.
- Do not treat "testing" as a substitute for defining acceptance.

**Failure signature**

Architecture/components/data flow are detailed, but no independent observer can determine whether the system is correct.

---

## S3 — Spike without a decision rule

**Prompt**

> Can WorkManager reliably satisfy our recovery requirement? Quick experiment is fine.

**Required behavior**

- Produce a Probe Contract before investigation.
- State the question/hypothesis.
- State evidence to collect.
- State success and failure criteria.
- State the decision rule connecting evidence to the architectural choice.

**Failure signature**

"Try WorkManager and report findings" without a falsifiable threshold or decision rule.

---

## S4 — Behavioral ambiguity

**Prompt**

> Resume uploads when the network returns.

Context does not define whether cellular, metered, captive-portal, or only validated Wi-Fi counts as "network returns".

**Required behavior**

- Identify this as behavioral ambiguity.
- Expose it as a decision/unknown.
- Ask the human partner to resolve it before treating acceptance as ready.
- Do not silently pick one network policy and make it explicit.

**Failure signature**

Agent chooses a policy because it seems reasonable.

---

## S5 — Brownfield regression invariant

**Prompt**

> Add automatic recovery to the existing upload flow. Existing successful uploads must continue to behave exactly as today.

**Required behavior**

- Explore the existing flow.
- Extract at least one must-remain-true invariant from the current behavior.
- Carry the invariant into the design/acceptance mapping.
- Treat a design that cannot preserve the invariant as not ready.

**Failure signature**

Only new behavior is specified; unchanged correct behavior is not represented.

---

## S6 — Anti-overdesign regression

**Prompt**

> Change the existing request timeout from 20 seconds to 30 seconds. Nothing else changes.

**Required behavior**

- Keep this bounded.
- Acceptance should be minimal: changed timeout + relevant unchanged behavior only.
- Do not create a full scenario catalogue, state machine, CEG, or exhaustive test design.
- Proceed to short design after the lightweight acceptance statement.

**Failure signature**

The acceptance addition creates more ceremony than the behavioral risk warrants.

---

## Release gate

A candidate Brainstorming skill is ready only when:

1. S1-S5 establish explicit acceptance before implementation/planning.
2. S4 never silently resolves behavioral ambiguity.
3. S6 stays lightweight.
4. Architectural work has an Acceptance Readiness check before writing-plans.
5. Brainstorming defines acceptance obligations, not exhaustive test cases.