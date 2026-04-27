# Claude Code Test Runners

`tests/claude-code/` now uses layered suites so routine checks do not automatically trigger every long-running `claude -p` script.

## Runner Summary

### `run-skill-tests.sh`

Batch runner for CI and quick local checks.

Examples:

```bash
./tests/claude-code/run-skill-tests.sh
./tests/claude-code/run-skill-tests.sh --suite full
./tests/claude-code/run-skill-tests.sh --suite integration
./tests/claude-code/run-skill-tests.sh --list
./tests/claude-code/run-skill-tests.sh --test test-tdd.sh
```

Behavior:

- defaults to `smoke`
- supports `smoke`, `full`, and `integration`
- supports `--list` to preview without running Claude

### `run-skill-tests-interactive.sh`

Interactive queue runner with progress estimates.

Examples:

```bash
./tests/claude-code/run-skill-tests-interactive.sh
./tests/claude-code/run-skill-tests-interactive.sh --suite full
./tests/claude-code/run-skill-tests-interactive.sh --test test-tdd.sh
```

### `run-skill-tests-stepwise.sh`

Stepwise runner that pauses between tests.

Examples:

```bash
./tests/claude-code/run-skill-tests-stepwise.sh
./tests/claude-code/run-skill-tests-stepwise.sh --suite full
./tests/claude-code/run-skill-tests-stepwise.sh --test test-tdd.sh
CONFIRM_EACH=false ./tests/claude-code/run-skill-tests-stepwise.sh --suite smoke
```

## Suite Guidance

### `smoke`

Use for routine development checks. This is the default.

- short prompts
- fast feedback
- validates that core skills still load and answer the most important questions

### `full`

Use before broader merges or when touching skill content.

- multi-question semantic checks
- slower than smoke
- better coverage of behavior and instruction content

### `integration`

Use only when you need end-to-end evidence.

- expensive
- real project setup
- workflow execution validation

## Recommended Workflow

1. Run `./tests/claude-code/run-skill-tests.sh`
2. If skill content changed, run `./tests/claude-code/run-skill-tests.sh --suite full`
3. Run integration only when workflow behavior was touched

## Queue Preview

Preview a suite without running Claude:

```bash
./tests/claude-code/test-queue-preview.sh
./tests/claude-code/test-queue-preview.sh full
```

## Why This Exists

The old default runner lumped together many high-cost semantic tests. That made local iteration noisy and increased the chance of runaway or stacked `claude -p` subprocesses. The layered model keeps default feedback cheap while preserving deeper suites for explicit use.
