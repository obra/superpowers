#!/usr/bin/env bash
# Regression check: finishing-a-development-branch must not assume every remote
# is hosted on GitHub when creating a PR/MR.

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

echo "=== Finishing Branch PR Platform Test ==="
echo ""

assert_contains "$FINISHING_SKILL" "git remote get-url origin" "detects hosting platform from origin remote"
assert_contains "$FINISHING_SKILL" "gh pr create" "keeps GitHub PR creation path"
assert_contains "$FINISHING_SKILL" "glab mr create" "documents GitLab MR creation path"
assert_contains "$FINISHING_SKILL" "Bitbucket" "documents Bitbucket as a non-GitHub host"
assert_contains "$FINISHING_SKILL" "manual PR/MR creation URL" "falls back to manual URL for unknown hosts"
assert_contains "$FINISHING_SKILL" "Using GitHub CLI on non-GitHub remotes" "warns against hardcoded gh usage"

echo ""

if [ "$failures" -gt 0 ]; then
    echo "STATUS: FAILED ($failures failures)"
    exit 1
fi

echo "STATUS: PASSED"
