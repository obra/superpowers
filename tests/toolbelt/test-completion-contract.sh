#!/usr/bin/env bash
set -euo pipefail

repo_root=$(git rev-parse --show-toplevel)

assert_contains() {
  local file=$1 text=$2 description=$3
  if ! grep -Fq "$text" "$file"; then
    echo "not ok - $description" >&2
    echo "missing: $text" >&2
    exit 1
  fi
  echo "ok - $description"
}

skill="$repo_root/skills/finishing-a-development-branch/SKILL.md"

assert_contains "$skill" "**Declared route:**" "declared-route rule exists"
assert_contains "$skill" "already named one route, optionally with a target base branch" "contract trigger condition"
assert_contains "$skill" "then that route and its cleanup without showing the menu" "declared route skips the menu"
assert_contains "$skill" "With no route, or an ambiguous one, show the menu." "default menu preserved on no declaration"
assert_contains "$skill" "every check and cleanup rule applies" "verification is not bypassed"
assert_contains "$skill" "exactly these 4" "default 4-option menu still present"
assert_contains "$skill" "Type 'discard' to confirm." "destructive confirmation gate still present"
assert_contains "$skill" "If tests fail, stop" "test verification step still present"
assert_contains "$skill" "Run the tests related to the files the branch changed from its base" "Step 1 runs the branch's related tests"
assert_contains "$skill" "<full test suite command>" "a local merge, with no CI, runs the full suite"
assert_contains "$skill" "Both exceptions require a clean worktree" "both Step 1 shortcuts require a clean worktree"
assert_contains "$skill" "is a claim, not evidence" "an unevidenced report never satisfies Step 1"
assert_contains "$skill" "**Docs-only:**" "docs-only Step 1 case exists"
assert_contains "$skill" "none is a file the application builds, renders," "docs-only allowlist has a semantic guard"
assert_contains "$skill" "Nothing below runs until they pass" "Step 1 must be satisfied before the menu"

assert_contains "$skill" '"PR is open" is not a terminal state' \
  "an opened PR must end in a named owner"
assert_contains "$skill" "unless pr-monitor is the one running this skill" \
  "delivery's existing monitor is not double-started"
assert_contains "$repo_root/skills/delivery/branch-lifecycle.md" "a squash merge leaves its commits unmerged by ancestry" \
  "squash-merge teardown guard present"

echo "PASS"
