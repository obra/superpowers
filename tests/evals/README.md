# Eval Tests

These tests are opt-in. They are not part of the default deterministic validation flow.

## Purpose

This directory holds prompt-quality evals for high-risk workflow instructions where deterministic string checks are useful but not sufficient.

Current evals cover:

- `using-superpowers` fail-closed routing behavior
- the shared interactive-question format contract
- `review-accelerator-contract`, which checks explicit user-only activation, ambiguous-wording rejection, per-section human approval, no automatic approval-state changes, main-agent-only write authority, and persisted-packet stale/regenerate language against the generated CEO/ENG `SKILL.md` files plus README excerpts from the current branch

## How To Run

Required environment:

- `EVALS=1`
- `OPENAI_API_KEY`
- `EVAL_MODEL`

Optional environment:

- `SUPERPOWERS_STATE_DIR` to control where eval logs are written
- `EVAL_INPUT_COST_PER_1M` and `EVAL_OUTPUT_COST_PER_1M` to estimate USD cost from token usage

Run from the repo root:

```bash
EVALS=1 \
OPENAI_API_KEY=... \
EVAL_MODEL=... \
node --test tests/evals/*.eval.mjs
```

Targeted workflow-contract run:

```bash
EVALS=1 \
OPENAI_API_KEY=... \
EVAL_MODEL=... \
node --test tests/evals/interactive-question-format.eval.mjs tests/evals/review-accelerator-contract.eval.mjs
```

## Observability

Each eval writes a JSON record to:

`$SUPERPOWERS_STATE_DIR/evals/` or `~/.superpowers/evals/`

Each record includes:

- prompt name
- pass/fail
- transcript or judge summary
- elapsed time
- approximate cost when token rates are supplied
