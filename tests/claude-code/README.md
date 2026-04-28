# Claude Code Skills Tests

Automated tests for Horspowers skills using Claude Code CLI.

## Overview

This suite verifies that skills are loaded correctly and that Claude follows them as expected. The suite is intentionally layered:

- `smoke`: fast compatibility checks, safe for routine local runs
- `full`: deeper semantic checks for skill instructions
- `integration`: long-running end-to-end workflow validation

## Requirements

- Claude Code CLI installed and in PATH (`claude --version` should work)
- Local Horspowers installation available

## Running Tests

### Run the default smoke suite

```bash
./run-skill-tests.sh
```

### Run the full semantic suite

```bash
./run-skill-tests.sh --suite full
```

### Run integration tests

```bash
./run-skill-tests.sh --suite integration
```

### Run a specific test

```bash
./run-skill-tests.sh --test test-subagent-driven-development.sh
```

### Run the native worktree preference check directly

```bash
bash ./test-worktree-native-preference.sh green
```

This targeted test verifies prompt behavior only: when native worktree tools are available in model context, the skill should prefer them over `git worktree add`, treat user consent to create isolation as enough to use the native tool, and keep manual git commands as fallback-only.

### Preview the selected suite without running Claude

```bash
./run-skill-tests.sh --list
./run-skill-tests.sh --list --suite full
```

### Run with verbose output

```bash
./run-skill-tests.sh --verbose --suite full
```

### Set a custom timeout

```bash
./run-skill-tests.sh --timeout 1800 --suite integration
```

## Suite Structure

### Smoke Suite (default)

- `test-brainstorming-smoke.sh`: skill discovery and `docs/plans` flow
- `test-writing-plans-smoke.sh`: skill discovery and task sizing
- `test-tdd-smoke.sh`: skill discovery and test-first rule
- `test-systematic-debugging-smoke.sh`: reproduce-first debugging behavior
- `test-subagent-driven-development-smoke.sh`: skill discovery and review ordering

### Full Suite

- `test-brainstorming.sh`
- `test-writing-plans.sh`
- `test-tdd.sh`
- `test-systematic-debugging.sh`
- `test-subagent-driven-development.sh`
- `test-automated-development-workflow.sh`
- `test-upgrade.sh`

These tests ask broader semantic questions and take substantially longer than smoke.

### Standalone Targeted Checks

- `test-worktree-native-preference.sh`: verifies native worktree tool preference, consent bridging, and `git worktree add` fallback semantics for `using-git-worktrees`

This test is intended for direct invocation with `green` mode rather than automatic suite membership.

### Integration Suite

- `test-subagent-driven-development-integration.sh`

This suite creates a real test project and validates the subagent workflow end to end.

## Shared Helpers

### `test-helpers.sh`

Common functions for skill tests:

- `run_claude "prompt" [timeout]`
- `assert_contains output pattern name`
- `assert_not_contains output pattern name`
- `assert_count output pattern count name`
- `assert_order output pattern_a pattern_b name`

### `suite-helpers.sh`

Shared suite definitions for all Claude runners:

- suite membership
- default timeouts
- estimated runtimes
- human-readable suite descriptions

## CI Usage

Recommended progression:

```bash
./run-skill-tests.sh
./run-skill-tests.sh --suite full
```

Run integration only when you explicitly need workflow-level validation.

## Adding New Tests

1. Create `test-<skill-name>.sh` or `test-<skill-name>-smoke.sh`
2. Source `test-helpers.sh`
3. Add the test to the appropriate suite in `suite-helpers.sh`
4. Make the file executable

For targeted semantic probes that are useful during skill rewrites but not desirable in routine suite runs, document the direct invocation command in this file and in `TEST-RUNNERS.md`.

## Notes

- Default smoke exists to avoid long `claude -p` piles during routine checks.
- Full and integration suites are explicit on purpose.
- `tests/codex/` remains the source of truth for Codex-native compatibility checks.
