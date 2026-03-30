# Testing Superpowers Skills

This document describes how to test Superpowers skills with the real agent CLIs that the repository currently supports in automated form: Claude Code and Codex.

## Overview

Testing skills that involve subagents, workflows, and complex interactions requires running actual headless agent sessions and verifying their behavior from machine-readable evidence.

- Claude Code tests use Claude session transcripts under `~/.claude/projects/`
- Codex tests use `codex exec --json` output plus isolated session rollouts under temporary `$CODEX_HOME/sessions`, with both skills and copied native agent TOMLs installed into the isolated environment

## Test Structure

```
tests/
├── codex/
│   ├── README.md                           # Codex-specific usage notes
│   ├── test-helpers.sh                    # Shared Codex test utilities
│   ├── test-subagent-driven-development.sh
│   ├── test-subagent-driven-development-integration.sh
│   ├── test-document-review-system.sh
│   └── run-skill-tests.sh
├── claude-code/
│   ├── test-helpers.sh                    # Shared test utilities
│   ├── test-using-superpowers-bootstrap.sh
│   ├── test-subagent-driven-development.sh
│   ├── test-subagent-driven-development-integration.sh
│   ├── test-document-review-system.sh
│   ├── analyze-token-usage.py             # Token analysis tool
│   └── run-skill-tests.sh
```

## Running Tests

### Codex

Run the fast Codex suite:

```bash
./tests/codex/run-skill-tests.sh
```

Run the full Codex suite, including slow real integrations:

```bash
./tests/codex/run-skill-tests.sh --integration
```

Run a single Codex test:

```bash
./tests/codex/run-skill-tests.sh --test test-document-review-system.sh --integration
```

### Claude Code

Run the fast Claude Code suite:

```bash
./tests/claude-code/run-skill-tests.sh
```

Run the full Claude Code suite, including real integrations:

```bash
./tests/claude-code/run-skill-tests.sh --integration
```

Run a single Claude Code test:

```bash
./tests/claude-code/run-skill-tests.sh --test test-using-superpowers-bootstrap.sh
```

The fast suite now includes a direct bootstrap check for the `using-superpowers`
hook path:

- `test-using-superpowers-bootstrap.sh` verifies `hooks/session-start`
  injects the current `using-superpowers` content and chooses the correct JSON
  field for Claude Code, Cursor, and fallback environments

Integration tests execute real Claude Code sessions with actual skills:

```bash
./tests/claude-code/run-skill-tests.sh --integration
```

**Note:** Integration tests can take 10-30 minutes as they execute real implementation plans with multiple subagents.

### Requirements

- Run from the repository root or a test subdirectory, not from a disposable temp checkout of the tests alone
- Claude Code tests require `claude` plus the local dev marketplace plugin enabled
- Codex tests require `codex`, `jq`, valid `auth.json`, and Node.js for the fixture projects

## Integration Test: subagent-driven-development

### What It Tests

The integration test verifies the `subagent-driven-development` skill correctly:

1. **Plan Loading**: Reads the plan once at the beginning
2. **Full Task Text**: Provides complete task descriptions to subagents (doesn't make them read files)
3. **Self-Review**: Ensures subagents perform self-review before reporting
4. **Review Order**: Runs spec compliance review before code quality review
5. **Review Loops**: Uses review loops when issues are found
6. **Independent Verification**: Spec reviewer reads code independently, doesn't trust implementer reports

### How It Works

1. **Setup**: Creates a temporary Node.js project with a minimal implementation plan
2. **Execution**: Runs Claude Code in headless mode with the skill
3. **Verification**: Parses the session transcript (`.jsonl` file) to verify:
   - Skill tool was invoked
   - Subagents were dispatched (Task tool)
   - TodoWrite was used for tracking
   - Implementation files were created
   - Tests pass
   - Git commits show proper workflow
4. **Token Analysis**: Shows token usage breakdown by subagent

## Codex Integration Tests

### What They Test

The Codex suite currently has:

1. `test-subagent-driven-development.sh`
   Fast rubric-based semantic checks that the `subagent-driven-development` skill is described correctly without depending on exact phrasing.
2. `test-subagent-driven-development-integration.sh`
   A real end-to-end implementation run against a disposable Node fixture project.
3. `test-document-review-system.sh`
   A real spec review run against a deliberately flawed spec document.

### How Codex Evidence Works

Codex tests prefer structured evidence over transcript scraping:

1. `codex exec --json` captures top-level events such as:
   - `item.started` / `item.updated` / `item.completed`
   - `todo_list`
   - `collab_tool_call`
   - `turn.completed`
2. Each test also uses an isolated temporary `CODEX_HOME`, then verifies that a session rollout file was written under `$CODEX_HOME/sessions`
3. Fast semantic tests extract only the final agent message from the JSON stream so assertions are not polluted by intermediate tool traces
4. The fast `subagent-driven-development` test then runs a second Codex evaluation pass using:
   - the relevant checked-in skill source text
   - the question asked
   - the answer under review
   - a rubric of required meanings

This lets the suite judge semantic correctness while staying grounded in repository source documents rather than loose regex matches.

### Codex Environment Notes

- The Codex helpers copy the original `auth.json` into the temporary `CODEX_HOME` when present
- Skills are installed into the isolated home at `$HOME/.agents/skills/superpowers`
- Native Superpowers Codex role TOMLs are installed directly into `$CODEX_HOME/agents/`
- Current Codex releases already expose subagents by default in normal setups; the test harness no longer forces `features.multi_agent = true` as its default assumption
- The Codex sandbox may block writes inside `.git`, even in disposable fixture repositories
- The real subagent integration test therefore accepts either:
  - actual additional commits in the fixture repo, or
  - explicit evidence that Codex attempted to commit but `.git` writes were blocked by sandbox policy

This behavior is intentional: the test should distinguish workflow regressions from environment-imposed git restrictions.

### Test Output

```
========================================
 Integration Test: subagent-driven-development
========================================

Test project: /tmp/tmp.xyz123

=== Verification Tests ===

Test 1: Skill tool invoked...
  [PASS] subagent-driven-development skill was invoked

Test 2: Subagents dispatched...
  [PASS] 7 subagents dispatched

Test 3: Task tracking...
  [PASS] TodoWrite used 5 time(s)

Test 6: Implementation verification...
  [PASS] src/math.js created
  [PASS] add function exists
  [PASS] multiply function exists
  [PASS] test/math.test.js created
  [PASS] Tests pass

Test 7: Git commit history...
  [PASS] Multiple commits created (3 total)

Test 8: No extra features added...
  [PASS] No extra features added

=========================================
 Token Usage Analysis
=========================================

Usage Breakdown:
----------------------------------------------------------------------------------------------------
Agent           Description                          Msgs      Input     Output      Cache     Cost
----------------------------------------------------------------------------------------------------
main            Main session (coordinator)             34         27      3,996  1,213,703 $   4.09
3380c209        implementing Task 1: Create Add Function     1          2        787     24,989 $   0.09
34b00fde        implementing Task 2: Create Multiply Function     1          4        644     25,114 $   0.09
3801a732        reviewing whether an implementation matches...   1          5        703     25,742 $   0.09
4c142934        doing a final code review...                    1          6        854     25,319 $   0.09
5f017a42        a code reviewer. Review Task 2...               1          6        504     22,949 $   0.08
a6b7fbe4        a code reviewer. Review Task 1...               1          6        515     22,534 $   0.08
f15837c0        reviewing whether an implementation matches...   1          6        416     22,485 $   0.07
----------------------------------------------------------------------------------------------------

TOTALS:
  Total messages:         41
  Input tokens:           62
  Output tokens:          8,419
  Cache creation tokens:  132,742
  Cache read tokens:      1,382,835

  Total input (incl cache): 1,515,639
  Total tokens:             1,524,058

  Estimated cost: $4.67
  (at $3/$15 per M tokens for input/output)

========================================
 Test Summary
========================================

STATUS: PASSED
```

## Token Analysis Tool

### Usage

Analyze token usage from any Claude Code session:

```bash
python3 tests/claude-code/analyze-token-usage.py ~/.claude/projects/<project-dir>/<session-id>.jsonl
```

### Finding Session Files

Session transcripts are stored in `~/.claude/projects/` with the working directory path encoded:

```bash
# Example for /Users/jesse/Documents/GitHub/superpowers/superpowers
SESSION_DIR="$HOME/.claude/projects/-Users-jesse-Documents-GitHub-superpowers-superpowers"

# Find recent sessions
ls -lt "$SESSION_DIR"/*.jsonl | head -5
```

### What It Shows

- **Main session usage**: Token usage by the coordinator (you or main Claude instance)
- **Per-subagent breakdown**: Each Task invocation with:
  - Agent ID
  - Description (extracted from prompt)
  - Message count
  - Input/output tokens
  - Cache usage
  - Estimated cost
- **Totals**: Overall token usage and cost estimate

### Understanding the Output

- **High cache reads**: Good - means prompt caching is working
- **High input tokens on main**: Expected - coordinator has full context
- **Similar costs per subagent**: Expected - each gets similar task complexity
- **Cost per task**: Typical range is $0.05-$0.15 per subagent depending on task

## Troubleshooting

### Codex Authentication Issues

**Problem**: `codex exec` fails in tests even though Codex works normally

**Solutions**:
1. Verify `~/.codex/auth.json` (or your current `CODEX_HOME/auth.json`) is present and valid
2. Run a quick real command outside the suite: `codex exec --skip-git-repo-check -C /tmp "Reply with exactly OK."`
3. Remember the test helper uses a temporary `CODEX_HOME`; authentication is copied in, not shared live

### Codex Session File Not Found

**Problem**: The test cannot find a persisted rollout in `sessions/`

**Solutions**:
1. Check whether the Codex invocation actually completed successfully
2. Look under the temporary test `CODEX_HOME`, not your real `~/.codex`
3. Inspect `tests/codex/test-helpers.sh` and `tests/codex/README.md` for the current session discovery logic

### Codex Git Writes Blocked

**Problem**: Integration test output shows `.git/index.lock` or other `.git` writes failing

**Explanation**:
Codex can run inside a sandbox that treats `.git` metadata as read-only even when the working tree itself is writable.

**What to do**:
1. Treat it as environment evidence first, not an immediate test bug
2. Confirm the workflow still attempted commits and reported the blocker explicitly
3. If real repo commits are a hard requirement for a future scenario, revisit the fixture or Codex sandbox policy assumptions

### Skills Not Loading

**Problem**: Skill not found when running headless tests

**Solutions**:
1. Ensure you're running FROM the superpowers directory: `cd /path/to/superpowers && tests/...`
2. Verify the test command includes `--plugin-dir /path/to/superpowers/.claude-plugin`
3. Verify skill exists in `skills/` directory
4. If you want a persistent local install outside the harness, check `~/.claude/settings.json` has `"superpowers@superpowers-dev": true` in `enabledPlugins`

### Permission Errors

**Problem**: Claude blocked from writing files or accessing directories

**Solutions**:
1. Use `--permission-mode bypassPermissions` flag
2. Use `--add-dir /path/to/temp/dir` to grant access to test directories
3. Check file permissions on test directories

### Test Timeouts

**Problem**: Test takes too long and times out

**Solutions**:
1. Increase timeout: `timeout 1800 claude ...` (30 minutes)
2. Check for infinite loops in skill logic
3. Review subagent task complexity

### Session File Not Found

**Problem**: Can't find session transcript after test run

**Solutions**:
1. Check the correct project directory in `~/.claude/projects/`
2. Use `find ~/.claude/projects -name "*.jsonl" -mmin -60` to find recent sessions
3. Verify test actually ran (check for errors in test output)

## Writing New Integration Tests

### Template

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Create test project
TEST_PROJECT=$(create_test_project)
trap "cleanup_test_project $TEST_PROJECT" EXIT

# Set up test files...
cd "$TEST_PROJECT"

# Run Claude with skill
PROMPT="Your test prompt here"
cd "$SCRIPT_DIR/../.." && timeout 1800 claude -p "$PROMPT" \
  --allowed-tools=all \
  --add-dir "$TEST_PROJECT" \
  --permission-mode bypassPermissions \
  2>&1 | tee output.txt

# Find and analyze session
WORKING_DIR_ESCAPED=$(echo "$SCRIPT_DIR/../.." | sed 's/\\//-/g' | sed 's/^-//')
SESSION_DIR="$HOME/.claude/projects/$WORKING_DIR_ESCAPED"
SESSION_FILE=$(find "$SESSION_DIR" -name "*.jsonl" -type f -mmin -60 | sort -r | head -1)

# Verify behavior by parsing session transcript
if grep -q '"name":"Skill".*"skill":"your-skill-name"' "$SESSION_FILE"; then
    echo "[PASS] Skill was invoked"
fi

# Show token analysis
python3 "$SCRIPT_DIR/analyze-token-usage.py" "$SESSION_FILE"
```

### Best Practices

1. **Always cleanup**: Use trap to cleanup temp directories
2. **Parse transcripts**: Don't grep user-facing output - parse the `.jsonl` session file
3. **Grant permissions**: Use `--permission-mode bypassPermissions` and `--add-dir`
4. **Run from plugin dir**: Skills only load when running from the superpowers directory
5. **Show token usage**: Always include token analysis for cost visibility
6. **Test real behavior**: Verify actual files created, tests passing, commits made

## Session Transcript Format

Session transcripts are JSONL (JSON Lines) files where each line is a JSON object representing a message or tool result.

### Key Fields

```json
{
  "type": "assistant",
  "message": {
    "content": [...],
    "usage": {
      "input_tokens": 27,
      "output_tokens": 3996,
      "cache_read_input_tokens": 1213703
    }
  }
}
```

### Tool Results

```json
{
  "type": "user",
  "toolUseResult": {
    "agentId": "3380c209",
    "usage": {
      "input_tokens": 2,
      "output_tokens": 787,
      "cache_read_input_tokens": 24989
    },
    "prompt": "You are implementing Task 1...",
    "content": [{"type": "text", "text": "..."}]
  }
}
```

The `agentId` field links to subagent sessions, and the `usage` field contains token usage for that specific subagent invocation.
