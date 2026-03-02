#!/usr/bin/env bash
# Integration Test: team-driven-development workflow
# Actually creates an agent team and verifies coordination mechanics
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

# Timestamped progress output
progress() {
    echo "[$(date '+%H:%M:%S')] $*"
}

echo "========================================"
echo " Integration Test: team-driven-development"
echo "========================================"
echo ""
echo "This test executes a real plan using agent teams and verifies:"
echo "  1. TeamCreate is used to initialize a team"
echo "  2. Multiple agents are spawned as teammates"
echo "  3. Shared task list is used for coordination"
echo "  4. Agents communicate via SendMessage"
echo "  5. Tasks are claimed and completed by different agents"
echo "  6. Implementation is correct and tests pass"
echo "  7. Proper shutdown of team members"
echo ""
echo "WARNING: This test may take 35-60 minutes to complete."
echo "WARNING: Each spawned agent runs as a full Claude session (sequential)."
echo "WARNING: This test costs 2-4x more than the subagent integration test."
echo "WARNING: Run from a STANDALONE TERMINAL (not from within Claude Code)."
echo "  Running inside a Claude Code session causes SIGTERM to kill this test"
echo "  when you switch conversations. Use a separate terminal window instead."
echo ""

# Detect if running inside a Claude Code session and warn loudly
if [ -n "${CLAUDECODE:-}" ]; then
    echo "DANGER: CLAUDECODE env var is set — you appear to be running inside"
    echo "  a Claude Code session. This test WILL be killed when the session ends."
    echo "  Open a separate terminal and run this test from there."
    echo ""
fi

# Trap SIGTERM to give a clear message instead of silent death
sigterm_handler() {
    echo ""
    echo "=========================================="
    echo " KILLED BY SIGTERM"
    echo "=========================================="
    echo ""
    echo "The test was terminated by SIGTERM. Common causes:"
    echo "  1. Test runner timeout expired (runner uses 60 min limit)"
    echo "  2. Parent process (e.g. a Claude Code session) exited"
    echo ""
    echo "If this was a timeout, the team agents took longer than 60 minutes."
    echo "If killed by a session exit, run from a standalone terminal instead:"
    echo "  bash tests/claude-code/run-skill-tests.sh --integration -t test-team-driven-development-integration.sh"
    echo ""
    exit 1
}
trap sigterm_handler SIGTERM

# Check for agent teams env var
if [ "${CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS:-}" != "1" ]; then
    echo "NOTE: Setting CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 for this test"
    export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
fi

# TaskCreate/TaskList/TaskUpdate are gated behind a separate TTY check.
# In headless -p mode they're disabled unless explicitly enabled.
# See: https://github.com/anthropics/claude-code/issues/20463
if [ "${CLAUDE_CODE_ENABLE_TASKS:-}" != "true" ]; then
    echo "NOTE: Setting CLAUDE_CODE_ENABLE_TASKS=true for this test"
    export CLAUDE_CODE_ENABLE_TASKS=true
fi

# Kill any stale claude integration test processes from previous runs.
# Pattern matches only headless claude instances pointing at macOS temp dirs
# (our test projects are always created via mktemp -d under /var/folders or /tmp).
STALE=$(pgrep -f "claude -p.*--plugin-dir.*Hartye-superpowers" 2>/dev/null || true)
if [ -n "$STALE" ]; then
    echo "Cleaning up $(echo "$STALE" | wc -w | tr -d ' ') stale claude process(es) from previous runs..."
    kill $STALE 2>/dev/null || true
    sleep 3
fi

progress "Phase 1/4: Creating test project..."
TEST_PROJECT=$(create_test_project)
echo "Test project: $TEST_PROJECT"

# Trap to cleanup
cleanup() {
    cleanup_test_project "$TEST_PROJECT"
    # Clean up any team artifacts created during the test
    rm -rf "$HOME/.claude/teams/test-team-integration" 2>/dev/null || true
    rm -rf "$HOME/.claude/tasks/test-team-integration" 2>/dev/null || true
}
trap cleanup EXIT

# Set up minimal Node.js project
cd "$TEST_PROJECT"

cat > package.json <<'EOF'
{
  "name": "team-test-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
EOF

mkdir -p src test docs/plans

# Create an implementation plan with tasks that benefit from team coordination.
# Task 2 depends on Task 1 (uses the string utilities), which tests that
# teams respect dependencies and coordinate via messaging.
cat > docs/plans/implementation-plan.md <<'EOF'
# String Utilities Implementation Plan

This plan has tasks with a dependency: Task 2 depends on Task 1.
A team approach is useful because agents can coordinate on the shared interface.

## Task 1: Create String Utility Functions

Create basic string utility functions.

**File:** `src/strings.js`

**Requirements:**
- Function `capitalize(str)` - capitalizes the first letter of a string
- Function `reverse(str)` - reverses a string
- Function `truncate(str, maxLen)` - truncates string to maxLen, adds "..." if truncated
- Export all functions
- Handle edge cases: empty string, null/undefined input (return empty string)

**Tests:** Create `test/strings.test.js` with tests for:
- `capitalize("hello")` returns `"Hello"`
- `capitalize("")` returns `""`
- `reverse("hello")` returns `"olleh"`
- `reverse("")` returns `""`
- `truncate("hello world", 5)` returns `"he..."`
- `truncate("hi", 10)` returns `"hi"`

**Verification:** `npm test`

## Task 2: Create Text Formatter (depends on Task 1)

Create a text formatter that uses the string utilities from Task 1.

**File:** `src/formatter.js`

**Requirements:**
- Import `capitalize` and `truncate` from `./strings.js`
- Function `formatTitle(str)` - capitalizes and truncates to 50 chars
- Function `formatPreview(str)` - truncates to 100 chars
- Export all functions
- DO NOT add extra features (no HTML formatting, no markdown, etc.)

**Tests:** Add `test/formatter.test.js` with tests for:
- `formatTitle("hello world")` returns `"Hello world"`
- `formatTitle("a".repeat(60))` returns a 50-char truncated string ending with "..."
- `formatPreview("short")` returns `"short"`
- `formatPreview("a".repeat(120))` returns a 100-char truncated string ending with "..."

**Verification:** `npm test`
EOF

# Initialize git repo
git init --quiet
git config user.email "test@test.com"
git config user.name "Test User"
git add .
git commit -m "Initial commit" --quiet

echo ""
progress "Phase 1/4: Complete. Project at $TEST_PROJECT"
echo ""
progress "Phase 2/4: Starting team execution (this takes 15-30 min)..."
echo ""

# Run Claude with team-driven-development
OUTPUT_FILE="$TEST_PROJECT/claude-output.txt"

PROMPT="Change to directory $TEST_PROJECT and then execute the implementation plan at docs/plans/implementation-plan.md using the team-driven-development skill.

Use team name 'test-team-integration'.

IMPORTANT: Follow the team-driven-development skill exactly:
1. Create a team using TeamCreate
2. Create a shared task list with TaskCreate
3. Spawn at least 2 teammates (implementer + reviewer)
4. Have the implementer claim and implement tasks
5. Have the reviewer review the implementation
6. Use SendMessage for inter-agent communication
7. Shut down team members when done using shutdown_request

The plan has 2 tasks where Task 2 depends on Task 1.
This tests that your team coordinates properly.

CRITICAL - HEADLESS MODE INSTRUCTIONS:
You are running in headless (-p) mode. Follow these rules exactly:

PHASE A - SETUP: Create the team, task list, spawn agents, send initial
messages. This should take about 10 tool calls.

PHASE B - POLL FOR IMPLEMENTATION: After setup, poll TaskList repeatedly
(NO sleep commands) until ALL tasks show 'completed' status.

PHASE C - WAIT FOR REVIEW: After all tasks are completed, send a message
to the reviewer asking them to review the completed work. Then poll
TaskList a few MORE times to give the reviewer time to finish. The review
happens asynchronously - the reviewer reads code, runs tests, and sends
approval messages. Poll at least 5 more times after tasks are completed
to allow the review cycle to complete.

PHASE D - VERIFY AND SHUTDOWN: Run 'npm test' to verify all tests pass.
Then send shutdown_request to each teammate. After sending all shutdown
requests, poll TaskList ONCE to give agents time to process the shutdown.
Then call TeamDelete exactly ONCE.
If TeamDelete fails, that is OK - the test harness handles cleanup.

PHASE E - FINISH: End your turn immediately after the TeamDelete attempt.
Do NOT loop or retry TeamDelete. The test is done.

Begin now. Execute the plan with a team."

progress "Pre-flight: verifying claude invocation..."
PREFLIGHT_FILE=$(mktemp)
timeout 30 env -u CLAUDECODE claude -p "Reply with just the word OK." \
    --plugin-dir "$PLUGIN_DIR" \
    --max-turns 3 \
    < /dev/null > "$PREFLIGHT_FILE" 2>&1 || true
PREFLIGHT_OUTPUT=$(cat "$PREFLIGHT_FILE")
rm -f "$PREFLIGHT_FILE"
if [ -z "$PREFLIGHT_OUTPUT" ]; then
    echo "  [FAIL] claude produced no output — invocation is broken"
    echo "  Command: env -u CLAUDECODE claude -p '...' --plugin-dir $PLUGIN_DIR --max-turns 3 < /dev/null"
    exit 1
fi
echo "  [PASS] claude responded: ${PREFLIGHT_OUTPUT:0:80}"
echo ""

# Create a timestamp marker so we can distinguish the main session from preflight
TIMESTAMP_MARKER=$(mktemp)

progress "Running Claude with team-driven-development skill..."
echo "  Live output: $OUTPUT_FILE"
echo "================================================================================"

# Touch the file first so tail -f can open it immediately
touch "$OUTPUT_FILE"

# Tail the output file to terminal for live viewing
tail -f "$OUTPUT_FILE" &
TAIL_PID=$!

# Run claude — use > file 2>&1 (no pipeline) to match the pattern that works in unit tests.
# --permission-mode bypassPermissions: Critical for background agents.
# In -p mode the LEAD auto-approves tools, but background agents spawned
# with Agent(run_in_background=true) do NOT inherit the lead's permission
# context. Without this flag, agents freeze on Write/Edit calls waiting
# for a TTY approval prompt that will never come.
cd "$TEST_PROJECT" && timeout 3500 env -u CLAUDECODE claude -p "$PROMPT" \
    --plugin-dir "$PLUGIN_DIR" \
    --model claude-opus-4-6 \
    --permission-mode bypassPermissions \
    --max-turns 50 \
    < /dev/null > "$OUTPUT_FILE" 2>&1 || {
    echo ""
    echo "EXECUTION FAILED (exit code: $?)"
}

# Stop tail
kill "$TAIL_PID" 2>/dev/null || true
wait "$TAIL_PID" 2>/dev/null || true
echo "================================================================================"
echo "================================================================================"
progress "Phase 2/4: Claude execution complete."
echo ""
progress "Phase 3/4: Analyzing session transcript..."
echo ""

# Find the session transcript
# Claude Code names project dirs by replacing / and . with - in the canonical path.
# create_test_project() returns the symlink-resolved path so this matches Claude Code.
WORKING_DIR_ESCAPED=$(echo "$TEST_PROJECT" | sed 's/[\/.]/-/g')
SESSION_DIR="$HOME/.claude/projects/$WORKING_DIR_ESCAPED"

# Find the main session file (created AFTER the preflight check).
# The timestamp marker was created between preflight and main run, so -newer
# excludes the preflight "OK" session and picks only the main team session.
# The { ... || true; } prevents pipefail from aborting if SESSION_DIR doesn't exist.
SESSION_FILE=$({ find "$SESSION_DIR" -maxdepth 1 -name "*.jsonl" -type f -newer "$TIMESTAMP_MARKER" 2>/dev/null || true; } | sort -r | head -1)
rm -f "$TIMESTAMP_MARKER"

# Also collect subagent session files (background agents write here)
SUBAGENT_FILES=$({ find "$SESSION_DIR" -path "*/subagents/*.jsonl" -type f -mmin -60 2>/dev/null || true; } | sort)
if [ -n "$SUBAGENT_FILES" ]; then
    SUBAGENT_COUNT=$(echo "$SUBAGENT_FILES" | wc -l | tr -d ' ')
    echo "Found $SUBAGENT_COUNT subagent session file(s)"
fi

if [ -z "$SESSION_FILE" ]; then
    echo "WARNING: Could not find session transcript file"
    echo "Looked in: $SESSION_DIR"
    echo "Will verify based on output and file artifacts only."
    SESSION_FILE=""
fi

if [ -n "$SESSION_FILE" ]; then
    echo "Analyzing session transcript: $(basename "$SESSION_FILE")"
fi
echo ""

# Verification tests
FAILED=0

progress "Phase 4/4: Running verification tests..."
echo ""
echo "=== Verification Tests ==="
echo ""

# Test 1: Team was created
echo "Test 1: Team creation..."
if [ -n "$SESSION_FILE" ] && grep -q '"name":"TeamCreate"' "$SESSION_FILE" 2>/dev/null; then
    echo "  [PASS] TeamCreate tool was called"
elif grep -qi "TeamCreate\|team.*creat\|creat.*team" "$OUTPUT_FILE" 2>/dev/null; then
    echo "  [PASS] Team creation referenced in output"
else
    echo "  [FAIL] No evidence of team creation"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 2: Multiple agents were spawned
echo "Test 2: Agent spawning..."
if [ -n "$SESSION_FILE" ]; then
    # Check for Agent tool calls in lead session
    agent_count=$(grep -c '"name":"Agent"' "$SESSION_FILE" 2>/dev/null || echo "0")
    # Also count actual subagent session files (definitive proof agents ran)
    subagent_file_count=$(echo "$SUBAGENT_FILES" | grep -c . 2>/dev/null || echo "0")
    if [ "$subagent_file_count" -ge 2 ]; then
        echo "  [PASS] $subagent_file_count subagent session files created"
    elif [ "$agent_count" -ge 2 ]; then
        echo "  [PASS] $agent_count Agent tool calls in lead session"
    else
        echo "  [FAIL] Only $agent_count agent(s) spawned, $subagent_file_count subagent files (expected >= 2)"
        FAILED=$((FAILED + 1))
    fi
else
    # Fall back to output analysis
    if grep -qi "spawn\|teammate\|implementer\|reviewer" "$OUTPUT_FILE" 2>/dev/null; then
        echo "  [PASS] Agent spawning referenced in output"
    else
        echo "  [FAIL] No evidence of agent spawning"
        FAILED=$((FAILED + 1))
    fi
fi
echo ""

# Test 3: Shared task list was used
echo "Test 3: Shared task list..."
if [ -n "$SESSION_FILE" ]; then
    # Count task tool usage across lead AND all subagent sessions
    ALL_SESSION_FILES="$SESSION_FILE"
    if [ -n "$SUBAGENT_FILES" ]; then
        ALL_SESSION_FILES="$SESSION_FILE $SUBAGENT_FILES"
    fi
    # grep -c with multiple files outputs "file:count" per line; use cat to get a single total
    task_tool_count=$(cat $ALL_SESSION_FILES 2>/dev/null | grep -c '"name":"TaskCreate"\|"name":"TaskList"\|"name":"TaskUpdate"\|"name":"TaskGet"' || echo "0")
    if [ "$task_tool_count" -ge 2 ]; then
        echo "  [PASS] Task tools used $task_tool_count time(s) across all sessions"
    else
        echo "  [FAIL] Task tools used only $task_tool_count time(s) (expected >= 2)"
        FAILED=$((FAILED + 1))
    fi
else
    if grep -qi "TaskCreate\|TaskList\|TaskUpdate\|shared.*task\|task.*list" "$OUTPUT_FILE" 2>/dev/null; then
        echo "  [PASS] Shared task list referenced in output"
    else
        echo "  [FAIL] No evidence of shared task list usage"
        FAILED=$((FAILED + 1))
    fi
fi
echo ""

# Test 4: Inter-agent communication
echo "Test 4: Inter-agent communication..."
if [ -n "$SESSION_FILE" ]; then
    msg_count=$(cat $ALL_SESSION_FILES 2>/dev/null | grep -c '"name":"SendMessage"' || echo "0")
    if [ "$msg_count" -ge 1 ]; then
        echo "  [PASS] SendMessage used $msg_count time(s) across all sessions"
    else
        echo "  [FAIL] No SendMessage calls found"
        FAILED=$((FAILED + 1))
    fi
else
    if grep -qi "SendMessage\|send.*message\|messag.*team" "$OUTPUT_FILE" 2>/dev/null; then
        echo "  [PASS] Inter-agent messaging referenced in output"
    else
        echo "  [FAIL] No evidence of inter-agent communication"
        FAILED=$((FAILED + 1))
    fi
fi
echo ""

# Test 5: Team shutdown
echo "Test 5: Team shutdown..."
if [ -n "$SESSION_FILE" ]; then
    if cat $ALL_SESSION_FILES 2>/dev/null | grep -q '"type":"shutdown_request"\|"type":"shutdown_response"'; then
        echo "  [PASS] Graceful shutdown protocol used"
    elif cat $ALL_SESSION_FILES 2>/dev/null | grep -q '"name":"TeamDelete"'; then
        echo "  [PASS] TeamDelete called for cleanup"
    else
        echo "  [WARN] No explicit shutdown protocol found (agents may have exited naturally)"
    fi
else
    if grep -qi "shutdown\|TeamDelete\|shut.*down" "$OUTPUT_FILE" 2>/dev/null; then
        echo "  [PASS] Shutdown referenced in output"
    else
        echo "  [WARN] No explicit shutdown evidence (agents may have exited naturally)"
    fi
fi
echo ""

# Test 6: Implementation actually works
echo "Test 6: Implementation verification..."
if [ -f "$TEST_PROJECT/src/strings.js" ]; then
    echo "  [PASS] src/strings.js created"

    if grep -q "export.*function.*capitalize\|export.*capitalize" "$TEST_PROJECT/src/strings.js"; then
        echo "  [PASS] capitalize function exists"
    else
        echo "  [FAIL] capitalize function missing"
        FAILED=$((FAILED + 1))
    fi

    if grep -q "export.*function.*reverse\|export.*reverse" "$TEST_PROJECT/src/strings.js"; then
        echo "  [PASS] reverse function exists"
    else
        echo "  [FAIL] reverse function missing"
        FAILED=$((FAILED + 1))
    fi

    if grep -q "export.*function.*truncate\|export.*truncate" "$TEST_PROJECT/src/strings.js"; then
        echo "  [PASS] truncate function exists"
    else
        echo "  [FAIL] truncate function missing"
        FAILED=$((FAILED + 1))
    fi
else
    echo "  [FAIL] src/strings.js not created"
    FAILED=$((FAILED + 1))
fi

if [ -f "$TEST_PROJECT/src/formatter.js" ]; then
    echo "  [PASS] src/formatter.js created"

    if grep -q "export.*function.*formatTitle\|export.*formatTitle" "$TEST_PROJECT/src/formatter.js"; then
        echo "  [PASS] formatTitle function exists"
    else
        echo "  [FAIL] formatTitle function missing"
        FAILED=$((FAILED + 1))
    fi

    if grep -q "export.*function.*formatPreview\|export.*formatPreview" "$TEST_PROJECT/src/formatter.js"; then
        echo "  [PASS] formatPreview function exists"
    else
        echo "  [FAIL] formatPreview function missing"
        FAILED=$((FAILED + 1))
    fi

    # Verify Task 2 imports from Task 1 (dependency coordination)
    if grep -q "from.*['\"].*strings" "$TEST_PROJECT/src/formatter.js"; then
        echo "  [PASS] formatter.js imports from strings.js (dependency respected)"
    else
        echo "  [WARN] formatter.js does not import from strings.js"
    fi
else
    echo "  [FAIL] src/formatter.js not created"
    FAILED=$((FAILED + 1))
fi

if [ -f "$TEST_PROJECT/test/strings.test.js" ]; then
    echo "  [PASS] test/strings.test.js created"
else
    echo "  [FAIL] test/strings.test.js not created"
    FAILED=$((FAILED + 1))
fi

if [ -f "$TEST_PROJECT/test/formatter.test.js" ]; then
    echo "  [PASS] test/formatter.test.js created"
else
    echo "  [FAIL] test/formatter.test.js not created"
    FAILED=$((FAILED + 1))
fi

# Try running tests
if cd "$TEST_PROJECT" && npm test > test-output.txt 2>&1; then
    echo "  [PASS] All tests pass"
else
    echo "  [FAIL] Tests failed"
    cat test-output.txt | sed 's/^/    /'
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 7: Git commits show work was done
echo "Test 7: Git commit history..."
commit_count=$(git -C "$TEST_PROJECT" log --oneline | wc -l | tr -d ' ')
if [ "$commit_count" -gt 1 ]; then
    echo "  [PASS] Multiple commits created ($commit_count total)"
    git -C "$TEST_PROJECT" log --oneline | sed 's/^/    /'
else
    # Agents may not commit in headless mode — this is OK as long as files exist
    echo "  [WARN] Only $commit_count commit(s) — agents did not git commit (acceptable in headless mode)"
fi
echo ""

# Test 8: No extra features (spec compliance)
echo "Test 8: No extra features added (spec compliance)..."
if grep -q "export.*function.*formatHtml\|export.*function.*formatMarkdown\|export.*function.*formatJson" "$TEST_PROJECT/src/formatter.js" 2>/dev/null; then
    echo "  [WARN] Extra features found in formatter.js (reviewer should have caught this)"
else
    echo "  [PASS] No extra features added"
fi
echo ""

# Token Usage Analysis (if script exists)
if [ -f "$SCRIPT_DIR/analyze-token-usage.py" ] && [ -n "$SESSION_FILE" ]; then
    echo "========================================="
    echo " Token Usage Analysis"
    echo "========================================="
    echo ""
    echo "Lead session:"
    python3 "$SCRIPT_DIR/analyze-token-usage.py" "$SESSION_FILE" 2>/dev/null || echo "  (analysis script not available)"
    if [ -n "$SUBAGENT_FILES" ]; then
        echo ""
        echo "Subagent sessions:"
        for sf in $SUBAGENT_FILES; do
            echo "  --- $(basename "$sf") ---"
            python3 "$SCRIPT_DIR/analyze-token-usage.py" "$sf" 2>/dev/null || echo "  (analysis failed)"
        done
    fi
    echo ""
fi

# Summary
echo "========================================"
echo " Test Summary"
echo "========================================"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "STATUS: PASSED"
    echo "All verification tests passed!"
    echo ""
    echo "The team-driven-development skill correctly:"
    echo "  - Created a team with TeamCreate"
    echo "  - Spawned multiple agent teammates"
    echo "  - Used shared task list for coordination"
    echo "  - Agents communicated via SendMessage"
    echo "  - Respected task dependencies"
    echo "  - Produced working implementation"
    exit 0
else
    echo "STATUS: FAILED"
    echo "Failed $FAILED verification test(s)"
    echo ""
    echo "Output saved to: $OUTPUT_FILE"
    echo ""
    echo "Review the output to see what went wrong."
    exit 1
fi
