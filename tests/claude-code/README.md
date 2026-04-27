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

## Notes

- Default smoke exists to avoid long `claude -p` piles during routine checks.
- Full and integration suites are explicit on purpose.
- `tests/codex/` remains the source of truth for Codex-native compatibility checks.
