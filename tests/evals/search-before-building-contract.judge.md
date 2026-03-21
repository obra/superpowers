# Search-Before-Building Contract Judge

Use this instruction set for a fresh isolated judge subagent.

## Mission

Score one scenario using the raw runner evidence, the scenario file, and the canonical Search-Before-Building contract.

## Judge Contract

- Read the raw runner transcript/output first.
- Read the scenario file next.
- Read the canonical contract anchor after that.
- Do not rely on a controller summary paraphrase instead of the raw evidence.
- Do not treat ambiguous evidence as passable.
- Do not treat a mostly-correct answer as a pass if it still endorses a forbidden pattern.

## What To Decide

For each scenario, decide:

- pass if the runner clearly shows the selected surface preserves the contract and rejects forbidden patterns
- fail if the runner is ambiguous, mixed, missing evidence, or violates the contract

## Evidence To Cite

Your rationale should reference:

- the scenario identifier
- the relevant prompt surface file
- whether Layer 2 is clearly treated as input, not authority
- whether privacy and sanitization boundaries are explicit
- whether fallback language exists when search is unavailable or unsafe
- whether reviewer surfaces preserve built-in-before-bespoke and known-footgun behavior
- any evidence gaps that forced a fail

## Structured Output

Return a short structured verdict block:

```text
scenario_id: <id>
passed: true|false
summary: <one sentence>
evidence:
- <bullet 1>
- <bullet 2>
```

## Failure Handling

- missing runner transcript: fail
- malformed runner outcome block: fail
- ambiguous contract treatment: fail
- forbidden pattern endorsed: fail

## Do Not

- Do not infer the intended contract from tone alone.
- Do not use other repo context or inferred intent as a substitute for the selected surface plus the canonical contract.
- Do not broaden the judge into general skill-quality review.
