# Testing Superpowers Optimized

How to run tests for skills, hooks, and workflows.

## Overview

Tests run via Claude Code CLI in headless mode. There is no npm/pytest/etc — the plugin has no runtime dependencies.

**Requirement:** `claude` CLI installed and in PATH.

## Test Structure

```
tests/
├── claude-code/                          # Claude Code skill tests
│   ├── run-skill-tests.sh                # Test runner (--integration for slow tests)
│   ├── test-helpers.sh                   # Shared utilities
│   ├── test-subagent-driven-development.sh          # Fast: skill loading
│   ├── test-subagent-driven-development-integration.sh  # Slow: full workflow
│   ├── test-subagent-hook-scope.sh       # Verifies hooks fire inside subagents
│   └── analyze-token-usage.py            # Token/cost analysis for session transcripts
├── skill-triggering/                     # Does Claude trigger the right skill?
│   ├── run-all.sh                        # Runs all 6 skill trigger tests
│   ├── run-test.sh                       # Single skill trigger test runner
│   └── prompts/                          # Natural-language prompts per skill
│       ├── systematic-debugging.txt
│       ├── test-driven-development.txt
│       ├── writing-plans.txt
│       ├── dispatching-parallel-agents.txt
│       ├── executing-plans.txt
│       └── requesting-code-review.txt
├── explicit-skill-requests/              # Does Claude honor explicit skill requests?
│   ├── run-all.sh                        # Runs all explicit request tests
│   ├── run-test.sh                       # Single test runner
│   ├── run-multiturn-test.sh             # Multi-turn conversation tests
│   ├── run-extended-multiturn-test.sh    # Extended multi-turn tests
│   ├── run-haiku-test.sh                 # Tests with Haiku model
│   ├── run-claude-describes-sdd.sh       # Claude describes SDD workflow
│   └── prompts/                          # Various request phrasings
├── subagent-driven-dev/                  # Full project execution tests
│   ├── run-test.sh                       # Test runner (takes test name)
│   ├── go-fractals/                      # Go project test case
│   │   ├── design.md
│   │   ├── plan.md
│   │   └── scaffold.sh
│   └── svelte-todo/                      # Svelte project test case
│       ├── design.md
│       ├── plan.md
│       └── scaffold.sh
└── opencode/                             # OpenCode compatibility tests
    ├── run-tests.sh                      # Test runner (--integration for slow)
    ├── setup.sh
    ├── test-plugin-loading.sh            # Plugin structure validation
    ├── test-skills-core.sh               # skills-core.js library functions
    ├── test-tools.sh                     # use_skill/find_skills (integration)
    └── test-priority.sh                  # Skill priority resolution (integration)
```

## Running Tests

### Quick reference

```bash
# Fast skill tests (~2 min)
cd tests/claude-code && ./run-skill-tests.sh

# Integration tests (~10-30 min)
cd tests/claude-code && ./run-skill-tests.sh --integration

# Skill triggering tests — does Claude pick the right skill from a natural prompt?
cd tests/skill-triggering && ./run-all.sh

# Explicit skill request tests — does Claude honor "use X skill"?
cd tests/explicit-skill-requests && ./run-all.sh

# Full project execution tests
cd tests/subagent-driven-dev && ./run-test.sh go-fractals
cd tests/subagent-driven-dev && ./run-test.sh svelte-todo

# OpenCode compatibility
cd tests/opencode && ./run-tests.sh
cd tests/opencode && ./run-tests.sh --integration
```

### Claude Code skill tests

The main test suite. Fast tests verify skill loading and requirements. Integration tests execute real implementation plans with multiple subagents.

```bash
cd tests/claude-code

# Fast tests only (~2 min)
./run-skill-tests.sh

# Include integration tests (~10-30 min)
./run-skill-tests.sh --integration

# Options
./run-skill-tests.sh --verbose           # Show full output
./run-skill-tests.sh --test TEST.sh      # Run specific test
./run-skill-tests.sh --timeout 600       # Custom timeout (seconds)
```

### Skill triggering tests

Verifies that Claude triggers the correct skill when given a natural prompt (without mentioning the skill name). Tests 6 skills: systematic-debugging, test-driven-development, writing-plans, dispatching-parallel-agents, executing-plans, requesting-code-review.

```bash
cd tests/skill-triggering

# All skills
./run-all.sh

# Single skill
./run-test.sh systematic-debugging prompts/systematic-debugging.txt 3
```

Each test sends a natural prompt, runs Claude for up to N turns, then checks the session transcript for a `Skill` tool invocation matching the expected skill.

### Explicit skill request tests

Tests whether Claude correctly invokes a skill when the user explicitly asks for it (e.g., "use subagent-driven-development").

```bash
cd tests/explicit-skill-requests
./run-all.sh
```

### Subagent-driven development project tests

End-to-end tests that scaffold a real project, execute a plan via subagent-driven-development, and verify the output.

```bash
cd tests/subagent-driven-dev

# Go project (fractal generator)
./run-test.sh go-fractals

# Svelte project (todo app)
./run-test.sh svelte-todo

# Custom plugin directory
./run-test.sh go-fractals --plugin-dir /path/to/plugin
```

Output goes to `/tmp/superpowers-tests/<timestamp>/` with the project files and Claude's session log.

### Subagent hook scope test

Verifies that PreToolUse and PostToolUse safety hooks fire inside subagents, not just in the main session. This is a security-critical test — if hooks don't fire in subagents, destructive commands bypass all safety rails.

```bash
cd tests/claude-code
./test-subagent-hook-scope.sh
```

### OpenCode tests

Compatibility tests for the OpenCode plugin adapter.

```bash
cd tests/opencode

# Structural tests (no OpenCode required)
./run-tests.sh

# Integration tests (requires OpenCode)
./run-tests.sh --integration
```

## Token Analysis

Analyze token usage and cost from any Claude Code session transcript:

```bash
python3 tests/claude-code/analyze-token-usage.py <session-file>.jsonl
```

### Finding session files

Session transcripts are stored in `~/.claude/projects/` with the working directory path encoded:

```bash
# Find recent sessions
SESSION_DIR="$HOME/.claude/projects/<encoded-working-dir>"
ls -lt "$SESSION_DIR"/*.jsonl | head -5
```

### Understanding the output

- **High cache reads**: Good — prompt caching is working
- **High input tokens on main**: Expected — coordinator has full context
- **Similar costs per subagent**: Expected — similar task complexity
- **Cost per task**: Typical range is $0.05-$0.15 per subagent

## Session Transcript Format

Session transcripts are JSONL files. Each line is a JSON object.

### Assistant message with usage

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

### Subagent tool result with usage

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

## Troubleshooting

### Skills not loading

1. Run from the plugin directory: `cd /path/to/superpowers-prepared`
2. Use `--plugin-dir` to point to the plugin root
3. Verify skill exists in `skills/` with correct YAML frontmatter

### Permission errors

Use `--dangerously-skip-permissions` or `--permission-mode bypassPermissions` for automated tests. Use `--add-dir /path/to/temp/dir` to grant access to test directories.

### Test timeouts

Default is 5 minutes per test (300s for skill-triggering). Integration tests use `timeout 1800` (30 min). Increase with `--timeout` flag.

### Session file not found

```bash
find ~/.claude/projects -name "*.jsonl" -mmin -60
```

## Writing New Tests

Use `tests/claude-code/test-helpers.sh` for shared utilities (`create_test_project`, `cleanup_test_project`). Parse `.jsonl` session transcripts rather than grepping user-facing output. Always include token analysis for cost visibility.

For skill triggering tests, add a prompt file to `tests/skill-triggering/prompts/<skill-name>.txt` and add the skill name to the `SKILLS` array in `run-all.sh`.
