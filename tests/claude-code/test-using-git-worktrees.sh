#!/usr/bin/env bash
# Test: using-git-worktrees skill
# Verifies worktree creation, directory selection, gitignore safety, and hooks sharing
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: using-git-worktrees skill ==="
echo ""

setup_test_repo() {
    local test_dir
    test_dir=$(create_test_project)
    cd "$test_dir"
    git init --template="" >&2
    git config user.email "test@test.com"
    git config user.name "Test"
    git commit --allow-empty --no-verify -m "initial" >&2
    echo "$test_dir"
}

# ---------- Test 1: Uses existing .worktrees directory ----------
echo "Test 1: Uses existing .worktrees directory..."

test_dir=$(setup_test_repo)
cd "$test_dir"
mkdir .worktrees
echo ".worktrees" >> .gitignore
git add .gitignore && git commit --no-verify -m "add gitignore"

output=$(run_claude "Use the /using-git-worktrees skill to create a worktree for a branch called test-feature. Skip running project setup and tests." 120 "Bash,Read,Glob,Grep,Skill")

if [ -d "$test_dir/.worktrees/test-feature" ]; then
    echo "  [PASS] Worktree created in existing .worktrees directory"
else
    echo "  [FAIL] Worktree not created in .worktrees/test-feature"
    echo "  Output:"
    echo "$output" | sed 's/^/    /'
    cleanup_test_project "$test_dir"
    exit 1
fi

cleanup_test_project "$test_dir"
echo ""

# ---------- Test 2: Adds .worktrees to .gitignore if not ignored ----------
echo "Test 2: Adds directory to .gitignore if not ignored..."

test_dir=$(setup_test_repo)
cd "$test_dir"
mkdir .worktrees
# Deliberately do NOT add .worktrees to .gitignore

output=$(run_claude "Use the /using-git-worktrees skill to create a worktree for a branch called test-safety. Skip running project setup and tests." 120 "Bash,Read,Glob,Grep,Skill")

if git check-ignore -q .worktrees 2>/dev/null; then
    echo "  [PASS] .worktrees is now gitignored"
else
    echo "  [FAIL] .worktrees is not gitignored"
    echo "  Output:"
    echo "$output" | sed 's/^/    /'
    cleanup_test_project "$test_dir"
    exit 1
fi

cleanup_test_project "$test_dir"
echo ""

# ---------- Test 3: Shares hooks with worktree via symlink ----------
echo "Test 3: Shares hooks with worktree via symlink..."

test_dir=$(setup_test_repo)
cd "$test_dir"
mkdir -p .git/hooks
cat > .git/hooks/pre-commit <<'HOOK'
#!/bin/bash
echo "hook ran"
HOOK
chmod +x .git/hooks/pre-commit
mkdir .worktrees
echo ".worktrees" >> .gitignore
git add .gitignore && git commit --no-verify -m "add gitignore"

output=$(run_claude "Use the /using-git-worktrees skill to create a worktree for a branch called test-hooks. Skip running project setup and tests." 120 "Bash,Read,Glob,Grep,Skill")

worktree_git_dir=$(cd "$test_dir/.worktrees/test-hooks" && git rev-parse --git-dir)

if [ -L "$worktree_git_dir/hooks" ]; then
    echo "  [PASS] Hooks directory is a symlink"
else
    echo "  [FAIL] Hooks directory is not a symlink"
    echo "  worktree git dir: $worktree_git_dir"
    ls -la "$worktree_git_dir/hooks" 2>&1 | sed 's/^/    /'
    cleanup_test_project "$test_dir"
    exit 1
fi

if [ -f "$worktree_git_dir/hooks/pre-commit" ]; then
    echo "  [PASS] Main repo hooks accessible through symlink"
else
    echo "  [FAIL] Main repo hooks not accessible through symlink"
    cleanup_test_project "$test_dir"
    exit 1
fi

cleanup_test_project "$test_dir"
echo ""

# ---------- Test 3b: Replaces existing hooks dir with symlink ----------
echo "Test 3b: Replaces existing hooks directory with symlink..."

test_dir=$(setup_test_repo)
cd "$test_dir"
mkdir -p .git/hooks
cat > .git/hooks/pre-commit <<'HOOK'
#!/bin/bash
echo "hook ran"
HOOK
chmod +x .git/hooks/pre-commit

# Create a post-checkout hook that seeds a real hooks/ dir in worktrees.
# This simulates tools like git-mit that populate worktree hooks on checkout.
cat > .git/hooks/post-checkout <<'HOOK'
#!/bin/bash
git_dir="$(git rev-parse --git-dir)"
# Only act inside a worktree (git-dir is under .git/worktrees/)
case "$git_dir" in *worktrees/*)
    rm -f "$git_dir/hooks" 2>/dev/null   # remove any default symlink
    mkdir -p "$git_dir/hooks"
    cp "$0" "$git_dir/hooks/post-checkout"
    chmod +x "$git_dir/hooks/post-checkout"
    ;; esac
HOOK
chmod +x .git/hooks/post-checkout

mkdir .worktrees
echo ".worktrees" >> .gitignore
git add .gitignore && git commit --no-verify -m "add gitignore"

output=$(run_claude "Use the /using-git-worktrees skill to create a worktree for a branch called test-hooks-replace. Skip running project setup and tests." 120 "Bash,Read,Glob,Grep,Skill")

worktree_git_dir=$(cd "$test_dir/.worktrees/test-hooks-replace" && git rev-parse --git-dir)

if [ -L "$worktree_git_dir/hooks" ]; then
    echo "  [PASS] Hooks directory replaced with symlink"
else
    echo "  [FAIL] Hooks directory is not a symlink (real dir was not replaced)"
    echo "  worktree git dir: $worktree_git_dir"
    ls -la "$worktree_git_dir/hooks" 2>&1 | sed 's/^/    /'
    cleanup_test_project "$test_dir"
    exit 1
fi

if [ -f "$worktree_git_dir/hooks/pre-commit" ]; then
    echo "  [PASS] Main repo hooks accessible through symlink"
else
    echo "  [FAIL] Main repo hooks not accessible through symlink"
    cleanup_test_project "$test_dir"
    exit 1
fi

cleanup_test_project "$test_dir"
echo ""

# ---------- Test 4: Creates worktree on a new branch ----------
echo "Test 4: Creates worktree on a new branch..."

test_dir=$(setup_test_repo)
cd "$test_dir"
mkdir .worktrees
echo ".worktrees" >> .gitignore
git add .gitignore && git commit --no-verify -m "add gitignore"

output=$(run_claude "Use the /using-git-worktrees skill to create a worktree for a branch called test-branch. Skip running project setup and tests." 120 "Bash,Read,Glob,Grep,Skill")

if cd "$test_dir/.worktrees/test-branch" && [ "$(git rev-parse --abbrev-ref HEAD)" = "test-branch" ]; then
    echo "  [PASS] Worktree is on the correct branch"
else
    echo "  [FAIL] Worktree not on expected branch"
    echo "  Output:"
    echo "$output" | sed 's/^/    /'
    cleanup_test_project "$test_dir"
    exit 1
fi

cleanup_test_project "$test_dir"
echo ""

echo "=== All using-git-worktrees skill tests passed ==="
