#!/usr/bin/env bash
# Test: document review system behavior
# Verifies local reviewer-flow prompts for design docs and plan docs
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

MODE="${1:-green}"

if [ "$MODE" != "green" ]; then
    echo "Usage: $0 green" >&2
    exit 2
fi

echo "=== Test: document review system behavior ==="
echo ""

BRAINSTORMING_SKILL="skills/brainstorming/SKILL.md"
SPEC_REVIEW_PROMPT="skills/brainstorming/spec-document-reviewer-prompt.md"
WRITING_PLANS_SKILL="skills/writing-plans/SKILL.md"
PLAN_REVIEW_PROMPT="skills/writing-plans/plan-document-reviewer-prompt.md"
DESIGN_DOC_PATH="docs/plans/YYYY-MM-DD-design-review-flow.md"
PLAN_DOC_PATH="docs/plans/YYYY-MM-DD-review-flow.md"

for path in \
    "$BRAINSTORMING_SKILL" \
    "$SPEC_REVIEW_PROMPT" \
    "$WRITING_PLANS_SKILL" \
    "$PLAN_REVIEW_PROMPT"
do
    if [ ! -f "$path" ]; then
        echo "Missing required file: $path" >&2
        exit 1
    fi
done

if ! command -v claude > /dev/null 2>&1; then
    echo "SKIPPED: Claude Code CLI not found"
    exit 0
fi

echo "Test 1: Brainstorming should gate user review on structured spec review..."

output=$(run_claude "Read $BRAINSTORMING_SKILL and $SPEC_REVIEW_PROMPT in the current workspace and answer only from those files. After brainstorming writes a design doc to $DESIGN_DOC_PATH, what review must happen before the user review gate? Mention the reviewer prompt file, the docs/plans location, and whether blocking issues require rerunning the review." 180)

assert_contains "$output" "spec-document-reviewer-prompt\\.md" "brainstorming references the local spec reviewer prompt"
assert_contains "$output" "docs/plans" "brainstorming keeps reviewed design docs in docs/plans"
assert_contains "$output" "before.*user review\\|before asking the user\\|user review gate\\|Only ask for user review after\\|structured spec review.*before\\|用户审查.*之前\\|用户评审.*之前\\|用户审查关卡之前\\|先.*用户审查\\|先.*用户评审\\|先让用户检查之前" "spec review happens before user review"
assert_contains "$output" "rerun\\|re-run\\|run.*again\\|until it passes\\|直到.*通过\\|重新运行.*审查\\|再次.*审查" "blocking spec issues force a rerun"

echo ""
echo "Test 2: Spec reviewer should use the documented blocking criteria..."

output=$(run_claude "Read $SPEC_REVIEW_PROMPT in the current workspace and answer only from that file. For the design document reviewer on $DESIGN_DOC_PATH, name at least four review categories, including one about scope or YAGNI, and say whether minor wording or style suggestions block approval." 180)

assert_contains "$output" "Completeness\\|TODO\\|TBD\\|placeholder\\|占位\\|未完成" "spec reviewer checks completeness"
assert_contains "$output" "Consistency\\|contradiction\\|Clarity\\|ambiguity\\|一致性\\|矛盾\\|歧义\\|清晰" "spec reviewer checks consistency or clarity"
assert_contains "$output" "Scope\\|YAGNI\\|over-engineering\\|范围\\|不过度设计\\|过度工程" "spec reviewer checks scope control"
assert_contains "$output" "minor wording\\|style.*not blocker\\|not blockers\\|advisory\\|Approve unless\\|不阻塞\\|建议性" "spec reviewer keeps minor wording as non-blocking"

echo ""
echo "Test 3: Writing-plans should gate execution handoff on plan review..."

output=$(run_claude "Read $WRITING_PLANS_SKILL and $PLAN_REVIEW_PROMPT in the current workspace and answer only from those files. After saving a plan to $PLAN_DOC_PATH, what must be reviewed before execution handoff? Mention the reviewer prompt file, the design/spec reference in docs/plans, and the approval rule if issues are found." 180)

assert_contains "$output" "plan-document-reviewer-prompt\\.md" "writing-plans references the local plan reviewer prompt"
assert_contains "$output" "design/spec reference\\|related design\\|design document\\|spec reference\\|docs/plans\\|设计文档\\|规格参考" "plan review compares against the related design/spec"
assert_contains "$output" "Issues Found\\|fix the plan first\\|re-run the review\\|Only continue when.*Approved\\|修复计划\\|重新运行.*审查\\|只有.*Approved.*继续" "plan review blocks execution until approved"

echo ""
echo "Test 4: Plan reviewer should enforce spec coverage and executability..."

output=$(run_claude "Read $PLAN_REVIEW_PROMPT in the current workspace and answer only from that file. For the implementation plan reviewer on $PLAN_DOC_PATH, what categories must it check? Mention spec coverage, executability details like exact files or commands, scope control, and whether recommendations block approval." 180)

assert_contains "$output" "Spec Coverage\\|coverage gaps\\|requirements.*never appear\\|规格覆盖\\|覆盖缺口" "plan reviewer checks spec coverage"
assert_contains "$output" "Executability\\|exact file\\|commands\\|validation\\|expected outcomes\\|可执行性\\|精确文件路径\\|命令\\|验证" "plan reviewer checks executability details"
assert_contains "$output" "Scope Control\\|over-engineering\\|speculative\\|范围控制\\|过度工程\\|推测性任务" "plan reviewer checks scope control"
assert_contains "$output" "Recommendations.*do not block\\|advisory\\|not blockers\\|建议.*不阻塞\\|建议.*不影响批准" "plan reviewer treats recommendations as non-blocking"

echo ""
echo "=== All document review system tests passed ==="
