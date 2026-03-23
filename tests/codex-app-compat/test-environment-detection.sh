#!/usr/bin/env bash
set -euo pipefail

# Test environment detection logic from PRI-823
# Tests the git-dir vs git-common-dir comparison used by
# using-git-worktrees Step 0 and finishing-a-development-branch Step 1.5

PASS=0
FAIL=0
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

log_pass() { echo "  PASS: $1"; PASS=$((PASS + 1)); }
log_fail() { echo "  FAIL: $1"; FAIL=$((FAIL + 1)); }

# Helper: run detection and return "linked" or "normal"
detect_worktree() {
  local git_dir git_common
  git_dir=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
  git_common=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
  if [ "$git_dir" != "$git_common" ]; then
    echo "linked"
  else
    echo "normal"
  fi
}

echo "=== Test 1: Normal repo detection ==="
cd "$TEMP_DIR"
git init test-repo > /dev/null 2>&1
cd test-repo
git commit --allow-empty -m "init" > /dev/null 2>&1
result=$(detect_worktree)
if [ "$result" = "normal" ]; then
  log_pass "Normal repo detected as normal"
else
  log_fail "Normal repo detected as '$result' (expected 'normal')"
fi

echo "=== Test 2: Linked worktree detection ==="
git worktree add "$TEMP_DIR/test-wt" -b test-branch > /dev/null 2>&1
cd "$TEMP_DIR/test-wt"
result=$(detect_worktree)
if [ "$result" = "linked" ]; then
  log_pass "Linked worktree detected as linked"
else
  log_fail "Linked worktree detected as '$result' (expected 'linked')"
fi

echo "=== Test 3: Detached HEAD detection ==="
git checkout --detach HEAD > /dev/null 2>&1
branch=$(git branch --show-current)
if [ -z "$branch" ]; then
  log_pass "Detached HEAD: branch is empty"
else
  log_fail "Detached HEAD: branch is '$branch' (expected empty)"
fi

echo "=== Test 4: Linked worktree + detached HEAD (Codex App simulation) ==="
result=$(detect_worktree)
branch=$(git branch --show-current)
if [ "$result" = "linked" ] && [ -z "$branch" ]; then
  log_pass "Codex App simulation: linked + detached HEAD"
else
  log_fail "Codex App simulation: result='$result', branch='$branch'"
fi

echo "=== Test 5: Cleanup guard — linked worktree should NOT remove ==="
cd "$TEMP_DIR/test-wt"
result=$(detect_worktree)
if [ "$result" = "linked" ]; then
  log_pass "Cleanup guard: linked worktree correctly detected (would skip removal)"
else
  log_fail "Cleanup guard: expected 'linked', got '$result'"
fi

echo "=== Test 6: Cleanup guard — main repo SHOULD remove ==="
cd "$TEMP_DIR/test-repo"
result=$(detect_worktree)
if [ "$result" = "normal" ]; then
  log_pass "Cleanup guard: main repo correctly detected (would proceed with removal)"
else
  log_fail "Cleanup guard: expected 'normal', got '$result'"
fi

# Cleanup worktree before temp dir removal
cd "$TEMP_DIR/test-repo"
git worktree remove "$TEMP_DIR/test-wt" > /dev/null 2>&1 || true

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
