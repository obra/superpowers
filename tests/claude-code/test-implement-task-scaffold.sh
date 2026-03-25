#!/usr/bin/env bash
# Structural validation tests for implement skill task-driven enforcement
# Verifies the task scaffold, phase gates, and completion guards in SKILL.md

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SKILL_FILE="$REPO_ROOT/skills/implement/SKILL.md"

source "$SCRIPT_DIR/test-helpers.sh"

SKILL_CONTENT=$(cat "$SKILL_FILE")
FAILURES=0

echo "=== Implement Skill: Task-Driven Enforcement Tests ==="
echo ""

# --- Gap 1: Plan-without-spec guard ---
echo "Gap 1: Plan-without-spec guard"

assert_contains "$SKILL_CONTENT" "Plan without spec" \
  "Plan-without-spec guard exists" || ((FAILURES++))

assert_contains "$SKILL_CONTENT" "A plan is not a spec" \
  "Guard explains why plan != spec" || ((FAILURES++))

assert_contains "$SKILL_CONTENT" "do NOT resume at Phase 3 or later" \
  "Guard prevents skipping to Phase 3+" || ((FAILURES++))

echo ""

# --- Gap 2: Phase-gating via HARD-GATE ---
echo "Gap 2: Anti-skip HARD-GATE"

assert_contains "$SKILL_CONTENT" "<HARD-GATE>" \
  "HARD-GATE opening tag exists" || ((FAILURES++))

assert_contains "$SKILL_CONTENT" "</HARD-GATE>" \
  "HARD-GATE closing tag exists" || ((FAILURES++))

assert_contains "$SKILL_CONTENT" "Having enough context.*is not a completion criterion" \
  "Anti-skip rule text present" || ((FAILURES++))

assert_contains "$SKILL_CONTENT" "Every phase runs. No exceptions" \
  "No-exceptions enforcement text present" || ((FAILURES++))

echo ""

# --- Gap 3: Phases 6-7 in task scaffold ---
echo "Gap 3: All phases present in task scaffold"

assert_contains "$SKILL_CONTENT" "### Task Scaffold" \
  "Task Scaffold subsection exists" || ((FAILURES++))

assert_contains "$SKILL_CONTENT" "Phase 0: Context Scout" \
  "Phase 0 row in scaffold" || ((FAILURES++))

assert_contains "$SKILL_CONTENT" "Phase 6: Spec Verification" \
  "Phase 6 row in scaffold" || ((FAILURES++))

assert_contains "$SKILL_CONTENT" "Phase 7: E2E Tests" \
  "Phase 7 row in scaffold" || ((FAILURES++))

assert_contains "$SKILL_CONTENT" "Output Completion Report" \
  "Completion Report row in scaffold" || ((FAILURES++))

# Verify blockedBy chain: 9 rows, each blocked by previous
# Count rows in the task scaffold table by matching "| N | Phase" or "| 9 | Output"
SCAFFOLD_ROWS=$(echo "$SKILL_CONTENT" | grep -c '| [0-9] | Phase \|| 9 | Output' || echo "0")
if [ "$SCAFFOLD_ROWS" -eq 9 ]; then
    echo "  [PASS] Task scaffold has exactly 9 task rows (found $SCAFFOLD_ROWS)"
else
    echo "  [FAIL] Task scaffold has exactly 9 task rows"
    echo "  Expected 9, found $SCAFFOLD_ROWS"
    ((FAILURES++))
fi

echo ""

# --- Gap 4: Completion report gate ---
echo "Gap 4: Completion report gate"

assert_contains "$SKILL_CONTENT" "Do NOT output this report until Task 9" \
  "Completion gate references Task 9 chain" || ((FAILURES++))

assert_contains "$SKILL_CONTENT" "Tasks 7 (Phase 6) and 8 (Phase 7) are marked complete" \
  "Gate requires Phase 6 and 7 completion" || ((FAILURES++))

assert_order "$SKILL_CONTENT" \
  "Do NOT output this report" \
  "When all phases complete, output:" \
  "Gate appears before trigger line" || ((FAILURES++))

echo ""

# --- Old artifacts removed ---
echo "Old artifacts removed"

assert_not_contains "$SKILL_CONTENT" "Spec exists + not refined" \
  "Old resume table row 1 removed" || ((FAILURES++))

assert_not_contains "$SKILL_CONTENT" "You MUST create a task for each phase step" \
  "Old single-line task instruction removed" || ((FAILURES++))

echo ""

# --- Structural integrity ---
echo "Structural integrity"

assert_order "$SKILL_CONTENT" \
  "## The Process" \
  "### Task Scaffold" \
  "Task Scaffold is under The Process heading" || ((FAILURES++))

assert_order "$SKILL_CONTENT" \
  "</HARD-GATE>" \
  "digraph process" \
  "Flow diagram follows HARD-GATE" || ((FAILURES++))

assert_contains "$SKILL_CONTENT" "Create ALL 9 tasks at startup" \
  "Startup instruction present" || ((FAILURES++))

assert_contains "$SKILL_CONTENT" "Do NOT begin Phase 0 work until all 9 tasks exist" \
  "Pre-work gate present" || ((FAILURES++))

# --- Task-based resume flow ---
echo ""
echo "Task-based resume flow"

assert_contains "$SKILL_CONTENT" "resume using the task scaffold" \
  "Resume references task scaffold" || ((FAILURES++))

assert_contains "$SKILL_CONTENT" "Begin work at the first incomplete task" \
  "Resume ends at first incomplete task" || ((FAILURES++))

echo ""
echo "=== Results ==="
if [ "$FAILURES" -eq 0 ]; then
    echo "ALL TESTS PASSED"
    exit 0
else
    echo "$FAILURES TEST(S) FAILED"
    exit 1
fi
