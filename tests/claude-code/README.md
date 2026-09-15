# Claude Code Skills Tests

Automated tests for superpowers skills using Claude Code CLI.

## Overview

This test suite verifies that skills are loaded correctly and Claude follows them as expected. Tests invoke Claude Code in headless mode (`claude -p`) and verify the behavior.

## Requirements

- Claude Code CLI installed and in PATH (`claude --version` should work)
- Local superpowers plugin installed (see main README for installation)

## Running Tests

### Run all fast tests (recommended):
```bash
./run-skill-tests.sh
```

### Run integration tests (slow, 10-30 minutes):
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
- Skill loading and its central "no automatic delegation" rule
- Default execution model (primary agent implements directly, not a fresh subagent per task)
- Per-task loop: focused verification, self-review, fix, re-test
- Final verification: full test suite, working-tree inspection, plan/acceptance-criteria comparison
- Delegation is optional and benefit-driven, not automatic per task
- No mandatory reviewer/fixer agent, no recursive delegation by default
- Git history (staging, commits, push, branches) is user-owned
- Current working tree is the default; worktrees are optional
- No execution ledger or hidden progress state

### Integration Tests (use --integration flag)

#### test-subagent-driven-development-integration.sh
Full workflow execution test (~10-30 minutes):
- Creates real test project with Node.js setup
- Creates a small, already-approved implementation plan with 2 tasks
- Executes the plan directly using subagent-driven-development
- Verifies actual behaviors:
  - The skill was invoked
  - The implementation matches the plan and tests pass
  - The working tree holds the implementation, uncommitted
  - No automatic commit, staging, branch change, or other Git mutation occurred
  - No hidden execution ledger/workspace was created

Delegating a task to a subagent remains a valid optional choice under this
skill. This test does not require, forbid, or assert on whether one was
used — only that the workflow does not depend on it.

**What it tests:**
- The direct-execution workflow actually works end-to-end
- Final code is functional and tested
- Git history is left untouched for the user to review and commit

#### test-worktree-native-preference.sh
RED-GREEN-REFACTOR validation for the using-git-worktrees skill (~5 minutes):
- RED: skill without Step 1a — agent should use `git worktree add`
- GREEN: skill with Step 1a — agent should use the native EnterWorktree tool
- PRESSURE: same as GREEN under urgency framing with pre-existing `.worktrees/`
- Drill scenario `worktree-creation-under-pressure.yaml` covers the PRESSURE phase only

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
