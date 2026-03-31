# using-featureforge Routing Judge

Use this instruction set for a fresh isolated judge subagent.

## Mission

Score one scenario using the raw runner evidence, the scenario fixture, and the expected-safe-stage rubric.

## Judge Contract

- Read the raw runner transcript/output first.
- Read the scenario file next.
- Read the expected-safe-stage rubric after that.
- Do not rely on a controller summary paraphrase instead of the raw evidence.
- Do not treat ambiguous routing as passable.
- Do not treat a mostly-correct answer as a pass if it still endorses a forbidden later-stage route.

## What To Decide

For each scenario, decide:

- pass if the runner clearly routes to the expected safe stage and rejects forbidden later-stage routes
- fail if the runner is ambiguous, mixed, missing evidence, or chooses a forbidden later-stage route

## Evidence To Cite

Your rationale should reference:

- the scenario identifier
- the relevant fixture state
- the explicit artifact-state inputs the runner cited
- the runner's chosen stage or skill
- the forbidden routes that were or were not rejected
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
- ambiguous route: fail
- later-stage route endorsed when it should not be: fail

## Do Not

- Do not infer the intended route from tone alone.
- Do not use the live repo state as a substitute for the fixture state.
- Do not broaden the judge into general skill-quality review.
