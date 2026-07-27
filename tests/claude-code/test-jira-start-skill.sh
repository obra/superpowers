#!/usr/bin/env bash
# Structure check: the starting-from-a-jira-ticket skill must keep its
# preflight gates, fetch-before-branch ordering, and both routing targets.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

JIRA_SKILL="$REPO_ROOT/skills/starting-from-a-jira-ticket/SKILL.md"

failures=0

assert_file_exists() {
  local file="$1"
  local label="$2"

  if [ -f "$file" ]; then
    echo "  [PASS] $label"
  else
    echo "  [FAIL] $label"
    echo "    Expected file: $file"
    failures=$((failures + 1))
  fi
}

assert_contains() {
  local file="$1"
  local pattern="$2"
  local label="$3"

  if [ -f "$file" ] && grep -Fq "$pattern" "$file"; then
    echo "  [PASS] $label"
  else
    echo "  [FAIL] $label"
    echo "    Expected to find: $pattern"
    echo "    In file: $file"
    failures=$((failures + 1))
  fi
}

echo "=== Jira Start Skill Structure Test ==="
echo ""

assert_file_exists "$JIRA_SKILL" "starting-from-a-jira-ticket SKILL.md exists"

assert_contains "$JIRA_SKILL" "name: starting-from-a-jira-ticket" "frontmatter name matches directory"
assert_contains "$JIRA_SKILL" "description: Use when starting work from a Jira ticket" "frontmatter description states the trigger"

assert_contains "$JIRA_SKILL" 'git status --porcelain' "preflight checks for a clean working tree"
assert_contains "$JIRA_SKILL" "Never auto-stash" "skill refuses to stash on its own"

assert_contains "$JIRA_SKILL" "git fetch origin" "skill fetches before branching"
assert_contains "$JIRA_SKILL" "refs/remotes/origin/HEAD" "skill resolves the default branch from origin/HEAD"
assert_contains "$JIRA_SKILL" 'git checkout -b "$BRANCH" "origin/$DEFAULT"' "branch is created from the fetched default branch"

assert_contains "$JIRA_SKILL" "superpowers:systematic-debugging" "Bug tickets route to systematic-debugging"
assert_contains "$JIRA_SKILL" "superpowers:brainstorming" "non-Bug tickets route to brainstorming"

assert_contains "$JIRA_SKILL" "ask your human partner to paste" "skill degrades to a paste when no Jira MCP is present"

echo ""

if [ "$failures" -gt 0 ]; then
  echo "STATUS: FAILED ($failures failures)"
  exit 1
fi

echo "STATUS: PASSED"
