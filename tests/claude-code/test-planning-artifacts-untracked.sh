#!/usr/bin/env bash
# Structure check: brainstorming and writing-plans write their artifacts into
# the git-ignored .superpowers/ scratch directory, ensure the ignore rule
# exists, and never instruct committing them.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

BRAINSTORMING="$REPO_ROOT/skills/brainstorming/SKILL.md"
SPEC_REVIEWER="$REPO_ROOT/skills/brainstorming/spec-document-reviewer-prompt.md"
WRITING_PLANS="$REPO_ROOT/skills/writing-plans/SKILL.md"
FINISHING="$REPO_ROOT/skills/finishing-a-development-branch/SKILL.md"
SDD="$REPO_ROOT/skills/subagent-driven-development/SKILL.md"
REQUESTING_REVIEW="$REPO_ROOT/skills/requesting-code-review/SKILL.md"

failures=0

assert_contains() {
  local file="$1"
  local pattern="$2"
  local label="$3"

  if grep -Fq "$pattern" "$file"; then
    echo "  [PASS] $label"
  else
    echo "  [FAIL] $label"
    echo "    Expected to find: $pattern"
    echo "    In file: $file"
    failures=$((failures + 1))
  fi
}

assert_not_contains() {
  local file="$1"
  local pattern="$2"
  local label="$3"

  if grep -Fq "$pattern" "$file"; then
    echo "  [FAIL] $label"
    echo "    Did not expect to find: $pattern"
    echo "    In file: $file"
    failures=$((failures + 1))
  else
    echo "  [PASS] $label"
  fi
}

echo "=== Planning Artifacts Untracked Test ==="
echo ""

assert_contains "$BRAINSTORMING" ".superpowers/specs/YYYY-MM-DD-<topic>-design.md" "brainstorming writes the spec to .superpowers/specs/"
assert_not_contains "$BRAINSTORMING" "docs/superpowers/specs" "brainstorming no longer writes into tracked docs/"
assert_not_contains "$BRAINSTORMING" "Commit the design document to git" "brainstorming no longer instructs committing the spec"
assert_contains "$BRAINSTORMING" "Do not commit the spec." "brainstorming states the spec stays uncommitted"
assert_contains "$BRAINSTORMING" "git check-ignore -q .superpowers/" "brainstorming ensures the ignore rule exists"

assert_contains "$WRITING_PLANS" ".superpowers/plans/YYYY-MM-DD-<feature-name>.md" "writing-plans writes the plan to .superpowers/plans/"
assert_not_contains "$WRITING_PLANS" "docs/superpowers/plans" "writing-plans no longer writes into tracked docs/"
assert_contains "$WRITING_PLANS" "Do not commit the plan." "writing-plans states the plan stays uncommitted"
assert_contains "$WRITING_PLANS" "git check-ignore -q .superpowers/" "writing-plans ensures the ignore rule exists"

assert_contains "$SPEC_REVIEWER" ".superpowers/specs/" "spec reviewer prompt points at the new location"

assert_contains "$FINISHING" ".superpowers/specs/*-design.md" "PR body sources the spec from .superpowers/specs/"
assert_not_contains "$FINISHING" "docs/superpowers/specs" "finishing skill no longer names the tracked spec path"

assert_not_contains "$SDD" "docs/superpowers/plans" "subagent-driven-development examples use the new path"
assert_not_contains "$REQUESTING_REVIEW" "docs/superpowers/plans" "requesting-code-review example uses the new path"

echo ""

if [ "$failures" -gt 0 ]; then
  echo "STATUS: FAILED ($failures failures)"
  exit 1
fi

echo "STATUS: PASSED"
