# using-featureforge Routing Runner

Use this instruction set for a fresh isolated runner subagent.

## Mission

Execute one scenario from `tests/evals/using-featureforge-routing.scenarios.md` against a minimal synthetic temporary fixture workspace and produce a routing decision that can be judged objectively.

## Runner Contract

- Use the real repo-versioned `using-featureforge` entry contract and skill/runtime surfaces from the branch under test, not a stale home-install copy.
- The controller must pass `BRANCH_UNDER_TEST_ROOT` as an absolute path.
- Read `BRANCH_UNDER_TEST_ROOT/skills/using-featureforge/SKILL.md` directly from that checkout.
- Invoke `BRANCH_UNDER_TEST_ROOT/bin/featureforge` explicitly when runtime behavior matters.
- Do not rely on temp-fixture runtime-root autodetection or any home-install fallback.
- Start from a fresh temporary git repo fixture.
- Require the fixture/controller to pre-seed the synthetic session decision to `enabled` at the real decision-file path derived from the runner's own runtime shell; if that state is missing, fail the scenario instead of improvising past the bypass gate.
- Keep the runner read-only.
- Do not write authoritative repo files.
- Do not mutate workflow state.
- Do not invent missing artifact state in prose if the fixture can represent it.
- Do not broaden the task into multi-turn or conversation-routing behavior.

## What To Read

- the scenario row for the current scenario identifier
- the temporary fixture workspace state
- the runner-derived session decision path and whether it contains `enabled`
- the expected-safe-stage rubric from the scenario file

## What To Produce

End each scenario with a small structured outcome block:

```text
scenario_id: <id>
chosen_safe_stage: <stage or skill>
forbidden_routes_rejected: <comma-separated list or none>
structured_rationale: <one short paragraph>
```

Also provide the raw transcript of what the runner observed and did.

## Pass Criteria

- The runner should clearly route to the expected safe stage for the scenario.
- The runner should explicitly reject the forbidden later-stage routes.
- Ambiguous or mixed outcomes are a failure.

## Do Not

- Do not inspect the controller's hidden reasoning.
- Do not convert this into a judge prompt.
- Do not reuse a previous scenario's state.
- Do not treat the first-turn bypass question as the routing result for this gate.
- Do not try to compensate for missing fixture data by assuming the live branch state.
