# Search-Before-Building Contract Orchestrator

This is the single checked-in execution entrypoint for the Search-Before-Building contract gate.
It replaces the old JS-only eval surface.

## Purpose

Dispatch a fresh runner subagent against the repo-versioned scenario matrix, capture the raw runner evidence, dispatch a fresh judge subagent against that evidence, and keep the gate closed unless every scenario passes without ambiguity.

This gate validates Search-Before-Building prompt surfaces on representative non-router skills and both reviewer prompt surfaces. It does not create a new workflow stage and it does not depend on the Node OpenAI judge helper.

Use the scenario-set identifier `search-before-building-contract-r2` for evidence naming and retention.

## Required Inputs

- the scenario matrix in `tests/evals/search-before-building-contract.scenarios.md`
- the runner instructions in `tests/evals/search-before-building-contract.runner.md`
- the judge instructions in `tests/evals/search-before-building-contract.judge.md`
- the canonical Search-Before-Building contract in `references/search-before-building.md`
- the repo-versioned prompt surfaces named in the scenario matrix

## Execution Rules

1. Start a fresh isolated runner subagent for each required scenario.
2. For each required scenario, read the scenario row, the referenced prompt surface, and the canonical Search-Before-Building contract directly from the repo.
3. Keep each runner read-only and limited to its selected scenario.
4. Capture raw runner output and a small structured outcome block for each scenario.
5. Start a fresh isolated judge subagent after each runner finishes.
6. Feed each judge the raw runner evidence, the scenario file, and the canonical contract.
7. Record a per-scenario evidence bundle under `~/.featureforge/projects/<slug>/search-before-building-contract-r2/...`.
8. Pass only when every required scenario in the checked-in matrix passes and no scenario is ambiguous.

## Evidence Bundle

The evidence bundle for a scenario must include:

- scenario-set identifier
- scenario identifier
- scenario/rubric artifact revision or fingerprint
- runner-derived evidence for the selected prompt surface
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
Do not fall back to the retired `search-before-building-contract.eval.mjs` file.
Do not broaden the gate beyond the checked-in representative surfaces.
