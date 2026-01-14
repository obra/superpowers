# Claude Code Skills Tests

Automated tests for superpowers skills using Claude Code CLI.

## Overview

This test suite verifies that skills are loaded correctly and Claude follows them as expected. Tests invoke Claude Code in headless mode (`claude -p`) and verify the behavior.

## Requirements

- Claude Code CLI installed and in PATH (`claude --version` should work)
- Local superpowers plugin installed (see main README for installation)
- Optional: `timeout` command for integration tests (install with `brew install coreutils` on macOS)
  - Integration tests will skip gracefully if timeout is not available

## Running Tests

### Run all fast tests (recommended):
```bash
./run-skill-tests.sh
```

### Run integration tests (slow, 10-15 minutes):
```bash
./run-skill-tests.sh --integration
```

### Run specific test:
```bash
./run-skill-tests.sh --test test-subagent-driven-development.sh
```

### Run with verbose output:
```bash
./run-skill-tests.sh --verbose
```

### Set custom timeout:
```bash
./run-skill-tests.sh --timeout 1800  # 30 minutes for integration tests
```

## Test Structure

### test-helpers.sh
Common functions for skills testing:
- `run_claude "prompt" [timeout]` - Run Claude with prompt
- `assert_contains output pattern name` - Verify pattern exists
- `assert_not_contains output pattern name` - Verify pattern absent
- `assert_count output pattern count name` - Verify exact count
- `assert_order output pattern_a pattern_b name` - Verify order
- `assert_file_exists file name` - Verify file exists
- `assert_file_contains file pattern name` - Verify file contains pattern
- `assert_valid_json json name` - Verify valid JSON string
- `extract_ralph_status output` - Extract Ralph status block
- `verify_ralph_status_block status name` - Verify Ralph status format
- `create_test_project` - Create temp test directory
- `create_test_plan project_dir` - Create sample plan file

### Test Files

Each test file:
1. Sources `test-helpers.sh`
2. Runs Claude Code with specific prompts
3. Verifies expected behavior using assertions
4. Returns 0 on success, non-zero on failure

## Example Test

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: My Skill ==="

# Ask Claude about the skill
output=$(run_claude "What does the my-skill skill do?" 30)

# Verify response
assert_contains "$output" "expected behavior" "Skill describes behavior"

echo "=== All tests passed ==="
```

## Current Tests

### Fast Tests (run by default)

#### test-subagent-driven-development.sh
Tests skill content and requirements (~2 minutes):
- Skill loading and accessibility
- Workflow ordering (spec compliance before code quality)
- Self-review requirements documented
- Plan reading efficiency documented
- Spec compliance reviewer skepticism documented
- Review loops documented
- Task context provision documented

#### test-manus-pretool-hook.sh
Unit test for manus pretool hook (~1 second):
- Verifies hook outputs valid JSON when inactive
- Verifies hook outputs empty JSON when no .active marker
- Verifies hook emits reminder when .active exists
- Verifies reminder includes plan preview

#### test-ralph-status-blocks.sh
Unit test for Ralph status block parsing (~1 second):
- Verifies status block extraction from output
- Verifies all required fields present
- Verifies enum values are valid
- Verifies field format correctness

### Integration Tests (use --integration flag)

#### test-subagent-driven-development-integration.sh
Full workflow execution test (~10-30 minutes):
- Creates real test project with Node.js setup
- Creates implementation plan with 2 tasks
- Executes plan using subagent-driven-development
- Verifies actual behaviors:
  - Plan read once at start (not per task)
  - Full task text provided in subagent prompts
  - Subagents perform self-review before reporting
  - Spec compliance review happens before code quality
  - Spec reviewer reads code independently
  - Working implementation is produced
  - Tests pass
  - Proper git commits created

**What it tests:**
- The workflow actually works end-to-end
- Our improvements are actually applied
- Subagents follow the skill correctly
- Final code is functional and tested

#### test-manus-resume-integration.sh
Manus planning session resume test (~4-6 minutes):
- Session 1: Starts manus-planning task, creates files
- Session 2: Resumes task in new session
- Verifies:
  - Manus files created (task_plan.md, findings.md, progress.md)
  - .active marker controls behavior
  - Session resume works across invocations
  - .active removed on completion

#### test-ralph-status-emission-integration.sh
Ralph status block emission test (~2-3 minutes):
- Creates Ralph project with simple task
- Executes task with Ralph-style prompt
- Verifies:
  - Status block emitted at end
  - All required fields present
  - Field values are valid

#### test-manus-ralph-combined-integration.sh
Combined manus + Ralph workflow test (~2-3 minutes):
- Creates Ralph project
- Starts manus-planning in Ralph loop
- Verifies:
  - Manus files created
  - Status block emitted
  - EXIT_SIGNAL stays false while manus active
  - Both systems work together

### Slim Test Suite

The new manus/Ralph tests form a slim test suite targeting ~10-15 minutes total runtime:
- 2 fast unit tests (< 1 minute total)
- 3 focused integration tests (10-12 minutes total)
- Tests core superpowers-ng differentiators:
  - Manus-styled planning with session persistence
  - Ralph loop integration with status blocks

## Adding New Tests

1. Create new test file: `test-<skill-name>.sh`
2. Source test-helpers.sh
3. Write tests using `run_claude` and assertions
4. Add to test list in `run-skill-tests.sh`
5. Make executable: `chmod +x test-<skill-name>.sh`

## Timeout Considerations

- Default timeout: 5 minutes per test
- Claude Code may take time to respond
- Adjust with `--timeout` if needed
- Tests should be focused to avoid long runs

## Debugging Failed Tests

With `--verbose`, you'll see full Claude output:
```bash
./run-skill-tests.sh --verbose --test test-subagent-driven-development.sh
```

Without verbose, only failures show output.

## CI/CD Integration

To run in CI:
```bash
# Run with explicit timeout for CI environments
./run-skill-tests.sh --timeout 900

# Exit code 0 = success, non-zero = failure
```

## Notes

- Tests verify skill *instructions*, not full execution
- Full workflow tests would be very slow
- Focus on verifying key skill requirements
- Tests should be deterministic
- Avoid testing implementation details
