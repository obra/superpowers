# using-superpowers Routing Orchestrator

This is the single checked-in execution entrypoint for Item 1.
It replaces the old JS-only routing eval surface.

## Purpose

Dispatch a fresh runner subagent against the repo-versioned scenario matrix, capture the raw runner evidence, dispatch a fresh judge subagent against that evidence, and persist a reviewable evidence bundle under `~/.superpowers/projects/<slug>/...`.

This gate validates post-bypass workflow-stage routing. It does not treat the first-turn opt-out question as the scenario outcome.

Use the scenario-set identifier `using-superpowers-routing-r4` for evidence naming and retention.

## Required Inputs

- the approved scenario matrix in `tests/evals/using-superpowers-routing.scenarios.md`
- the runner instructions in `tests/evals/using-superpowers-routing.runner.md`
- the judge instructions in `tests/evals/using-superpowers-routing.judge.md`
- the real `using-superpowers` entry contract from the repo

## Execution Rules

1. Start from a fresh isolated runner subagent.
2. Use the real `using-superpowers` entry contract and installed skill set.
3. Build a minimal synthetic temporary fixture workspace for each scenario.
4. Pre-seed the runner's real session decision path to `enabled` before the runner acts so the scenario exercises post-bypass routing instead of the first-turn opt-out prompt.
5. Derive that path from the same `using-superpowers` runtime shell the runner will use; do not guess or hardcode a `$PPID` from outside the runner session.
6. Keep the runner read-only.
7. Capture raw runner output and a structured outcome block for each scenario.
8. Start a fresh isolated judge subagent after the runner finishes.
9. Feed the judge the raw runner evidence plus the scenario file and the expected-safe-stage rubric.
10. Record a per-scenario evidence bundle under `~/.superpowers/projects/<slug>/routing-evals/using-superpowers-routing-r4/...`.
11. Pass only when every required scenario passes and no scenario is ambiguous.

## Evidence Bundle

The evidence bundle for a scenario must include:

- scenario-set identifier
- scenario identifier
- scenario/rubric artifact revision or fingerprint
- the runner-derived session decision path used for the pre-seeded `enabled` state
- chosen runner model
- chosen judge model
- raw runner transcript/output
- raw judge transcript/output or structured judge rationale
- judge verdict
- final pass/fail result

The evidence bundle is non-authoritative local review/debug output. It must not be written into the repo working tree for normal runs.

## Failure Handling

- runner bootstrap failure: fail the scenario and keep the gate closed
- judge timeout or ambiguity: fail the scenario and keep the gate closed
- malformed structured runner outcome block: fail the scenario and keep the gate closed
- missing evidence: fail the scenario and keep the gate closed
- stale scenario/rubric fingerprint: regenerate the run rather than reusing stale evidence

## Rejection Criteria

Do not treat this as a generic prompt-eval or a reusable repo-wide LLM eval framework.
Do not fall back to the retired `using-superpowers-routing.eval.mjs` file.
Do not count the pre-routing bypass question as the routed outcome for this gate.
