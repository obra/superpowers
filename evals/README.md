# Drill

Superpowers skill compliance benchmark. Drives AI coding agents through
tmux sessions and evaluates whether they follow superpowers workflows
correctly.

## How it works

1. **Setup** — a helper creates a git repo with specific conditions (worktree state, plan files, code fixtures)
2. **Actor** — a Sonnet 4.6 LLM plays the user, following turn intents from the scenario YAML
3. **Agent** — the backend under test (Claude Code, Codex, Gemini CLI) runs in a real tmux session
4. **Verifier** — a Sonnet 4.6 LLM evaluates the session transcript + filesystem against criteria
5. **Assertions** — deterministic checks (tool-called, tool-count, shell commands) run post-session

## Setup

```bash
uv sync --extra dev
```

Optional git hooks:
```bash
uv --project evals run pre-commit install
uv --project evals run pre-commit run --all-files
```

Required environment:
```bash
export ANTHROPIC_API_KEY=sk-...
```

`SUPERPOWERS_ROOT` defaults to the parent of `evals/` (the superpowers repo root) and only needs to be set if you're running drill against a different superpowers checkout.

## Usage

```bash
# Run a single scenario on a single backend
uv run drill run worktree-creation-from-main -b claude

# Run with N repetitions
uv run drill run spec-writing-blind-spot -b claude-opus-4-6 --n 5

# Sweep across multiple backends
uv run drill run spec-writing-blind-spot --models claude-opus-4-6,claude-opus-4-7 --n 10

# Compare results
uv run drill compare spec-writing-blind-spot

# List available scenarios
uv run drill list
```

## Scenarios

| Category | Scenarios | Tests |
|----------|-----------|-------|
| Worktree | 11 scenarios | Worktree creation, detection, consent, detached HEAD, and native-tool pressure |
| Skill triggering | 6 scenarios | Auto-invocation for core Superpowers skills |
| SDD workflow | 5 scenarios | Explicit invocation, mid-conversation invocation, real-project execution, and YAGNI enforcement |
| Review/spec/verification | 6 scenarios | Code review, spec review, architectural targeting, design blind spots, and verification reflexes |
| Tool mapping | 3 scenarios | Codex and Gemini subagent tool-name mapping |

## Backends

| Backend | CLI | Model |
|---------|-----|-------|
| `claude` | Claude Code | opus-4-7 (default) |
| `claude-opus-4-6` | Claude Code | opus-4-6 |
| `claude-opus-4-7` | Claude Code | opus-4-7 |
| `claude-opus-4-6-1m` | Claude Code | opus-4-6 (1M context) |
| `claude-opus-4-7-1m` | Claude Code | opus-4-7 (1M context) |
| `codex` | Codex CLI | — |
| `gemini` | Gemini CLI | auto-gemini-3 |
| `gemini-2-5-flash` | Gemini CLI | gemini-2.5-flash |

## Project structure

```
drill/              # Core engine
  cli.py            # Click CLI (run, compare, list)
  engine.py         # Tmux session orchestration
  actor.py          # User-simulator LLM
  verifier.py       # Criteria evaluator LLM
  assertions.py     # Deterministic post-session assertions
  compare.py        # Result loading and cross-backend comparison
  sweep.py          # Multi-backend N-rep orchestrator
  stats.py          # Wilson score confidence intervals
scenarios/          # YAML scenario definitions
setup_helpers/      # Repo fixture creators
backends/           # Per-backend YAML configs
bin/                # Assertion helper scripts (tool-called, tool-count, etc.)
prompts/            # Actor and verifier system prompts
fixtures/           # Static template repos
tests/              # pytest suite (122 tests)
docs/               # Design spec and manual testing guide
```

## Tests

```bash
uv run pytest
uv run ruff check
uv run ty check
```

## Writing a new scenario

1. Create a setup helper in `setup_helpers/` if you need a custom fixture
2. Register it in `setup_helpers/__init__.py`
3. Create `scenarios/your-scenario.yaml` with setup, turns, limits, and verify sections
4. Run it: `uv run drill run your-scenario -b claude`

See [docs/design.md](docs/design.md) for the full design spec.
