#!/usr/bin/env bash
# Chain B — Solo Lifecycle
# Verifies: writing-plans → subagent-driven-development (NOT agent-team)
# Runtime: ~20-30 min
set -euo pipefail

CHAIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(cd "$CHAIN_DIR/../../.." && pwd)"
HELPERS="$PLUGIN_DIR/tests/pressure-tests/test-helpers-pressure.sh"

# shellcheck source=/dev/null
source "$HELPERS"

echo "=== Chain B: Solo Lifecycle ==="
echo "Flow: writing-plans → subagent-driven-development (serial, single domain)"
echo ""

# ── Setup ─────────────────────────────────────────────────────────────────────
TIMESTAMP=$(date +%s)
WORK_DIR="/tmp/superpowers-tests/${TIMESTAMP}/chain-b-solo-lifecycle"
mkdir -p "$WORK_DIR"

# Copy project scaffold
cp -r "$CHAIN_DIR/fixtures/project-scaffold/." "$WORK_DIR/"
mkdir -p "$WORK_DIR/docs/plans"
cp "$CHAIN_DIR/fixtures/design.md" "$WORK_DIR/docs/plans/design.md"

# Set up git repo
setup_git_repo "$WORK_DIR"

# Create .superpowers/state.yml with design approved
mkdir -p "$WORK_DIR/.superpowers"
cat > "$WORK_DIR/.superpowers/state.yml" <<'EOF'
design:
  approved: true
  file: docs/plans/design.md
phase: planning
EOF

echo "Project dir: $WORK_DIR"
echo "Running Chain B (timeout 1800s)..."
echo ""

# ── Run ───────────────────────────────────────────────────────────────────────
LOG_FILE="$WORK_DIR/claude-output.json"

PROMPT="Design is approved. Let's plan and execute this."

cd "$WORK_DIR"

timeout 1800 claude -p "$PROMPT" \
    --plugin-dir "$PLUGIN_DIR" \
    --dangerously-skip-permissions \
    --max-turns 30 \
    --output-format stream-json \
    > "$LOG_FILE" 2>&1 || true

echo ""
echo "=== Chain B Assertions ==="

PASSED=0
FAILED=0

run_assertion() {
    if "$@"; then
        PASSED=$((PASSED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
}

# writing-plans must be invoked
run_assertion assert_skill_invoked "$LOG_FILE" "writing-plans" "writing-plans skill invoked"

# subagent-driven-development must be chosen (serial path)
run_assertion assert_skill_invoked "$LOG_FILE" "subagent-driven-development" "subagent-driven-development skill invoked (serial path)"

# agent-team-driven-development must NOT be invoked
run_assertion assert_tool_not_used "$LOG_FILE" "agent-team-driven-development" "agent-team-driven-development NOT invoked (single domain)"

# writing-plans must appear before subagent-driven-development
WRITING_PLANS_LINE=$(grep -n '"skill":"[^"]*writing-plans"' "$LOG_FILE" | head -1 | cut -d: -f1 || echo "0")
SUBAGENT_LINE=$(grep -n '"skill":"[^"]*subagent-driven-development"' "$LOG_FILE" | head -1 | cut -d: -f1 || echo "0")

if [ "$WRITING_PLANS_LINE" -gt 0 ] && [ "$SUBAGENT_LINE" -gt "$WRITING_PLANS_LINE" ]; then
    echo "  [PASS] Skill order: writing-plans (line $WRITING_PLANS_LINE) before subagent-driven-development (line $SUBAGENT_LINE)"
    PASSED=$((PASSED + 1))
else
    echo "  [FAIL] Skill order: expected writing-plans before subagent-driven-development"
    echo "         writing-plans line: $WRITING_PLANS_LINE, subagent line: $SUBAGENT_LINE"
    FAILED=$((FAILED + 1))
fi

# Agent should recognize serial/sequential nature
run_assertion assert_compliance "$LOG_FILE" "serial|sequential|single.*domain|tightly.*coupled|depend|one.*specialist|in.*order" "Agent recognizes sequential coupling"

# Plan must reference the 3 tasks
run_assertion assert_compliance "$LOG_FILE" "task.*1\|task.*2\|task.*3\|user model\|jwt\|auth.*endpoint\|middleware" "Agent creates plan referencing auth tasks"

echo ""
echo "=== Chain B Summary ==="
echo "Passed: $PASSED  Failed: $FAILED"
echo "Full log: $LOG_FILE"
echo ""

[ "$FAILED" -eq 0 ] || exit 1
