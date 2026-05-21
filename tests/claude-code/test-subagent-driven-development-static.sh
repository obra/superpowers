#!/usr/bin/env bash
# Static regression checks for subagent-driven-development prompt templates.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

SPEC_REVIEWER_PROMPT="$REPO_ROOT/skills/subagent-driven-development/spec-reviewer-prompt.md"

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

echo "=== Subagent-Driven Development Static Test ==="
echo ""

assert_contains "$SPEC_REVIEWER_PROMPT" "## Git Range to Review" "spec reviewer has explicit git range section"
assert_contains "$SPEC_REVIEWER_PROMPT" "BASE_SHA" "spec reviewer receives base commit"
assert_contains "$SPEC_REVIEWER_PROMPT" "HEAD_SHA" "spec reviewer receives head commit"
assert_contains "$SPEC_REVIEWER_PROMPT" 'git diff --stat [BASE_SHA]..[HEAD_SHA]' "spec reviewer starts with diff stat"
assert_contains "$SPEC_REVIEWER_PROMPT" 'git diff [BASE_SHA]..[HEAD_SHA]' "spec reviewer inspects task diff"
assert_contains "$SPEC_REVIEWER_PROMPT" "Only read files that appear in this diff" "spec reviewer is scoped to changed files"
assert_contains "$SPEC_REVIEWER_PROMPT" "Read files outside the git diff range" "spec reviewer forbids broad codebase crawl"

echo ""

if [ "$failures" -gt 0 ]; then
    echo "STATUS: FAILED ($failures failures)"
    exit 1
fi

echo "STATUS: PASSED"
