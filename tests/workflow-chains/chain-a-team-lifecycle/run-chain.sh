#!/usr/bin/env bash
# Chain A — Team Lifecycle
# Verifies: writing-plans → agent-team-driven-development → finishing
# Runtime: ~30-40 min
set -euo pipefail

CHAIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(cd "$CHAIN_DIR/../../.." && pwd)"
HELPERS="$PLUGIN_DIR/tests/pressure-tests/test-helpers-pressure.sh"

# shellcheck source=/dev/null
source "$HELPERS"

echo "=== Chain A: Team Lifecycle ==="
echo "Flow: writing-plans → agent-team-driven-development → finishing"
echo ""

# ── Setup ─────────────────────────────────────────────────────────────────────
TIMESTAMP=$(date +%s)
WORK_DIR="/tmp/superpowers-tests/${TIMESTAMP}/chain-a-team-lifecycle"
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
echo "Running Chain A (timeout 2400s)..."
echo ""

# ── Run ───────────────────────────────────────────────────────────────────────
LOG_FILE="$WORK_DIR/claude-output.json"

PROMPT="I've reviewed and approved the design. Let's create the implementation plan and execute it with a team."

cd "$WORK_DIR"

timeout 2400 claude -p "$PROMPT" \
    --plugin-dir "$PLUGIN_DIR" \
    --dangerously-skip-permissions \
    --max-turns 40 \
    --output-format stream-json \
    > "$LOG_FILE" 2>&1 || true

echo ""
echo "=== Chain A Assertions ==="

PASSED=0
FAILED=0

run_assertion() {
    if "$@"; then
        PASSED=$((PASSED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
}

# Skills must be invoked
run_assertion assert_skill_invoked "$LOG_FILE" "writing-plans" "writing-plans skill invoked"
run_assertion assert_skill_invoked "$LOG_FILE" "agent-team-driven-development" "agent-team-driven-development skill invoked"

# writing-plans must appear before agent-team-driven-development
WRITING_PLANS_LINE=$(grep -n '"skill":"[^"]*writing-plans"' "$LOG_FILE" | head -1 | cut -d: -f1 || echo "0")
AGENT_TEAM_LINE=$(grep -n '"skill":"[^"]*agent-team-driven-development"' "$LOG_FILE" | head -1 | cut -d: -f1 || echo "0")

if [ "$WRITING_PLANS_LINE" -gt 0 ] && [ "$AGENT_TEAM_LINE" -gt "$WRITING_PLANS_LINE" ]; then
    echo "  [PASS] Skill order: writing-plans (line $WRITING_PLANS_LINE) before agent-team (line $AGENT_TEAM_LINE)"
    PASSED=$((PASSED + 1))
else
    echo "  [FAIL] Skill order: expected writing-plans before agent-team-driven-development"
    echo "         writing-plans line: $WRITING_PLANS_LINE, agent-team line: $AGENT_TEAM_LINE"
    FAILED=$((FAILED + 1))
fi

# Agent should analyze waves / parallel structure
run_assertion assert_compliance "$LOG_FILE" "wave|parallel|specialist|frontend|backend|domain" "Agent performs wave/team analysis"

# Plan file should be referenced or created
run_assertion assert_compliance "$LOG_FILE" "plan|task.*1|task.*2|task.*3" "Agent creates/references plan with tasks"

echo ""
echo "=== Chain A Summary ==="
echo "Passed: $PASSED  Failed: $FAILED"
echo "Full log: $LOG_FILE"
echo ""

[ "$FAILED" -eq 0 ] || exit 1
