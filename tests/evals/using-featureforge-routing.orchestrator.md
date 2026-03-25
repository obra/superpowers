# using-featureforge Routing Orchestrator

This is the single checked-in execution entrypoint for Item 1.
It replaces the old JS-only routing eval surface.

## Purpose

Dispatch a fresh runner subagent against the repo-versioned scenario matrix, capture the raw runner evidence, dispatch a fresh judge subagent against that evidence, and persist a reviewable evidence bundle under `~/.featureforge/projects/<slug>/...`.

This gate validates post-bypass workflow-stage routing. It does not treat the first-turn opt-out question as the scenario outcome.

Use the scenario-set identifier `using-featureforge-routing-r4` for evidence naming and retention.

## Required Inputs

- the approved scenario matrix in `tests/evals/using-featureforge-routing.scenarios.md`
- the runner instructions in `tests/evals/using-featureforge-routing.runner.md`
- the judge instructions in `tests/evals/using-featureforge-routing.judge.md`
- the real repo-versioned `using-featureforge` entry contract from the branch under test
- the absolute `BRANCH_UNDER_TEST_ROOT` path for the repo checkout under review

## Execution Rules

1. Start from a fresh isolated runner subagent.
2. Use the real repo-versioned `using-featureforge` entry contract and skill/runtime surfaces from the branch under test, not whichever home-install copy happens to be present.
3. Pass the absolute branch-under-test repo root into both runner and judge prompts.
4. Require the runner to read `BRANCH_UNDER_TEST_ROOT/skills/using-featureforge/SKILL.md` directly and invoke `<BRANCH_UNDER_TEST_ROOT>/bin/featureforge` explicitly instead of relying on runtime-root autodetection from the temporary fixture repo.
5. Build a minimal synthetic temporary fixture workspace for each scenario.
6. Pre-seed the runner's real session decision path to `enabled` before the runner acts so the scenario exercises post-bypass routing instead of the first-turn opt-out prompt.
7. Derive that path from the same repo-versioned runtime shell the runner will use; do not guess or hardcode a `$PPID` from outside the runner session.
8. Keep the runner read-only.
9. Capture raw runner output and a structured outcome block for each scenario.
10. Start a fresh isolated judge subagent after the runner finishes.
11. Feed the judge the raw runner evidence plus the scenario file and the expected-safe-stage rubric.
12. Record a per-scenario evidence bundle under `~/.featureforge/projects/<slug>/routing-evals/using-featureforge-routing-r4/...`.
13. Pass only when every required scenario passes and no scenario is ambiguous.

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
Do not fall back to the retired `using-featureforge-routing.eval.mjs` file.
Do not count the pre-routing bypass question as the routed outcome for this gate.
