# Drill

Superpowers skill compliance benchmark. Python 3.11+, managed with uv.

## Commands

- **install**: `uv sync --dev`
- **test**: `uv run pytest`
- **test single**: `uv run pytest tests/test_engine.py -x -q`
- **lint**: `uv run ruff check`
- **format**: `uv run ruff format`
- **typecheck**: `uv run ty check`
- **run scenario**: `uv run drill run <scenario> -b <backend>`
- **sweep**: `uv run drill run <scenario> --models claude-opus-4-6,claude-opus-4-7 --n 10`
- **compare**: `uv run drill compare <scenario>`
- **list**: `uv run drill list`

## Architecture

- `drill/engine.py` — Tmux session orchestration. Creates workdir, runs setup helpers, drives actor/agent turns, collects results.
- `drill/actor.py` — Sonnet 4.6 LLM simulating a user. Reads turn intents from scenario YAML and generates realistic prompts.
- `drill/verifier.py` — Sonnet 4.6 LLM evaluating session transcript + filesystem against semantic criteria.
- `drill/assertions.py` — Deterministic post-session checks. Runs shell commands from `verify.assertions` in the results dir.
- `drill/sweep.py` — Multi-backend, N-repetition orchestrator. Wraps Engine with try/except per run, writes run-group.json manifest.
- `drill/compare.py` — Loads results, computes pass rates and Wilson CIs, formats comparison tables.
- `drill/stats.py` — Wilson score confidence interval for pass rate estimation at small N.
- `scenarios/*.yaml` — Scenario definitions (setup, turns, limits, verify).
- `setup_helpers/*.py` — Repo fixture creators. Each creates a git repo with specific conditions.
- `backends/*.yaml` — Per-backend CLI config (args, env, idle patterns, shutdown commands).
- `bin/` — Assertion helper scripts: `tool-called`, `tool-not-called`, `tool-count`, `tool-before`, `tool-arg-match`. Run against `tool_calls.jsonl` in results dir.

## Conventions

- Setup helpers take `workdir: Path` and mutate the filesystem. Register in `setup_helpers/__init__.py`.
- Scenarios use `user_posture: naive` (no skill names) or `spec-aware` (can name skills).
- Verify criteria are semantic (LLM-evaluated). Verify assertions are deterministic (exit code 0 = pass).
- Assertions run in the results dir with `$DRILL_WORKDIR` pointing to the scenario workdir and `bin/` on PATH.
- Backend YAMLs are fully self-contained — no override/alias system.

## Required env

```
ANTHROPIC_API_KEY=sk-...
```

`SUPERPOWERS_ROOT` defaults to the parent of `evals/` (the superpowers repo root). Override only if running drill against a different superpowers checkout.
