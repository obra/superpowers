#!/usr/bin/env bash
# Regression for #2493: requirements in a plan header must reach each task brief.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BRIEF="$ROOT/skills/subagent-driven-development/scripts/task-brief"
START="$ROOT/skills/executing-plans/scripts/task-start"
TEST_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/superpowers-task-brief.XXXXXX")"
trap 'rm -rf "$TEST_ROOT"' EXIT
FAILURES=0
PASSES=0

git init -q -b main "$TEST_ROOT/repo"
cd "$TEST_ROOT/repo"
git -c user.name=Test -c user.email=test@example.invalid -c commit.gpgsign=false commit --allow-empty -qm init

assert_brief() {
  local name="$1" plan="$2" task="$3" expected="$4"
  printf '%s' "$plan" > "$TEST_ROOT/repo/plan.md"
  printf '%s' "$expected" > "$TEST_ROOT/expected.md"
  local rc=0
  bash "$BRIEF" plan.md "$task" "$TEST_ROOT/actual brief.md" > "$TEST_ROOT/stdout" 2> "$TEST_ROOT/stderr" || rc=$?
  if [[ "$rc" -eq 0 ]] && cmp -s "$TEST_ROOT/expected.md" "$TEST_ROOT/actual brief.md"; then
    printf 'PASS: %s\n' "$name"
    PASSES=$((PASSES + 1))
  else
    printf 'FAIL: %s (exit %s)\n' "$name" "$rc"
    diff -u "$TEST_ROOT/expected.md" "$TEST_ROOT/actual brief.md" || true
    FAILURES=$((FAILURES + 1))
  fi
}

HEADER=$'**Spec:** docs/spec.md\n\n## Global Constraints\n\n- Node >= 20\n- All copy in formal Spanish\n- No runtime dependencies\n\n## Review Focus\n\n- Verify Spanish register\n\n'
TASK_ONE=$'## Task 1: Add the greeting\n\nModify src/banner.js.\n\n'
TASK_TWO=$'## Task 2: Add the footer\n\nModify src/footer.js.\n'
PLAN=$'# Plan\n\n**Goal:** Do not copy unrelated header prose.\n\n'"$HEADER$TASK_ONE$TASK_TWO"
assert_brief 'task carries shared constraints, review focus and spec reference verbatim' "$PLAN" 1 "$HEADER$TASK_ONE"

NESTED=$'## Global Constraints\n\n### Runtime requirements\n\n- Node >= 20\n\n'
assert_brief 'nested headings remain in their shared section' "$NESTED"$'## Other notes\n\nDo not copy this.\n\n'"$TASK_ONE$TASK_TWO" 1 "$NESTED$TASK_ONE"

CRLF_HEADER=$'## Global Constraints\r\n\r\n- Preserve exact constraints\r\n\r\n'
CRLF_TASK=$'## Task 1: Windows plan\r\n\r\nKeep the original text.\r\n'
assert_brief 'CRLF plan sections are recognized without rewriting their content' "$CRLF_HEADER$CRLF_TASK" 1 "$CRLF_HEADER$CRLF_TASK"

assert_brief 'later tasks get the same context without earlier task text' "$PLAN" 2 "$HEADER$TASK_TWO"
assert_brief 'legacy plans without shared context keep identical task text' "$TASK_ONE$TASK_TWO" 1 "$TASK_ONE"
assert_brief 'a spec reference alone travels with the task' $'**Spec:** docs/spec.md\n\n'"$TASK_ONE$TASK_TWO" 2 $'**Spec:** docs/spec.md\n\n'"$TASK_TWO"
REVIEW_ONLY=$'## Review Focus\n\n- Check empty inputs\n\n'
assert_brief 'review focus is copied even without a constraints section' "$REVIEW_ONLY$TASK_ONE" 1 "$REVIEW_ONLY$TASK_ONE"
EXAMPLE=$'# Notes\n\n```markdown\n## Global Constraints\nNot a real constraint.\n**Spec:** fake.md\n## Task 99: example\n```\n\n'
assert_brief 'fenced header examples do not become requirements' "$EXAMPLE$HEADER$TASK_ONE" 1 "$HEADER$TASK_ONE"
FENCED=$'## Global Constraints\n\n```markdown\n## Other notes\n## Task 99: not a real task\n```\n\n- Keep this requirement too\n\n'
assert_brief 'headings inside a shared section code fence stay verbatim' "$FENCED$TASK_ONE" 1 "$FENCED$TASK_ONE"
CLOSED=$'## Global Constraints ##\n\n- Keep closing ATX markers\n\n'
assert_brief 'valid closing heading markers are recognized' "$CLOSED$TASK_ONE" 1 "$CLOSED$TASK_ONE"
LOCAL=$'## Task 1: first\n\n## Global Constraints\n\nOnly this task owns these words.\n\n'
assert_brief 'task-local constraints never leak into another task' "$HEADER$LOCAL$TASK_TWO" 2 "$HEADER$TASK_TWO"

# Header text must not turn a missing task into a successful nonempty brief.
printf '%s' "$HEADER$TASK_ONE" > plan.md
rc=0
bash "$BRIEF" plan.md 99 "$TEST_ROOT/missing.md" > "$TEST_ROOT/stdout" 2> "$TEST_ROOT/stderr" || rc=$?
if [[ "$rc" -eq 3 && ! -s "$TEST_ROOT/missing.md" ]]; then
  printf 'PASS: missing task still returns exit 3 without a header-only brief\n'
  PASSES=$((PASSES + 1))
else
  printf 'FAIL: missing task returned exit %s\n' "$rc"
  FAILURES=$((FAILURES + 1))
fi

# Exercise the inline execution consumer, not only explicit-output extraction.
printf '%s' "$PLAN" > plan.md
printf '%s' "$HEADER$TASK_TWO" > "$TEST_ROOT/expected.md"
rc=0
started=$(bash "$START" plan.md 2) || rc=$?
brief=$(printf '%s\n' "$started" | sed -n 's/^brief: //p')
base=$(printf '%s\n' "$started" | sed -n 's/^base: //p')
if [[ "$rc" -eq 0 && "$base" == "$(git rev-parse HEAD)" ]] && cmp -s "$TEST_ROOT/expected.md" "$brief"; then
  printf 'PASS: task-start exposes a complete brief and the unchanged BASE contract\n'
  PASSES=$((PASSES + 1))
else
  printf 'FAIL: task-start integration (exit %s)\n%s\n' "$rc" "$started"
  FAILURES=$((FAILURES + 1))
fi

printf '\n%s passed, %s failed\n' "$PASSES" "$FAILURES"
[[ "$FAILURES" -eq 0 ]]
