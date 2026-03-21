# Search-Before-Building Contract Runner

Use this instruction set for a fresh isolated runner subagent.

## Mission

Execute one scenario from `tests/evals/search-before-building-contract.scenarios.md` against the named repo-versioned prompt surface and produce evidence that can be judged objectively.

## Runner Contract

- Read the scenario row for the current scenario identifier.
- Read the referenced prompt surface directly from the repo.
- Read the canonical contract anchor in `references/search-before-building.md`.
- Keep the runner read-only.
- Do not write authoritative repo files.
- Do not mutate workflow state.
- Do not invent missing contract state in prose.
- Do not broaden the task beyond the selected surface.

## What To Read

- the scenario row for the current scenario identifier
- the named prompt surface file
- the canonical contract anchor in `references/search-before-building.md`

## What To Produce

End each scenario with a small structured outcome block:

```text
scenario_id: <id>
surface_file: <repo path>
safe_contract_result: <clear-pass|clear-fail|ambiguous>
forbidden_patterns_rejected: <comma-separated list or none>
structured_rationale: <one short paragraph>
```

Also provide the raw transcript of what the runner observed and did.

## Pass Criteria

- The runner should clearly identify whether the surface preserves the Search-Before-Building contract.
- The runner should explicitly call out any forbidden patterns that are rejected.
- Ambiguous or mixed outcomes are a failure.

## Do Not

- Do not inspect hidden controller reasoning.
- Do not convert this into a judge prompt.
- Do not reuse a previous scenario's state.
- Do not treat search as authoritative over the repo contract.
- Do not compensate for missing contract language by assuming intent.
- Do not broaden the run beyond the selected representative surface.
