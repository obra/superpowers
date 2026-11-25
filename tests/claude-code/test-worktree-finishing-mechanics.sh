#!/usr/bin/env bash
# Runs the git snippets the worktree skills give an agent, in throwaway
# repositories. Each case extracts its snippet from the skill's fenced block,
# so it tests the commands an agent copies, not a retyped version of them.
# To add a case, write a function that reports through pass and fail, and
# call it with run_case.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
USING_SKILL="$REPO_ROOT/skills/using-git-worktrees/SKILL.md"

FAILURES=0
TEST_ROOT="$(mktemp -d)"
CASE_DIR=""

cleanup() {
    if [[ -n "$TEST_ROOT" && -d "$TEST_ROOT" ]]; then
        rm -rf "$TEST_ROOT"
    fi
}
trap cleanup EXIT

pass() { echo "  [PASS] $1"; }
fail() {
    echo "  [FAIL] $1"
    FAILURES=$((FAILURES + 1))
}

# Print the body of the first bash fence after the first line of FILE that
# starts with MARKER (a heading, or a paragraph's bold lead-in). Print nothing
# if the marker is missing or a heading comes before the fence.
skill_fence() {
    local file="$1"
    local marker="$2"
    awk -v m="$marker" '
        !found { if (index($0, m) == 1) found = 1; next }
        !in_code && /^#/ { exit }
        !in_code && /^[[:space:]]*```bash[[:space:]]*$/ { in_code = 1; next }
        in_code && /^[[:space:]]*```[[:space:]]*$/ { exit }
        in_code { print }
    ' "$file"
}

# Run the case function NAME with CASE_DIR set to a fresh directory of its own.
run_case() {
    local name="$1"
    echo ""
    echo "--- $name"
    CASE_DIR="$TEST_ROOT/$name"
    mkdir "$CASE_DIR"
    "$name"
}

# #2515: the check covers only the directory that Directory Selection chose,
# and its trailing slash lets a directory-only pattern such as `.worktrees/`
# match before the directory exists.
ignore_check_uses_selected_dir() {
    local check repo rc
    check="$(skill_fence "$USING_SKILL" '#### Safety Verification (project-local directories only)')"
    if [[ -z "$check" ]]; then
        fail "no bash fence under Safety Verification"
        return
    fi

    repo="$CASE_DIR/only-other-dir-ignored"
    git init -q -b main "$repo"
    mkdir "$repo/.worktrees" "$repo/worktrees"
    printf 'worktrees/\n' >"$repo/.gitignore"
    rc=0
    (cd "$repo" && LOCATION=.worktrees bash -c "$check") || rc=$?
    if [[ "$rc" -ne 0 ]]; then
        pass "only worktrees/ is ignored: the check on .worktrees fails"
    else
        fail "only worktrees/ is ignored: the check on .worktrees fails (it exited 0)"
    fi

    repo="$CASE_DIR/selected-dir-not-created"
    git init -q -b main "$repo"
    printf '.worktrees/\n' >"$repo/.gitignore"
    rc=0
    (cd "$repo" && LOCATION=.worktrees bash -c "$check") || rc=$?
    if [[ "$rc" -eq 0 ]]; then
        pass ".worktrees/ is ignored and not created yet: the check passes"
    else
        fail ".worktrees/ is ignored and not created yet: the check passes (it exited $rc)"
    fi
}

echo "=== Test: worktree and finishing mechanics ==="

run_case ignore_check_uses_selected_dir

echo ""
if [[ "$FAILURES" -gt 0 ]]; then
    echo "STATUS: FAILED ($FAILURES failures)"
    exit 1
fi
echo "STATUS: PASSED"
