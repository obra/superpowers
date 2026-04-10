# Testing Superpowers Skills

This document describes how to test Superpowers skills, particularly the integration tests for complex skills like `subagent-driven-development`.

## Overview

Testing skills that involve subagents, workflows, and complex interactions requires running actual Claude Code sessions in headless mode and verifying their behavior through session transcripts.

## Test Structure

```
tests/
├── claude-code/
│   ├── test-helpers.sh                    # Shared test utilities
│   ├── test-subagent-driven-development-integration.sh
│   ├── analyze-token-usage.py             # Token analysis tool
│   └── run-skill-tests.sh                 # Test runner (if exists)
```

## Running Tests

### Integration Tests

Integration tests execute real Claude Code sessions with actual skills:

```bash
# Run the subagent-driven-development integration test
cd tests/claude-code
./test-subagent-driven-development-integration.sh
```

**Note:** Integration tests can take 10-30 minutes as they execute real implementation plans with multiple subagents.

### Requirements

- Must run from the **superpowers plugin directory** (not from temp directories)
- Claude Code must be installed and available as `claude` command
- Local dev marketplace must be enabled: `"superpowers@superpowers-dev": true` in `~/.claude/settings.json`

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

### Skills Not Loading

**Problem**: Skill not found when running headless tests

**Solutions**:
1. Ensure you're running FROM the superpowers directory: `cd /path/to/superpowers && tests/...`
2. Check `~/.claude/settings.json` has `"superpowers@superpowers-dev": true` in `enabledPlugins`
3. Verify skill exists in `skills/` directory

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

## Skill Validation: standards-context-retrieval

This section documents a RED -> GREEN -> REFACTOR validation pass for `skills/standards-context-retrieval/SKILL.md`.

### RED Baseline (without skill enforcement)

Three pressure scenarios were run in read-only mode:

1. Add `--json` output to a Node CLI under time pressure.
2. Fix a flaky Python race-condition test with merge pressure.
3. Refactor a skill doc quickly in an unfamiliar module.

Observed baseline failures:

- Agents sometimes used a "mental checklist" and skipped an explicit constraints artifact.
- Standards retrieval was often "lightweight" and not tied to a code-type source map.
- Compliance statements were provided, but not always backed by explicit source paths.

### GREEN Changes Applied

`skills/standards-context-retrieval/SKILL.md` was tightened to address RED failures:

- Added an Iron Law: no implementation before an explicit Constraints Summary.
- Added hard bans on "mental checklist only" and "retrieve standards later".
- Added code-type to source quick-reference mapping.
- Required `Sources Consulted` in the constraints template.
- Added rationalization table and red-flag restart criteria.

### REFACTOR Validation (with skill enforced)

The same scenario classes were re-run after updates, requiring the agent to follow the skill first.

Observed improvements:

- Responses consistently started with an explicit Constraints Summary.
- Source paths were listed before execution steps.
- Missing categories were called out explicitly (for example, `none found`).
- Time pressure no longer bypassed standards and verification constraints.

Residual risk:

- This validation uses scenario-driven subagent behavior checks, not a dedicated automated script under `tests/claude-code`.
- If this skill becomes a hard repository gate, add an integration test script similar to other complex workflow skills.

## Real-World Validation Loop (Automated)

To validate a skill in a real project and auto-collect evidence for optimization, use:

- Skill: `skills/real-world-skill-validation/SKILL.md`
- Runner: `tests/claude-code/test-real-world-skill-validation.sh`
- Analyzer: `tests/claude-code/analyze-real-world-skill-validation.py`

### Run GREEN (skill enforced)

```bash
cd tests/claude-code
./test-real-world-skill-validation.sh \
  --target-repo /absolute/path/to/real-project \
  --skill superpowers:standards-context-retrieval \
  --scenario feature
```

### Run RED baseline (without skill enforcement)

```bash
cd tests/claude-code
./test-real-world-skill-validation.sh \
  --target-repo /absolute/path/to/real-project \
  --skill superpowers:standards-context-retrieval \
  --scenario feature \
  --baseline
```

### Artifacts

Each run creates a folder: `docs/testing-reports/<run-label>/`

- `prompt.txt`: Exact prompt used
- `claude-output.txt`: Raw command output
- `meta.txt`: Run metadata (scenario, skill, baseline mode, session path)
- `report.md`: Structured analysis report and compliance score

### Suggested campaign

Run both RED and GREEN for:

1. `feature`
2. `bugfix`
3. `refactor`

Then compare reports and update target skill with evidence-mapped changes:

- Missing structure -> strengthen required sections
- Rationalization hits -> add explicit counters and red flags
- Weak source traceability -> tighten "Sources Consulted" requirements

### V2 Report Template

Use the V2 template for consistent RED/GREEN fairness control, pass/fail gates, and evidence-mapped REFACTOR inputs:

- `docs/templates/real-world-skill-validation-v2.md`

## Skill Validation: project-standards-authoring

Validation attempted with RED -> GREEN runners:

- RED report: `docs/testing-reports/project-standards-authoring-red/report.md`
- GREEN report: `docs/testing-reports/project-standards-authoring-green/report.md`

Key checks configured in the runner:

- Propose 2-3 classification schemes before artifact generation
- Require explicit human scheme selection before progressing
- Require per-type retrieval framing (`standards-context-retrieval` / Constraints Summary)
- Verify output path intents (`.cursor/rules/`, `docs/checklist/`, `reuse-inventory`)

Environment note:

- These runs were executed from Cursor where `claude -p` endpoint was unavailable (`404 page not found`), so both runs were marked `SKIPPED` by the runner's environment guard.
- Re-run these commands in a working Claude Code runtime to collect behavioral evidence:
  - `TIMEOUT_SECONDS=20 ./tests/claude-code/test-project-standards-authoring.sh red`
  - `TIMEOUT_SECONDS=20 ./tests/claude-code/test-project-standards-authoring.sh green`

### Cursor-specific RED/GREEN (supplemental)

To keep validation moving in Cursor-only environments, we also captured a Cursor harness RED/GREEN pair:

- Cursor RED report: `docs/testing-reports/project-standards-authoring-cursor-red/report.md`
- Cursor GREEN report: `docs/testing-reports/project-standards-authoring-cursor-green/report.md`

Artifacts include raw response captures:

- `docs/testing-reports/project-standards-authoring-cursor-red/assistant-output.md`
- `docs/testing-reports/project-standards-authoring-cursor-green/assistant-output.md`

What this supplemental run verifies:

- RED shows the expected failure mode (no classification gate, no retrieval framing).
- GREEN shows stage-gated behavior and required output path discipline.
- Both runs are suitable for behavior-shaping evidence when Claude CLI is unavailable.
