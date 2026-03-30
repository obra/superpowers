#!/usr/bin/env bash
# Test: subagent-driven-development skill
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: subagent-driven-development skill ==="
echo ""

SKILL_SOURCE=$(cat "$REPO_ROOT/skills/subagent-driven-development/SKILL.md")
IMPLEMENTER_SOURCE=$(cat "$REPO_ROOT/skills/subagent-driven-development/implementer-prompt.md")
SPEC_REVIEWER_SOURCE=$(cat "$REPO_ROOT/skills/subagent-driven-development/spec-reviewer-prompt.md")

echo "Test 1: Workflow semantics..."
workflow_answer=$(run_claude "Summarize the subagent-driven-development workflow in no more than 6 bullets. Explicitly cover: 1) that it uses a fresh subagent per task, 2) when the controller reads the plan, 3) how task text/context and todo tracking are prepared before the first task, 4) the per-task review order, and 5) what happens when reviewers find issues." 90)
assert_semantic_judgment \
    "$SKILL_SOURCE" \
    "What does the subagent-driven-development workflow require from start through task completion?" \
    "$workflow_answer" \
    "- Describes the skill as executing an implementation plan with a fresh subagent per task.
- Says the controller reads the plan once at the start, extracts full task text and context, and creates or maintains a todo list.
- Says spec compliance review happens before code quality review.
- Says reviewer feedback sends work back for fixes and the review repeats until approval." \
    "Workflow matches skill documentation" \
    120 || exit 1

echo ""
echo "Test 2: Implementer execution semantics..."
implementer_answer=$(run_claude "In the implementer prompt for subagent-driven-development, once the implementer is clear on requirements, what exact sequence of work must happen before reporting back, and what status values can the implementer report? Answer in no more than 7 bullets." 90)
assert_semantic_judgment \
    "$IMPLEMENTER_SOURCE" \
    "What must the implementer do before reporting back, and what statuses can they use?" \
    "$implementer_answer" \
    "- Says the implementer is expected to implement exactly what the task specifies.
- Says the implementer writes tests and verifies the implementation works before reporting back.
- Says the implementer commits the work before reporting back.
- Says the implementer self-reviews before reporting back.
- Mentions the report statuses DONE, DONE_WITH_CONCERNS, BLOCKED, and NEEDS_CONTEXT." \
    "Implementer workflow reflects prompt" \
    120 || exit 1

echo ""
echo "Test 3: Controller handoff semantics..."
handoff_answer=$(run_claude "Before implementation starts or resumes in subagent-driven-development, how should the controller set up the implementer subagent? Focus on the task text, context, and question-handling expectations. Answer in no more than 6 bullets." 90)
assert_semantic_judgment \
    "$SKILL_SOURCE

$IMPLEMENTER_SOURCE" \
    "How should the controller hand work to the implementer before implementation begins or resumes?" \
    "$handoff_answer" \
    "- Says the controller provides the full task text directly instead of making the implementer read the plan file.
- Says the controller provides scene-setting context about where the task fits.
- Says the implementer should ask questions before starting and while working if something is unclear.
- Says the controller answers questions clearly and provides additional context before implementation continues." \
    "Controller handoff reflects prompt and red flags" \
    120 || exit 1

echo ""
echo "Test 4: Spec reviewer semantics..."
spec_reviewer_answer=$(run_claude "What is the spec compliance reviewer's job and attitude toward the implementer's report in subagent-driven-development? Answer in no more than 6 bullets, and explicitly cover: 1) whether the report is trusted, 2) what the reviewer reads directly, 3) which categories of issues they check for, and 4) how they should report noncompliance." 90)
assert_semantic_judgment \
    "$SPEC_REVIEWER_SOURCE" \
    "How should the spec compliance reviewer behave, and what do they verify?" \
    "$spec_reviewer_answer" \
    "- Says the reviewer must not trust the implementer's report and should verify independently.
- Says the reviewer reads the actual implementation code.
- Says the reviewer checks for missing requirements, extra or unrequested work, and misunderstandings or wrong interpretations.
- Says findings should be reported specifically when the implementation is not spec compliant." \
    "Spec reviewer mindset is preserved" \
    120 || exit 1

echo ""
echo "Test 5: Prerequisites and red flags..."
red_flags_answer=$(run_claude "List the prerequisites and red flags that matter before or during subagent-driven-development. Explicitly include the required workflow skill or isolated-workspace step for setup, plus branch safety, review-order mistakes, and when it is unsafe to move to the next task. Answer in no more than 6 bullets." 90)
assert_semantic_judgment \
    "$SKILL_SOURCE" \
    "What prerequisites and workflow mistakes does the skill explicitly call out?" \
    "$red_flags_answer" \
    "- Mentions using-git-worktrees as a required workflow skill or isolated-workspace prerequisite before starting.
- Says not to start implementation on main or master without explicit user consent.
- Says not to start code quality review before spec compliance is approved.
- Says not to move to the next task while review issues are still open." \
    "Prerequisites and red flags stay intact" \
    120 || exit 1

echo ""
echo "=== All subagent-driven-development skill tests passed ==="
