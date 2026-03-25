# Eval Tests

This directory contains two evaluation surfaces:

- opt-in Node-based `.eval.mjs` tests that are not part of the default deterministic validation flow
- doc-driven runner/judge gates for higher-order workflow contracts that are reviewed through fresh subagents instead of the Node OpenAI judge helper

This includes the `using-featureforge` routing gate, which remains a required change-specific gate for Item 1 routing-safety work.

## Purpose

This directory holds prompt-quality evals for high-risk workflow instructions where deterministic string checks are useful but not sufficient.

Current evals cover:

- `using-featureforge` fail-closed post-bypass routing behavior via the markdown orchestrator and runner/judge instruction set
- the shared interactive-question format contract
- `review-accelerator-contract`, which checks explicit user-only activation, ambiguous-wording rejection, per-section human approval, no automatic approval-state changes, main-agent-only write authority, and persisted-packet stale/regenerate language against the generated CEO/ENG `SKILL.md` files plus README excerpts from the current branch
- `search-before-building-contract`, a doc-driven runner/judge gate that checks a small representative set of generated non-router skills and both reviewer prompt surfaces for Layer 2 as input-not-authority, privacy/sanitization boundaries, fallback language when search is unavailable or unsafe, and built-in-before-bespoke / known-footgun review behavior

## How To Run

Set these environment variables when you want the Node-based `.eval.mjs` tests to execute instead of skip:

- `EVALS=1`
- `OPENAI_API_KEY`
- `EVAL_MODEL`

Optional environment for the Node-based `.eval.mjs` tests:

- `FEATUREFORGE_STATE_DIR` to control where eval logs are written
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

- `using-featureforge` routing is driven by the markdown orchestrator/runner/judge files listed below, not by `node --test`
- the routing gate does not use `tests/evals/helpers/openai-judge.mjs`
- the routing gate does not require the Node-based `.eval.mjs` environment variables above just to execute the runner/judge flow

Search-Before-Building eval note:

- `search-before-building-contract` is also doc-driven instead of `.eval.mjs` driven
- it does not use `tests/evals/helpers/openai-judge.mjs`
- it does not require `EVALS`, `OPENAI_API_KEY`, or `EVAL_MODEL`
- it uses a checked-in scenario matrix plus fresh runner and judge subagents against repo-versioned prompt surfaces

## Routing Eval

`using-featureforge` routing is now doc-driven instead of `.eval.mjs` driven.

Use these files as the authoritative contract:

- `tests/evals/using-featureforge-routing.orchestrator.md`
- `tests/evals/using-featureforge-routing.scenarios.md`
- `tests/evals/using-featureforge-routing.runner.md`
- `tests/evals/using-featureforge-routing.judge.md`

The orchestrator doc tells the controller how to run fresh runner/judge subagents, persist per-scenario evidence under `~/.featureforge/projects/<slug>/...`, and fail closed on ambiguous or malformed outputs.

The routing gate intentionally starts after the first-turn bypass decision has already been resolved to `enabled` for the synthetic scenario session. Seed that state through the runner's real derived decision-file path for its own session identity; do not guess a `$PPID` from outside the runner. The bypass prompt and session-decision contract are covered separately by `cargo nextest run --test using_featureforge_skill`.

The retired `tests/evals/using-featureforge-routing.eval.mjs` file has been removed.

## Search-Before-Building Eval

Use these files as the authoritative contract:

- `tests/evals/search-before-building-contract.orchestrator.md`
- `tests/evals/search-before-building-contract.scenarios.md`
- `tests/evals/search-before-building-contract.runner.md`
- `tests/evals/search-before-building-contract.judge.md`

The orchestrator doc tells the controller to use a fresh runner subagent and a fresh judge subagent against the checked-in representative scenario matrix and the canonical contract in `references/search-before-building.md`.

This gate is intentionally representative, not exhaustive:

- it samples a few non-router generated skill surfaces rather than every generated skill
- it separately checks both reviewer prompt surfaces
- it fails closed on ambiguous or mixed evidence

The gate remains item-local. It is not a generic repo-wide eval framework.

## Observability

The Node-based evals write a JSON record to:

`$FEATUREFORGE_STATE_DIR/evals/` or `~/.featureforge/evals/`

Each record includes:

- prompt name
- pass/fail
- transcript or judge summary
- elapsed time
- approximate cost when token rates are supplied

The routing eval instead writes per-scenario evidence bundles under:

`~/.featureforge/projects/<slug>/...`

The Search-Before-Building gate also writes per-scenario evidence bundles under:

`~/.featureforge/projects/<slug>/...`
