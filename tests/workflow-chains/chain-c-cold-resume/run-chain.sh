#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
FIXTURES_DIR="$SCRIPT_DIR/fixtures"

echo "=== Chain C: Cold Resume ==="
echo "Testing that agent resumes from state.yml at task 4 without re-executing 1-3"
echo ""

# --- Setup ---
TIMESTAMP=$(date +%s)
PROJECT_DIR="/tmp/superpowers-tests/${TIMESTAMP}/chain-c/project"
mkdir -p "$PROJECT_DIR"

# Copy project scaffold (tasks 1-3 already implemented)
cp -r "$FIXTURES_DIR/project-scaffold/." "$PROJECT_DIR/"

# Copy plan into expected location
mkdir -p "$PROJECT_DIR/docs/plans/feature"
cp "$FIXTURES_DIR/plan.md" "$PROJECT_DIR/docs/plans/feature/plan.md"

# Set up state.yml — agent should read this to find resume point
mkdir -p "$PROJECT_DIR/.superpowers"
cp "$FIXTURES_DIR/state.yml" "$PROJECT_DIR/.superpowers/state.yml"

# Initialize git so the agent has a real repo
git -C "$PROJECT_DIR" init -q
git -C "$PROJECT_DIR" config user.email "test@example.com"
git -C "$PROJECT_DIR" config user.name "Test User"
git -C "$PROJECT_DIR" add -A
git -C "$PROJECT_DIR" commit -q -m "Tasks 1-3 complete"

echo "Project scaffolded at: $PROJECT_DIR"
echo "State: $(cat "$PROJECT_DIR/.superpowers/state.yml")"
echo ""

# --- Run Claude ---
LOG_DIR="/tmp/superpowers-tests/${TIMESTAMP}/chain-c"
LOG_FILE="$LOG_DIR/claude-output.json"
mkdir -p "$LOG_DIR"

PROMPT="Resume execution of the implementation plan. We were in the middle of task 4. The project is at $PROJECT_DIR."

echo "Running claude with resume prompt (timeout 1200s)..."
cd "$PROJECT_DIR"
timeout 1200 claude -p "$PROMPT" \
    --plugin-dir "$PLUGIN_DIR" \
    --dangerously-skip-permissions \
    --max-turns 15 \
    --output-format stream-json \
    > "$LOG_FILE" 2>&1 || true

echo ""
echo "=== Verifying Results ==="

PASS=0
FAIL=0

# 1. Agent reads state.yml and identifies task 4 as resume point
if grep '"type":"assistant"' "$LOG_FILE" | grep -qiE "task 4|resume.*task|state\.yml|completed_tasks|current_wave"; then
    echo "  [PASS] Agent identified task 4 as resume point"
    PASS=$((PASS+1))
else
    echo "  [FAIL] Agent did not identify task 4 as resume point"
    FAIL=$((FAIL+1))
fi

# 2. Agent does NOT re-execute tasks 1-3
if grep '"type":"assistant"' "$LOG_FILE" | grep -qiE "implement.*task [123]|re.execut|starting task [123]|task [123].*complete|working on task [123]"; then
    echo "  [FAIL] Agent appears to have re-executed tasks 1-3"
    FAIL=$((FAIL+1))
else
    echo "  [PASS] Agent did not re-execute tasks 1-3"
    PASS=$((PASS+1))
fi

# 3. Agent discovers the plan error (missing src/middleware/rate-limiter.js)
if grep '"type":"assistant"' "$LOG_FILE" | grep -qiE "rate.limit|middleware|not.*exist|missing.*file|cannot.*find|does not exist|no such file"; then
    echo "  [PASS] Agent discovered plan error (missing rate-limiter.js reference)"
    PASS=$((PASS+1))
else
    echo "  [FAIL] Agent did not surface plan error"
    FAIL=$((FAIL+1))
fi

# 4. Agent escalates to user rather than silently proceeding
if grep '"type":"assistant"' "$LOG_FILE" | grep -qiE "escalat|blocker|cannot proceed|need.*clarif|how.*proceed|should I|your guidance|ask.*you|human"; then
    echo "  [PASS] Agent escalated to user"
    PASS=$((PASS+1))
else
    echo "  [FAIL] Agent did not escalate to user"
    FAIL=$((FAIL+1))
fi

echo ""
echo "Full log: $LOG_FILE"
echo ""
echo "Chain C results: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ] || exit 1
