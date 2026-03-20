# Eval Tests

This directory contains two evaluation surfaces:

- opt-in Node-based `.eval.mjs` tests that are not part of the default deterministic validation flow
- the `using-superpowers` routing gate, which remains a required change-specific gate for Item 1 routing-safety work

## Purpose

This directory holds prompt-quality evals for high-risk workflow instructions where deterministic string checks are useful but not sufficient.

Current evals cover:

- `using-superpowers` fail-closed routing behavior via the markdown orchestrator and runner/judge instruction set
- the shared interactive-question format contract
- `review-accelerator-contract`, which checks explicit user-only activation, ambiguous-wording rejection, per-section human approval, no automatic approval-state changes, main-agent-only write authority, and persisted-packet stale/regenerate language against the generated CEO/ENG `SKILL.md` files plus README excerpts from the current branch

## How To Run

Set these environment variables when you want the Node-based `.eval.mjs` tests to execute instead of skip:

- `EVALS=1`
- `OPENAI_API_KEY`
- `EVAL_MODEL`

Optional environment for the Node-based `.eval.mjs` tests:

- `SUPERPOWERS_STATE_DIR` to control where eval logs are written
- `EVAL_INPUT_COST_PER_1M` and `EVAL_OUTPUT_COST_PER_1M` to estimate USD cost from token usage

Run the Node-based evals from the repo root:

```bash
EVALS=1 \
OPENAI_API_KEY=... \
EVAL_MODEL=... \
node --test tests/evals/*.eval.mjs
```

Targeted Node-based workflow-contract run:

```bash
EVALS=1 \
OPENAI_API_KEY=... \
EVAL_MODEL=... \
node --test tests/evals/interactive-question-format.eval.mjs tests/evals/review-accelerator-contract.eval.mjs
```

Routing eval note:

- `using-superpowers` routing is driven by the markdown orchestrator/runner/judge files listed below, not by `node --test`
- the routing gate does not use `tests/evals/helpers/openai-judge.mjs`
- the routing gate does not require the Node-based `.eval.mjs` environment variables above just to execute the runner/judge flow

## Routing Eval

`using-superpowers` routing is now doc-driven instead of `.eval.mjs` driven.

Use these files as the authoritative contract:

- `tests/evals/using-superpowers-routing.orchestrator.md`
- `tests/evals/using-superpowers-routing.scenarios.md`
- `tests/evals/using-superpowers-routing.runner.md`
- `tests/evals/using-superpowers-routing.judge.md`

The orchestrator doc tells the controller how to run fresh runner/judge subagents, persist per-scenario evidence under `~/.superpowers/projects/<slug>/...`, and fail closed on ambiguous or malformed outputs.

The retired `tests/evals/using-superpowers-routing.eval.mjs` file has been removed.

## Observability

The Node-based evals write a JSON record to:

`$SUPERPOWERS_STATE_DIR/evals/` or `~/.superpowers/evals/`

Each record includes:

- prompt name
- pass/fail
- transcript or judge summary
- elapsed time
- approximate cost when token rates are supplied

The routing eval instead writes per-scenario evidence bundles under:

`~/.superpowers/projects/<slug>/...`
