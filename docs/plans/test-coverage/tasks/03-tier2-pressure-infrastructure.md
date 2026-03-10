# Task 3: Tier 2 — Pressure Test Infrastructure

**Specialist:** test-writer-3
**Depends on:** None
**Produces:** `tests/pressure-tests/` directory structure, `test-helpers-pressure.sh`, `run-all.sh`

## Goal

Create the infrastructure for pressure/behavior tests: shared helpers, directory scaffold, and a runner that discovers and executes all pressure test scripts.

## Acceptance Criteria

- [ ] `tests/pressure-tests/` directory exists with 8 skill subdirectories
- [ ] `test-helpers-pressure.sh` provides `run_pressure_test`, `assert_compliance`, `assert_no_violation` functions
- [ ] `run-all.sh` discovers and runs all `test-*.sh` scripts under pressure-tests subdirectories
- [ ] Infrastructure can be sourced without error: `source test-helpers-pressure.sh` succeeds
- [ ] A sample test script (placeholder) demonstrates the pattern

## Test Expectations

- **Test:** `source test-helpers-pressure.sh` succeeds and functions are available
- **Expected red failure:** `bash -c 'source test-helpers-pressure.sh && type run_pressure_test'` fails with "not found"
- **Expected green:** All 3 functions (`run_pressure_test`, `assert_compliance`, `assert_no_violation`) defined

## Files

- Create: `tests/pressure-tests/test-helpers-pressure.sh`
- Create: `tests/pressure-tests/run-all.sh`
- Create: `tests/pressure-tests/brainstorming/` (empty dir)
- Create: `tests/pressure-tests/verification/` (empty dir)
- Create: `tests/pressure-tests/tdd/` (empty dir)
- Create: `tests/pressure-tests/using-superpowers/` (empty dir)
- Create: `tests/pressure-tests/receiving-code-review/` (empty dir)
- Create: `tests/pressure-tests/writing-plans/` (empty dir)
- Create: `tests/pressure-tests/executing-plans/` (empty dir)
- Create: `tests/pressure-tests/finishing/` (empty dir)

## Implementation Notes

### `test-helpers-pressure.sh` Design

Source `test-helpers.sh` for base functions, then add pressure-specific helpers:

```bash
# run_pressure_test <skill-name> <prompt> <max-turns> <description>
# Runs Claude with the skill loaded and captures JSONL output.
# Returns path to the JSONL session file.
run_pressure_test() { ... }

# assert_compliance <jsonl-file> <pattern> <test-name>
# Checks that Claude's response contains a compliance marker
# (e.g., "verification", "running tests", "design for approval").
# Searches assistant message content in the JSONL transcript.
assert_compliance() { ... }

# assert_no_violation <jsonl-file> <pattern> <test-name>
# Checks that Claude did NOT exhibit a forbidden behavior
# (e.g., "EnterPlanMode", "skip verification", "trust prior claims").
assert_no_violation() { ... }
```

Key design decisions:
- `run_pressure_test` runs Claude headless with `--plugin-dir`, `--dangerously-skip-permissions`, `--output-format stream-json`
- Works from the plugin directory (same pattern as `run-test.sh`)
- JSONL output saved to `/tmp/superpowers-tests/<timestamp>/pressure-tests/<skill>/<test-name>/`
- `assert_compliance` greps assistant messages in JSONL (not raw output) for reliability
- `assert_no_violation` is the inverse — fails if pattern IS found

### `run-all.sh` Design

Discover all `test-*.sh` files under subdirectories, run each, track pass/fail counts:

```bash
for test_file in "$SCRIPT_DIR"/*/test-*.sh; do
    ...
done
```

### Sample Test Pattern

Include a commented-out example in `test-helpers-pressure.sh` showing the expected structure:

```bash
# Example pressure test script:
# #!/bin/bash
# source "$(dirname "$0")/../test-helpers-pressure.sh"
# RESULT=$(run_pressure_test "brainstorming" "Just add a logout button, it's trivial" 5 "B1-trivial-task")
# assert_compliance "$RESULT" "explore.*context\|understand.*requirements" "Agent explores before acting"
# assert_no_violation "$RESULT" "EnterPlanMode" "Agent does not use EnterPlanMode"
```

## Commit

`test: add pressure test infrastructure and directory scaffold`
