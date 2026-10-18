# Testing Toolbelt

Toolbelt has two distinct kinds of tests, each in its own directory:

- **`tests/`** — does the plugin's non-LLM code work? Bash + node + python integration tests for brainstorm-server JS, codex-plugin sync, and analysis utilities.
- **`evals/`** — do agents behave correctly on real LLM sessions? Python harness driving real tmux sessions of Claude Code / Codex, with an LLM actor and verifier judging skill compliance.

## Plugin tests

Live in `tests/`. Currently:

- `tests/brainstorm-server/` — node test suite for the brainstorm server JS code.
- `tests/codex/`, `tests/codex-plugin-sync/` — bash packaging and sync verification.
- `tests/hooks/` — session-start hook output shape per harness.
- `tests/toolbelt/` — tests for the skills' scripts, plus `test-doctrine.sh`, which checks skill structure rather than wording: links and script paths resolve, `toolbelt:` names exist, and no all-caps emphasis or filler phrases appear outside gate blocks.
- `tests/claude-code/test-helpers.sh`, `analyze-token-usage.py` — utilities used by remaining bash tests.
- `tests/claude-code/test-subagent-driven-development.sh` — agent-can-describe-SDD test (no drill counterpart; tests description-recall, not behavior).
- `tests/claude-code/test-subagent-driven-development-integration.sh` — extended SDD integration with token analysis (drill covers the YAGNI subset; bash adds commit-count, Claude Code task-tracking, and token telemetry assertions).
- `tests/claude-code/test-worktree-native-preference.sh` — RED-GREEN-REFACTOR validation for worktree skill (drill covers the PRESSURE phase; bash also covers RED/GREEN baselines).
- `tests/explicit-skill-requests/` — Haiku-specific, multi-turn, and skill-name-prompted tests not covered by drill.

Run plugin tests via the relevant directory's `run-*.sh` or `npm test`.

## Skill behavior evals

Live in `evals/`. Drill is the harness; scenarios live at `evals/scenarios/*.yaml`. See `evals/README.md` for setup. Quick start:

```bash
cd evals
uv sync --extra dev
export ANTHROPIC_API_KEY=sk-...
uv run drill run triggering-test-driven-development -b claude
```

Drill scenarios are slow (3-30+ minutes each) and run real LLM sessions. They are not part of CI today; the natural follow-up is a tiered model (fast subset on PR, full sweep nightly + on-demand).
