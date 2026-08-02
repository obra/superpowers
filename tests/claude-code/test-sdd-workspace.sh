#!/usr/bin/env bash
# Tests for the SDD workspace: scripts/sdd-workspace resolves a self-ignoring,
# plan- and session-isolated working-tree directory for SDD artifacts, and the
# SDD scripts write into it.
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

without_sdd_session() {
    unset CLAUDE_CODE_SESSION_ID
    unset SUPERPOWERS_SDD_SESSION
    "$@"
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

    # --- per-plan resolution ---
    local dir_a dir_b
    dir_a="$(cd "$repo" && without_sdd_session "$SDD_SCRIPTS/sdd-workspace" plan-a.md)"
    dir_b="$(cd "$repo" && without_sdd_session "$SDD_SCRIPTS/sdd-workspace" plan-b.md)"

    if [[ "$dir_a" == "$repo/.superpowers/sdd/plan-a" ]]; then
        pass "prints <repo-root>/.superpowers/sdd/<plan-basename>"
    else
        fail "prints <repo-root>/.superpowers/sdd/<plan-basename>"
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

    local empty_dir
    empty_dir="$(cd "$repo" && env CLAUDE_CODE_SESSION_ID= SUPERPOWERS_SDD_SESSION= "$SDD_SCRIPTS/sdd-workspace" plan-a.md)"
    if [[ "$empty_dir" == "$repo/.superpowers/sdd/plan-a" ]]; then
        pass "empty session vars fall back to the plan-scoped workspace"
    else
        fail "empty session vars fall back to the plan-scoped workspace"
        echo "    got: $empty_dir"
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
    brief_out="$(cd "$repo" && without_sdd_session "$SDD_SCRIPTS/task-brief" plan-a.md 1)"
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
    rp_out="$(cd "$repo" && without_sdd_session "$SDD_SCRIPTS/review-package" plan-a.md HEAD~1 HEAD)"
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
    rp_explicit="$(cd "$repo" && without_sdd_session "$SDD_SCRIPTS/review-package" plan-a.md HEAD~1 HEAD "$TEST_ROOT/explicit.diff")"
    if [[ -s "$TEST_ROOT/explicit.diff" && "$rp_explicit" == *"$TEST_ROOT/explicit.diff"* ]]; then
        pass "review-package honors an explicit OUTFILE"
    else
        fail "review-package honors an explicit OUTFILE"
        echo "    got: $rp_explicit"
    fi

    # --- session resolution uses one flat plan+session workspace key ---
    local alpha_dir beta_dir
    alpha_dir="$(cd "$repo" && CLAUDE_CODE_SESSION_ID=alpha "$SDD_SCRIPTS/sdd-workspace" plan-a.md)"
    beta_dir="$(cd "$repo" && CLAUDE_CODE_SESSION_ID=beta "$SDD_SCRIPTS/sdd-workspace" plan-a.md)"
    if [[ "$alpha_dir" == "$repo/.superpowers/sdd/plan-a--alpha+616c706861" && "$beta_dir" == "$repo/.superpowers/sdd/plan-a--beta+62657461" && "$alpha_dir" != "$beta_dir" ]]; then
        pass "CLAUDE_CODE_SESSION_ID isolates concurrent executions of one plan"
    else
        fail "CLAUDE_CODE_SESSION_ID isolates concurrent executions of one plan"
        echo "    alpha: $alpha_dir"
        echo "    beta:  $beta_dir"
    fi

    local alpha_plan_b_dir
    alpha_plan_b_dir="$(cd "$repo" && CLAUDE_CODE_SESSION_ID=alpha "$SDD_SCRIPTS/sdd-workspace" plan-b.md)"
    if [[ "$alpha_plan_b_dir" == "$repo/.superpowers/sdd/plan-b--alpha+616c706861" && "$alpha_plan_b_dir" != "$alpha_dir" ]]; then
        pass "one session still isolates different plans"
    else
        fail "one session still isolates different plans"
        echo "    plan a: $alpha_dir"
        echo "    plan b: $alpha_plan_b_dir"
    fi

    local alpha_rp_out alpha_rp_path
    alpha_rp_out="$(cd "$repo" && CLAUDE_CODE_SESSION_ID=alpha "$SDD_SCRIPTS/review-package" plan-a.md HEAD~1 HEAD)"
    alpha_rp_path="$(printf '%s\n' "$alpha_rp_out" | sed -n 's/^wrote \(.*\): [0-9].*$/\1/p')"
    case "$alpha_rp_path" in
        "$repo/.superpowers/sdd/plan-a--alpha+616c706861/review-"*.diff)
            pass "review-package writes its diff under the session workspace"
            ;;
        *)
            fail "review-package writes its diff under the session workspace"
            echo "    got: $alpha_rp_path"
            ;;
    esac

    cat > "$repo/session-plan.md" <<'PLAN'
# Session Plan

## Task 1: Alpha

Alpha session content.
PLAN
    local alpha_brief_out alpha_brief_path beta_brief_out beta_brief_path
    alpha_brief_out="$(cd "$repo" && CLAUDE_CODE_SESSION_ID=alpha "$SDD_SCRIPTS/task-brief" session-plan.md 1)"
    alpha_brief_path="$(printf '%s\n' "$alpha_brief_out" | sed -n 's/^wrote \(.*\): [0-9][0-9]* lines$/\1/p')"

    cat > "$repo/session-plan.md" <<'PLAN'
# Session Plan

## Task 1: Beta

Beta session content.
PLAN
    beta_brief_out="$(cd "$repo" && CLAUDE_CODE_SESSION_ID=beta "$SDD_SCRIPTS/task-brief" session-plan.md 1)"
    beta_brief_path="$(printf '%s\n' "$beta_brief_out" | sed -n 's/^wrote \(.*\): [0-9][0-9]* lines$/\1/p')"

    if [[ "$alpha_brief_path" == "$repo/.superpowers/sdd/session-plan--alpha+616c706861/task-1-brief.md" \
        && "$beta_brief_path" == "$repo/.superpowers/sdd/session-plan--beta+62657461/task-1-brief.md" \
        && "$alpha_brief_path" != "$beta_brief_path" \
        && "$(cat "$alpha_brief_path")" == *"Alpha session content."* \
        && "$(cat "$beta_brief_path")" == *"Beta session content."* ]]; then
        pass "task-brief writes same task number to session-isolated files"
    else
        fail "task-brief writes same task number to session-isolated files"
        echo "    alpha: $alpha_brief_path"
        echo "    beta:  $beta_brief_path"
    fi

    local override_dir unsafe_dir
    override_dir="$(cd "$repo" && CLAUDE_CODE_SESSION_ID=alpha SUPERPOWERS_SDD_SESSION=override "$SDD_SCRIPTS/sdd-workspace" plan-a.md)"
    if [[ "$override_dir" == "$repo/.superpowers/sdd/plan-a--override+6f76657272696465" ]]; then
        pass "SUPERPOWERS_SDD_SESSION overrides CLAUDE_CODE_SESSION_ID"
    else
        fail "SUPERPOWERS_SDD_SESSION overrides CLAUDE_CODE_SESSION_ID"
        echo "    got: $override_dir"
    fi

    unsafe_dir="$(cd "$repo" && CLAUDE_CODE_SESSION_ID=alpha SUPERPOWERS_SDD_SESSION="a/b .." "$SDD_SCRIPTS/sdd-workspace" plan-a.md)"
    if [[ "$unsafe_dir" == "$repo/.superpowers/sdd/plan-a--a_b_..+612f62202e2e" && ! -d "$repo/.superpowers/sdd/plan-a--a" ]]; then
        pass "session ids are sanitized to one safe path segment"
    else
        fail "session ids are sanitized to one safe path segment"
        echo "    got: $unsafe_dir"
    fi

    local slash_dir question_dir
    slash_dir="$(cd "$repo" && SUPERPOWERS_SDD_SESSION='a/b' "$SDD_SCRIPTS/sdd-workspace" plan-a.md)"
    question_dir="$(cd "$repo" && SUPERPOWERS_SDD_SESSION='a?b' "$SDD_SCRIPTS/sdd-workspace" plan-a.md)"
    if [[ "$slash_dir" == "$repo/.superpowers/sdd/plan-a--a_b+612f62" \
        && "$question_dir" == "$repo/.superpowers/sdd/plan-a--a_b+613f62" \
        && "$slash_dir" != "$question_dir" ]]; then
        pass "distinct raw session ids cannot collide after sanitization"
    else
        fail "distinct raw session ids cannot collide after sanitization"
        echo "    slash:    $slash_dir"
        echo "    question: $question_dir"
    fi

    # --- Worktree isolation: a linked worktree resolves its own workspace ---
    local wt="$TEST_ROOT/wt"
    ( cd "$repo" && git worktree add -q "$wt" -b wt-feature )
    local wt_root wt_dir
    wt_root="$(cd "$wt" && git rev-parse --show-toplevel)"
    wt_dir="$(cd "$wt" && without_sdd_session "$SDD_SCRIPTS/sdd-workspace" plan-a.md)"
    if [[ "$wt_dir" == "$wt_root/.superpowers/sdd/plan-a" && "$wt_dir" != "$dir_a" ]]; then
        pass "linked worktree resolves its own distinct workspace"
    else
        fail "linked worktree resolves its own distinct workspace"
        echo "    main: $dir_a"
        echo "    wt:   $wt_dir"
    fi

    local wt_session_dir
    wt_session_dir="$(cd "$wt" && CLAUDE_CODE_SESSION_ID=alpha "$SDD_SCRIPTS/sdd-workspace" plan-a.md)"
    if [[ "$wt_session_dir" == "$wt_root/.superpowers/sdd/plan-a--alpha+616c706861" && "$wt_session_dir" != "$alpha_dir" ]]; then
        pass "linked worktree session workspace remains distinct"
    else
        fail "linked worktree session workspace remains distinct"
        echo "    main: $alpha_dir"
        echo "    wt:   $wt_session_dir"
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

    echo ""
    if [[ "$FAILURES" -ne 0 ]]; then
        echo "FAILED: $FAILURES assertion(s)."
        exit 1
    fi
    echo "PASS"
}

main "$@"
