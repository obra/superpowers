#!/usr/bin/env bash
# Tests for the SDD workspace: scripts/sdd-workspace resolves a self-ignoring,
# PER-PLAN working-tree directory for SDD artifacts, and the SDD scripts write
# into their plan's directory.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SDD_SCRIPTS="$REPO_ROOT/skills/subagent-driven-development/scripts"

FAILURES=0
TEST_ROOT=""

pass() { echo "  [PASS] $1"; }
fail() {
    echo "  [FAIL] $1"
    FAILURES=$((FAILURES + 1))
}

cleanup() {
    if [[ -n "$TEST_ROOT" && -d "$TEST_ROOT" ]]; then
        rm -rf "$TEST_ROOT"
    fi
}

main() {
    echo "=== Test: sdd-workspace ==="

    TEST_ROOT="$(mktemp -d)"
    trap cleanup EXIT

    # Resolve repo to its physical path so string comparisons match the
    # helper's output (git rev-parse --show-toplevel resolves symlinks; on
    # macOS mktemp lives under /var -> /private/var).
    git init -q -b main "$TEST_ROOT/repo"
    local repo
    repo="$(cd "$TEST_ROOT/repo" && git rev-parse --show-toplevel)"

    cat > "$repo/plan-a.md" <<'PLAN'
# Plan A

## Task 1: First thing

Do the first thing.
PLAN
    cat > "$repo/plan-b.md" <<'PLAN'
# Plan B

## Task 1: Other thing

Do the other thing.
PLAN

    # --- argument validation ---
    local rc=0
    (cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" >/dev/null 2>&1) || rc=$?
    if [[ "$rc" -eq 2 ]]; then
        pass "sdd-workspace without a plan errors with exit 2"
    else
        fail "sdd-workspace without a plan errors with exit 2"
        echo "    exit: $rc"
    fi

    rc=0
    (cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" no-such-plan.md >/dev/null 2>&1) || rc=$?
    if [[ "$rc" -eq 2 ]]; then
        pass "sdd-workspace with a missing plan file errors with exit 2"
    else
        fail "sdd-workspace with a missing plan file errors with exit 2"
        echo "    exit: $rc"
    fi

    printf '# Outside\n' > "$TEST_ROOT/outside.md"
    local outside_err
    rc=0
    outside_err="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" "$TEST_ROOT/outside.md" 2>&1 >/dev/null)" || rc=$?
    if [[ "$rc" -eq 2 && "$outside_err" == *"outside the repository"* ]]; then
        pass "sdd-workspace with a plan outside the repo errors with exit 2"
    else
        fail "sdd-workspace with a plan outside the repo errors with exit 2"
        echo "    exit: $rc"
        echo "    err:  $outside_err"
    fi

    # --- per-plan resolution ---
    local dir_a dir_b
    dir_a="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" plan-a.md)"
    dir_b="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" plan-b.md)"

    if [[ "$dir_a" == "$repo/.superpowers/sdd/plan-a" ]]; then
        pass "prints <repo-root>/.superpowers/sdd/<plan-slug>"
    else
        fail "prints <repo-root>/.superpowers/sdd/<plan-slug>"
        echo "    got: $dir_a"
    fi

    if [[ "$dir_a" != "$dir_b" && -d "$dir_a" && -d "$dir_b" ]]; then
        pass "two plans resolve to two distinct directories"
    else
        fail "two plans resolve to two distinct directories"
        echo "    a: $dir_a"
        echo "    b: $dir_b"
    fi

    if [[ -f "$repo/.superpowers/sdd/.gitignore" && "$(cat "$repo/.superpowers/sdd/.gitignore")" == "*" ]]; then
        pass "self-ignoring .gitignore created at .superpowers/sdd/ with '*'"
    else
        fail "self-ignoring .gitignore created at .superpowers/sdd/ with '*'"
    fi

    printf 'x\n' > "$dir_a/artifact.md"
    local status
    status="$(cd "$repo" && git status --porcelain)"
    # plan-a.md/plan-b.md are intentionally untracked fixture files; only the
    # workspace must be invisible.
    if [[ "$status" != *".superpowers"* ]]; then
        pass "workspace invisible to git status"
    else
        fail "workspace invisible to git status"
        echo "    status: $status"
    fi

    ( cd "$repo" && git add -A )
    local staged
    staged="$(cd "$repo" && git diff --cached --name-only)"
    if [[ "$staged" != *".superpowers"* ]]; then
        pass "git add -A does not stage the workspace"
    else
        fail "git add -A does not stage the workspace"
        echo "    staged: $staged"
    fi

    # --- task-brief lands in its plan's directory ---
    local brief_out brief_path
    brief_out="$(cd "$repo" && "$SDD_SCRIPTS/task-brief" plan-a.md 1)"
    brief_path="$(printf '%s\n' "$brief_out" | sed -n 's/^wrote \(.*\): [0-9][0-9]* lines$/\1/p')"
    if [[ "$brief_path" == "$repo/.superpowers/sdd/plan-a/task-1-brief.md" ]]; then
        pass "task-brief writes its brief under the plan's workspace"
    else
        fail "task-brief writes its brief under the plan's workspace"
        echo "    got: $brief_path"
    fi

    # --- review-package takes the plan first and lands in its directory ---
    local git_id=(-c user.email=t@example.com -c user.name=t -c commit.gpgsign=false)
    ( cd "$repo" \
        && git "${git_id[@]}" commit -qm c1 \
        && printf 'y\n' > f && git add f \
        && git "${git_id[@]}" commit -qm c2 )
    local rp_out rp_path
    rp_out="$(cd "$repo" && "$SDD_SCRIPTS/review-package" plan-a.md HEAD~1 HEAD)"
    rp_path="$(printf '%s\n' "$rp_out" | sed -n 's/^wrote \(.*\): [0-9].*$/\1/p')"
    case "$rp_path" in
        "$repo/.superpowers/sdd/plan-a/review-"*.diff)
            pass "review-package writes its diff under the plan's workspace" ;;
        *)
            fail "review-package writes its diff under the plan's workspace"
            echo "    got: $rp_path"
            ;;
    esac

    rc=0
    (cd "$repo" && "$SDD_SCRIPTS/review-package" HEAD~1 HEAD >/dev/null 2>&1) || rc=$?
    if [[ "$rc" -eq 2 ]]; then
        pass "review-package without a plan errors with exit 2"
    else
        fail "review-package without a plan errors with exit 2"
        echo "    exit: $rc"
    fi

    local rp_explicit
    rp_explicit="$(cd "$repo" && "$SDD_SCRIPTS/review-package" plan-a.md HEAD~1 HEAD "$TEST_ROOT/explicit.diff")"
    if [[ -s "$TEST_ROOT/explicit.diff" && "$rp_explicit" == *"$TEST_ROOT/explicit.diff"* ]]; then
        pass "review-package honors an explicit OUTFILE"
    else
        fail "review-package honors an explicit OUTFILE"
        echo "    got: $rp_explicit"
    fi

    # --- Worktree isolation: a linked worktree resolves its own workspace ---
    local wt="$TEST_ROOT/wt"
    ( cd "$repo" && git worktree add -q "$wt" -b wt-feature )
    local wt_root wt_dir
    wt_root="$(cd "$wt" && git rev-parse --show-toplevel)"
    wt_dir="$(cd "$wt" && "$SDD_SCRIPTS/sdd-workspace" plan-a.md)"
    if [[ "$wt_dir" == "$wt_root/.superpowers/sdd/plan-a" && "$wt_dir" != "$dir_a" ]]; then
        pass "linked worktree resolves its own distinct workspace"
    else
        fail "linked worktree resolves its own distinct workspace"
        echo "    main: $dir_a"
        echo "    wt:   $wt_dir"
    fi

    printf 'y\n' > "$wt_dir/artifact.md"
    local wt_status
    wt_status="$(cd "$wt" && git status --porcelain)"
    if [[ "$wt_status" != *".superpowers"* ]]; then
        pass "worktree workspace invisible to git status"
    else
        fail "worktree workspace invisible to git status"
        echo "    status: $wt_status"
    fi

    # --- Foldered plans: one directory per plan path, not per basename ---
    mkdir -p "$repo/docs/alpha" "$repo/docs/beta"
    cat > "$repo/docs/alpha/plan.md" <<'PLAN'
# Alpha

## Task 1: Alpha thing

Alpha requirements: MAGIC_CONST=7.
PLAN
    cat > "$repo/docs/beta/plan.md" <<'PLAN'
# Beta

## Task 1: Beta thing

Beta requirements.
PLAN

    local dir_alpha dir_beta
    dir_alpha="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" docs/alpha/plan.md)"
    dir_beta="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" docs/beta/plan.md)"

    if [[ "$dir_alpha" == "$repo/.superpowers/sdd/docs-alpha-plan" \
       && "$dir_beta" == "$repo/.superpowers/sdd/docs-beta-plan" \
       && -d "$dir_alpha" && -d "$dir_beta" ]]; then
        pass "plans sharing a basename resolve to distinct directories"
    else
        fail "plans sharing a basename resolve to distinct directories"
        echo "    alpha: $dir_alpha"
        echo "    beta:  $dir_beta"
    fi

    ( cd "$repo" && "$SDD_SCRIPTS/task-brief" docs/alpha/plan.md 1 >/dev/null )
    ( cd "$repo" && "$SDD_SCRIPTS/task-brief" docs/beta/plan.md 1 >/dev/null )
    if grep -q 'MAGIC_CONST=7' "$dir_alpha/task-1-brief.md" 2>/dev/null; then
        pass "a second plan's task-brief leaves the first plan's brief intact"
    else
        fail "a second plan's task-brief leaves the first plan's brief intact"
        echo "    alpha brief: $(cat "$dir_alpha/task-1-brief.md" 2>/dev/null || echo '<missing>')"
    fi

    # --- A name that strips to a degenerate slug is rejected, not built ---
    # Asserts the message too: three separate paths exit 2, so the code alone
    # would pass this test for the wrong reason.
    printf '# Dot\n' > "$repo/..md"
    local degenerate_err
    rc=0
    degenerate_err="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" ..md 2>&1 >/dev/null)" || rc=$?
    rm -f "$repo/..md"
    if [[ "$rc" -eq 2 && "$degenerate_err" == *"cannot derive a workspace name"* ]]; then
        pass "a plan whose slug would be '.' errors with exit 2"
    else
        fail "a plan whose slug would be '.' errors with exit 2"
        echo "    exit: $rc"
        echo "    err:  $degenerate_err"
    fi

    # --- Symlinks: the slug follows the spelling, wherever the link points ---
    mkdir -p "$TEST_ROOT/shared-specs" "$repo/real-specs"
    cat > "$TEST_ROOT/shared-specs/plan.md" <<'PLAN'
# Shared

## Task 1: Shared thing

Shared requirements.
PLAN
    cp "$TEST_ROOT/shared-specs/plan.md" "$repo/real-specs/plan.md"
    ln -s "$TEST_ROOT/shared-specs" "$repo/linked-out"
    ln -s "$repo/real-specs" "$repo/linked-in"

    local dir_out dir_in
    rc=0
    dir_out="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" linked-out/plan.md 2>&1)" || rc=$?
    if [[ "$rc" -eq 0 && "$dir_out" == "$repo/.superpowers/sdd/linked-out-plan" ]]; then
        pass "a plan under a symlink pointing outside the tree resolves by spelling"
    else
        fail "a plan under a symlink pointing outside the tree resolves by spelling"
        echo "    exit: $rc"
        echo "    got:  $dir_out"
    fi

    rc=0
    dir_in="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" linked-in/plan.md 2>&1)" || rc=$?
    if [[ "$rc" -eq 0 && "$dir_in" == "$repo/.superpowers/sdd/linked-in-plan" ]]; then
        pass "a plan under a symlink pointing inside the tree resolves by spelling"
    else
        fail "a plan under a symlink pointing inside the tree resolves by spelling"
        echo "    exit: $rc"
        echo "    got:  $dir_in"
    fi

    # --- The same tree reached through a symlinked prefix resolves alike ---
    ln -s "$repo" "$TEST_ROOT/link-to-repo"
    local dir_via_link
    rc=0
    dir_via_link="$(cd "$TEST_ROOT/link-to-repo" && "$SDD_SCRIPTS/sdd-workspace" linked-out/plan.md 2>&1)" || rc=$?
    if [[ "$rc" -eq 0 && "$dir_via_link" == "$dir_out" ]]; then
        pass "a tree reached through a symlink resolves to the same workspace"
    else
        fail "a tree reached through a symlink resolves to the same workspace"
        echo "    exit:   $rc"
        echo "    direct: $dir_out"
        echo "    linked: $dir_via_link"
    fi

    echo ""
    if [[ "$FAILURES" -ne 0 ]]; then
        echo "FAILED: $FAILURES assertion(s)."
        exit 1
    fi
    echo "PASS"
}

main "$@"
