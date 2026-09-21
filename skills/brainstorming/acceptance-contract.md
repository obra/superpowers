# Acceptance Contracts for Brainstorming

Use this reference only when the main brainstorming flow reaches acceptance
definition, challenge, or readiness. Brainstorming defines **what must be
true**; later planning/test-design work defines exhaustive **how to verify**.

## Calibration

Scale acceptance effort to behavioral risk, not document size.

Capture obligations that materially constrain correctness, architecture, or
release confidence. Do not enumerate every imaginable edge case.

## Core shape

A behavior obligation should normally contain:

- **Condition / Trigger** — when the obligation applies
- **Expected Behavior** — what the system must do
- **Observable Outcome / Oracle** — evidence an independent observer could use
  to distinguish PASS from FAIL

Keep the oracle at the design-contract level. Do not prescribe test framework,
mock structure, automation code, or exhaustive data combinations here.

## Probe Contract — Spike

Use for feasibility questions.

```markdown
### Probe Contract

Question / Hypothesis:
...

Evidence:
...

Success:
...

Failure:
...

Decision rule:
...
```

A spike is complete when the evidence supports a decision, not merely when an
experiment ran.

## Mini Acceptance Contract — Bounded

Use for a well-scoped change to an existing flow. Usually 1-5 behavior
obligations and only the relevant invariants/failure semantics.

```markdown
### Mini Acceptance Contract

Changed behavior:
- AC-01 ...

Must remain true:
- INV-01 ...

Critical failure behavior:
- FAIL-01 ...
```

Omit empty categories. Keep it short enough to stay in chat.

## Full Acceptance Contract — Architectural

```markdown
## Acceptance Contract

### Intended Outcome
...

### Behavior Obligations
AC-01
Condition:
Expected:
Observable:

### Invariants
INV-01 ...

### Failure Obligations
FAIL-01 ...

### Non-functional Obligations
NFR-01 ...

### Decisions / Unknowns
DEC-01 ...

### Verification Intent
AC-01 -> integration-observable evidence
INV-01 -> regression evidence
```

Verification Intent names the evidence level; it does not generate test cases.

## Behavioral ambiguity

A behavioral ambiguity changes any of:

- observable user/system behavior
- business rules
- state transitions
- data correctness
- failure semantics
- security or permissions
- compatibility behavior
- acceptance/NFR thresholds

Do not silently choose an interpretation. Record it as a Decision / Unknown and
ask the human partner.

Implementation-detail ambiguity may be resolved by the designer when it cannot
change acceptance semantics.

## Acceptance Challenge

Use four focused falsification probes:

1. **Counterexample** — can all listed conditions appear satisfied while the
   intended outcome is still wrong?
2. **Boundary** — does a boundary case force a different design decision?
3. **State** — is a critical state or transition missing/contradictory?
4. **Regression** — can the change violate a must-remain-true invariant?

Only add findings that materially constrain correctness or design. This is not
open-ended edge-case brainstorming.

## Acceptance -> Design Traceability

For each critical obligation, identify the design mechanism responsible for it.

```text
AC-01 -> SyncScheduler
AC-02 -> unique-work policy
INV-01 -> persisted completion state
FAIL-01 -> retry/result semantics
```

A mapping does not prove correctness; it proves the design has an explicit
mechanism intended to satisfy the obligation.

## Acceptance Readiness

Architectural work is **READY** only when:

- intended outcome is explicit;
- critical behavior obligations exist;
- critical obligations have observable PASS/FAIL evidence;
- critical failure semantics and relevant invariants are explicit;
- blocking behavioral ambiguities are zero;
- critical obligations map to design mechanisms; and
- high-risk challenge probes have been considered.

Otherwise report **NOT READY** plus blocking items and return to clarification,
acceptance, or design.

## Non-goals

Brainstorming does not produce:

- exhaustive test cases or test data
- automation scripts
- complete CEG/decision tables/pairwise models
- mutation-test plans
- mock/test-harness implementation

Those belong to downstream planning, test analysis, and test design.

## Example — network recovery

```markdown
### Intended Outcome
Pending photo uploads recover after connectivity returns without duplicate
successful uploads.

### Behavior Obligations

AC-01
Condition: upload is pending because connectivity is unavailable; an allowed
network becomes available.
Expected: the upload is rescheduled.
Observable: the upload reaches SUCCESS and the backend object exists.

AC-02
Condition: connectivity callbacks repeat for the same pending photo.
Expected: at most one effective upload is created.
Observable: at most one backend business object exists.

### Invariants
INV-01: an already completed upload is never submitted again.

### Failure Obligations
FAIL-01: backend rejection must not be represented as SUCCESS.

### Decision / Unknown
DEC-01: what network classes count as "allowed" must be decided if not already
specified.
```