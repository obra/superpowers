#!/usr/bin/env bash
# Literal shell snippets are contract text, not expressions to expand.
# shellcheck disable=SC2016
set -euo pipefail

repo_root=$(git rev-parse --show-toplevel)
skill="$repo_root/skills/subagent-driven-development/SKILL.md"

assert_contains() {
  local text=$1 description=$2
  if ! grep -Fq -- "$text" "$skill"; then
    echo "not ok - $description" >&2
    echo "missing: $text" >&2
    exit 1
  fi
  echo "ok - $description"
}

assert_not_contains() {
  local text=$1 description=$2
  if grep -Fq -- "$text" "$skill"; then
    echo "not ok - $description" >&2
    echo "unexpected: $text" >&2
    exit 1
  fi
  echo "ok - $description"
}

assert_contains 'Dispatch every role on the route delivery gave you' \
  "SDD dispatches on delivery's resolved routes"
assert_contains 'rather than choosing a model yourself' \
  "a missing route escalates instead of being guessed"
assert_contains 'If delivery supplied a UX gate runner, dispatch it' \
  "the UX gate runs inside the final-review step"
assert_before_text() {
  local first=$1 second=$2 description=$3 a b
  a=$(grep -nF -- "$first" "$skill" | head -1 | cut -d: -f1)
  b=$(grep -nF -- "$second" "$skill" | head -1 | cut -d: -f1)
  if [ -z "$a" ] || [ -z "$b" ] || [ "$a" -ge "$b" ]; then
    echo "not ok - $description" >&2
    exit 1
  fi
  echo "ok - $description"
}
assert_before_text 'If delivery supplied a UX gate runner' 'dispatch the whole-branch reviewer' \
  "UX gate runs before the whole-branch review"
assert_contains 'scripts/review-package --plan PLAN_FILE START HEAD`, START being the boundary' \
  "final review covers exactly the boundary's commits"
assert_contains "one fresh implementer fixing the review file's complete list" \
  "final findings are fixed together"
assert_contains 'rather than one fixer per finding' \
  "one fixer receives the complete finding set"
assert_contains 'Implementers produce fresh evidence for their own claims' \
  "implementers never reuse evidence for their own claims"
assert_contains 'Reviewers read that evidence instead of re-running it' \
  "reviewers reuse implementer evidence"
assert_contains "The full suite is CI's; no implementer, reviewer, or monitor runs it" \
  "no local gate runs the full suite"
assert_contains 'Review the task now only if the plan marks it `Review: per-task`' \
  "only risky tasks get a per-task review"
assert_contains 'After the second round, rule on each finding still open' \
  "the fix loop is bounded at two rounds"
assert_contains 'never extend the loop' \
  "re-review scope cannot grow the loop"
assert_not_contains 'without a caller' "SDD has no caller-less mode"
assert_not_contains 'Orchestrator close' "the orchestrator no longer closes fix rounds itself"
assert_not_contains 'Cannot verify from diff' "reviewers resolve their own doubts"
assert_not_contains 'REVIEW_HEAD=$(git rev-parse HEAD)' "exact-head state removed"
assert_not_contains 'approved SHA' "approved-SHA bookkeeping removed"

echo "PASS"
