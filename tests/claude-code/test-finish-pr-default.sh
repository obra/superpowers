#!/usr/bin/env bash
# Structure check: finishing-a-development-branch opens a PR by default but
# still lists every option and still gates destructive paths behind an
# explicit request.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

FINISHING_SKILL="$REPO_ROOT/skills/finishing-a-development-branch/SKILL.md"

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

echo "=== Finish PR-Default Test ==="
echo ""

assert_contains "$FINISHING_SKILL" "1. Push and create a Pull Request" "PR is the first menu option"
assert_contains "$FINISHING_SKILL" "doing this now" "menu marks the PR as the action being taken"
assert_contains "$FINISHING_SKILL" "2. Merge back to <base-branch> locally" "merge-locally is still offered"
assert_contains "$FINISHING_SKILL" "3. Keep the branch as-is" "keep-as-is is still offered"
assert_contains "$FINISHING_SKILL" "do not wait for a reply" "skill acts without blocking"

assert_contains "$FINISHING_SKILL" "Type 'discard' to confirm." "discard still needs the exact typed confirmation"
assert_contains "$FINISHING_SKILL" "explicit request to throw the" "discard is still explicit-request-only"

assert_contains "$FINISHING_SKILL" '[A-Z][A-Z0-9]+-[0-9]+' "PR assembly recovers the ticket key from the branch name"
assert_contains "$FINISHING_SKILL" "PULL_REQUEST_TEMPLATE.md" "PR body honours the repo template"
assert_contains "$FINISHING_SKILL" "docs/superpowers/specs" "PR body draws on the design spec when one exists"
assert_contains "$FINISHING_SKILL" "not a draft" "PR is opened ready for review"

assert_contains "$FINISHING_SKILL" "A red test suite" "test gate still blocks the PR"

echo ""

if [ "$failures" -gt 0 ]; then
  echo "STATUS: FAILED ($failures failures)"
  exit 1
fi

echo "STATUS: PASSED"
