#!/usr/bin/env bash
# Tests for the SDD workspace: scripts/sdd-workspace resolves a self-ignoring
# working-tree directory for SDD artifacts, and the SDD scripts write into it.
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

    local dir
    dir="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace")"

    if [[ "$dir" == "$repo/.superpowers/sdd" ]]; then
        pass "prints <repo-root>/.superpowers/sdd"
    else
        fail "prints <repo-root>/.superpowers/sdd"
        echo "    got: $dir"
    fi

    if [[ -f "$repo/.superpowers/sdd/.gitignore" && "$(cat "$repo/.superpowers/sdd/.gitignore")" == "*" ]]; then
        pass "self-ignoring .gitignore created with '*'"
    else
        fail "self-ignoring .gitignore created with '*'"
    fi

    printf 'x\n' > "$repo/.superpowers/sdd/artifact.md"
    local status
    status="$(cd "$repo" && git status --porcelain)"
    if [[ -z "$status" ]]; then
        pass "workspace invisible to git status"
    else
        fail "workspace invisible to git status"
        echo "    status: $status"
    fi

    ( cd "$repo" && git add -A )
    local staged
    staged="$(cd "$repo" && git diff --cached --name-only)"
    if [[ -z "$staged" ]]; then
        pass "git add -A does not stage the workspace"
    else
        fail "git add -A does not stage the workspace"
        echo "    staged: $staged"
    fi

    mkdir -p "$repo/a" "$repo/b"
    printf '# Plan A\n' > "$repo/a/plan.md"
    printf '# Plan B\n' > "$repo/b/plan.md"

    local plan_a_dir plan_b_dir
    plan_a_dir="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" a/plan.md)"
    plan_b_dir="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" b/plan.md)"
    if [[ "$plan_a_dir" == "$repo/.superpowers/sdd/"* && "$plan_b_dir" == "$repo/.superpowers/sdd/"* && "$plan_a_dir" != "$plan_b_dir" ]]; then
        pass "plan-scoped workspaces are distinct for plans with the same basename"
    else
        fail "plan-scoped workspaces are distinct for plans with the same basename"
        echo "    a: $plan_a_dir"
        echo "    b: $plan_b_dir"
    fi

    git init -q -b main "$TEST_ROOT/plan-only-repo"
    local plan_only_repo plan_only_dir plan_only_status
    plan_only_repo="$(cd "$TEST_ROOT/plan-only-repo" && git rev-parse --show-toplevel)"
    printf '# Plan\n' > "$plan_only_repo/plan.md"
    ( cd "$plan_only_repo" \
        && git add plan.md \
        && git -c user.email=t@example.com -c user.name=t -c commit.gpgsign=false commit -qm plan )
    plan_only_dir="$(cd "$plan_only_repo" && "$SDD_SCRIPTS/sdd-workspace" plan.md)"
    printf 'artifact\n' > "$plan_only_dir/artifact.md"
    plan_only_status="$(cd "$plan_only_repo" && git status --porcelain)"
    if [[ -z "$plan_only_status" ]]; then
        pass "plan-scoped workspace is invisible on first use"
    else
        fail "plan-scoped workspace is invisible on first use"
        echo "    status: $plan_only_status"
    fi

    cat > "$repo/plan.md" <<'PLAN'
# Plan

## Task 1: First thing

Do the first thing.
PLAN

    local brief_out brief_path
    brief_out="$(cd "$repo" && "$SDD_SCRIPTS/task-brief" plan.md 1)"
    brief_path="$(printf '%s\n' "$brief_out" | sed -n 's/^wrote \(.*\): [0-9][0-9]* lines$/\1/p')"
    case "$brief_path" in
        "$repo/.superpowers/sdd/"*) pass "task-brief writes its brief under the workspace" ;;
        *)
            fail "task-brief writes its brief under the workspace"
            echo "    got: $brief_path"
            ;;
    esac
    if [[ "$(dirname "$brief_path")" == "$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" plan.md)" && "$(dirname "$brief_path")" != "$dir" ]]; then
        pass "task-brief defaults to the plan-scoped workspace"
    else
        fail "task-brief defaults to the plan-scoped workspace"
        echo "    brief: $brief_path"
        echo "    legacy: $dir"
        echo "    workspace: $(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" plan.md)"
    fi

    local git_id=(-c user.email=t@example.com -c user.name=t -c commit.gpgsign=false)
    ( cd "$repo" \
        && git add plan.md \
        && git "${git_id[@]}" commit -qm c1 \
        && printf 'y\n' > f && git add f \
        && git "${git_id[@]}" commit -qm c2 )
    local rp_out rp_path
    rp_out="$(cd "$repo" && "$SDD_SCRIPTS/review-package" plan.md HEAD~1 HEAD)"
    rp_path="$(printf '%s\n' "$rp_out" | sed -n 's/^wrote \(.*\): [0-9].*$/\1/p')"
    case "$rp_path" in
        "$repo/.superpowers/sdd/"*) pass "review-package writes its diff under the workspace" ;;
        *)
            fail "review-package writes its diff under the workspace"
            echo "    got: $rp_path"
            ;;
    esac
    if [[ "$(dirname "$rp_path")" == "$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" plan.md)" && "$(dirname "$rp_path")" != "$dir" ]]; then
        pass "review-package honors SDD_PLAN_ID for plan-scoped output"
    else
        fail "review-package honors SDD_PLAN_ID for plan-scoped output"
        echo "    review: $rp_path"
        echo "    legacy: $dir"
        echo "    workspace: $(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" plan.md)"
    fi

    # --- Worktree isolation: a linked worktree resolves its own workspace ---
    local wt="$TEST_ROOT/wt"
    ( cd "$repo" && git worktree add -q "$wt" -b wt-feature )
    local wt_root wt_dir
    wt_root="$(cd "$wt" && git rev-parse --show-toplevel)"
    wt_dir="$(cd "$wt" && "$SDD_SCRIPTS/sdd-workspace")"
    if [[ "$wt_dir" == "$wt_root/.superpowers/sdd" && "$wt_dir" != "$dir" ]]; then
        pass "linked worktree resolves its own distinct workspace"
    else
        fail "linked worktree resolves its own distinct workspace"
        echo "    main: $dir"
        echo "    wt:   $wt_dir"
    fi

    printf 'y\n' > "$wt/.superpowers/sdd/artifact.md"
    local wt_status
    wt_status="$(cd "$wt" && git status --porcelain)"
    if [[ -z "$wt_status" ]]; then
        pass "worktree workspace invisible to git status"
    else
        fail "worktree workspace invisible to git status"
        echo "    status: $wt_status"
    fi

    echo ""
    if [[ "$FAILURES" -ne 0 ]]; then
        echo "FAILED: $FAILURES assertion(s)."
        exit 1
    fi
    echo "PASS"
}

main "$@"
