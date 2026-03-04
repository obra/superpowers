# Testing Superpowers Skills

How to test superpowers skills using Claude Code CLI in headless mode.

## Overview

Testing skills that involve subagents, workflows, and complex interactions requires running actual Claude Code sessions in headless mode and verifying their behavior through session transcripts.

## Test Structure

```
tests/
├── claude-code/
│   ├── test-helpers.sh                    # Shared test utilities
│   ├── analyze-token-usage.py             # Token analysis tool
│   └── run-skill-tests.sh                 # Test runner
├── skill-triggering/
│   ├── run-all.sh                         # Skill triggering tests
│   └── prompts/                           # Test prompts per skill
└── explicit-skill-requests/
    ├── run-all.sh                         # Explicit request tests
    └── prompts/                           # Multi-turn test prompts
```

## Running Tests

### Skill Triggering Tests

```bash
cd tests/skill-triggering
./run-all.sh
```

### Explicit Skill Request Tests

```bash
cd tests/explicit-skill-requests
./run-all.sh
```

### Requirements

- Must run from the **superpowers plugin directory** (not from temp directories)
- Claude Code must be installed and available as `claude` command
- Local dev marketplace must be enabled in `~/.claude/settings.json`

## Token Analysis Tool

Analyze token usage from any Claude Code session:

```bash
python3 tests/claude-code/analyze-token-usage.py ~/.claude/projects/<project-dir>/<session-id>.jsonl
```

### Finding Session Files

```bash
# Find recent sessions
find ~/.claude/projects -name "*.jsonl" -mmin -60 | sort -r | head -5
```

### What It Shows

- **Main session usage**: Token usage by the coordinator
- **Per-subagent breakdown**: Each Task invocation with agent ID, description, tokens, and cost
- **Totals**: Overall token usage and cost estimate

## Troubleshooting

### Skills Not Loading

1. Ensure you're running FROM the superpowers directory
2. Check `~/.claude/settings.json` has the plugin enabled
3. Verify skill exists in `skills/` directory

### Permission Errors

Use `--permission-mode bypassPermissions` and `--add-dir /path/to/dir`

### Test Timeouts

Increase timeout or review task complexity. Default is 5 minutes per test.

## Writing New Tests

### Template

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

TEST_PROJECT=$(create_test_project)
trap "cleanup_test_project $TEST_PROJECT" EXIT

cd "$TEST_PROJECT"

# Run Claude with skill
cd "$SCRIPT_DIR/../.." && timeout 1800 claude -p "Your test prompt" \
  --allowed-tools=all \
  --add-dir "$TEST_PROJECT" \
  --permission-mode bypassPermissions \
  2>&1 | tee output.txt

# Verify behavior by parsing session transcript
```

### Best Practices

1. **Always cleanup**: Use trap to cleanup temp directories
2. **Parse transcripts**: Don't grep user-facing output — parse the `.jsonl` session file
3. **Grant permissions**: Use `--permission-mode bypassPermissions` and `--add-dir`
4. **Run from plugin dir**: Skills only load when running from the superpowers directory
5. **Show token usage**: Always include token analysis for cost visibility
6. **Test real behavior**: Verify actual files created, tests passing, commits made
