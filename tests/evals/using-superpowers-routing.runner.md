# using-superpowers Routing Runner

Use this instruction set for a fresh isolated runner subagent.

## Mission

Execute one scenario from `tests/evals/using-superpowers-routing.scenarios.md` against a minimal synthetic temporary fixture workspace and produce a routing decision that can be judged objectively.

## Runner Contract

- Use the real `using-superpowers` entry contract and installed skill set.
- Start from a fresh temporary git repo fixture.
- Keep the runner read-only.
- Do not write authoritative repo files.
- Do not mutate workflow state.
- Do not invent missing artifact state in prose if the fixture can represent it.
- Do not broaden the task into multi-turn or conversation-routing behavior.

## What To Read

- the scenario row for the current scenario identifier
- the temporary fixture workspace state
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
- Do not try to compensate for missing fixture data by assuming the live branch state.
