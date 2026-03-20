# using-superpowers Routing Orchestrator

This is the single checked-in execution entrypoint for Item 1.
It replaces the old JS-only routing eval surface.

## Purpose

Dispatch a fresh runner subagent against the repo-versioned scenario matrix, capture the raw runner evidence, dispatch a fresh judge subagent against that evidence, and persist a reviewable evidence bundle under `~/.superpowers/projects/<slug>/...`.

Use the scenario-set identifier `using-superpowers-routing-r3` for evidence naming and retention.

## Required Inputs

- the approved scenario matrix in `tests/evals/using-superpowers-routing.scenarios.md`
- the runner instructions in `tests/evals/using-superpowers-routing.runner.md`
- the judge instructions in `tests/evals/using-superpowers-routing.judge.md`
- the real `using-superpowers` entry contract from the repo

## Execution Rules

1. Start from a fresh isolated runner subagent.
2. Use the real `using-superpowers` entry contract and installed skill set.
3. Build a minimal synthetic temporary fixture workspace for each scenario.
4. Keep the runner read-only.
5. Capture raw runner output and a structured outcome block for each scenario.
6. Start a fresh isolated judge subagent after the runner finishes.
7. Feed the judge the raw runner evidence plus the scenario file and the expected-safe-stage rubric.
8. Record a per-scenario evidence bundle under `~/.superpowers/projects/<slug>/routing-evals/using-superpowers-routing-r3/...`.
9. Pass only when every required scenario passes and no scenario is ambiguous.

## Evidence Bundle

The evidence bundle for a scenario must include:

- scenario-set identifier
- scenario identifier
- scenario/rubric artifact revision or fingerprint
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
