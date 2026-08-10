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

    # --- per-plan resolution ---
    local dir_a dir_b
    dir_a="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" plan-a.md)"
    dir_b="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" plan-b.md)"

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

    # --- foreign-ticket detection ---------------------------------------
    cat > "$repo/2026-01-01-FEATURE-100-sample.md" <<'PLAN'
# Plan FEATURE#100

## Task 1: Sample

Do the thing.
PLAN

    ( cd "$repo" \
        && printf 'a\n' > own.txt && git add own.txt \
        && git "${git_id[@]}" commit -qm "feat: own change (FEATURE#100)" )
    local own_base own_head
    own_base="$(cd "$repo" && git rev-parse HEAD~1)"
    own_head="$(cd "$repo" && git rev-parse HEAD)"

    local own_out own_path
    own_out="$(cd "$repo" && "$SDD_SCRIPTS/review-package" 2026-01-01-FEATURE-100-sample.md "$own_base" "$own_head" 2>"$TEST_ROOT/own.stderr")"
    own_path="$(printf '%s\n' "$own_out" | sed -n 's/^wrote \(.*\): [0-9].*$/\1/p')"
    if [[ ! -s "$TEST_ROOT/own.stderr" ]] && ! grep -q "Foreign-ticket" "$own_path"; then
        pass "review-package: same-ticket range produces no warning"
    else
        fail "review-package: same-ticket range produces no warning"
        echo "    stderr: $(cat "$TEST_ROOT/own.stderr")"
    fi

    ( cd "$repo" \
        && printf 'b\n' > foreign.txt && git add foreign.txt \
        && git "${git_id[@]}" commit -qm "fix: unrelated change (FEATURE#200)" )
    local mixed_head
    mixed_head="$(cd "$repo" && git rev-parse HEAD)"

    local mixed_out mixed_path
    mixed_out="$(cd "$repo" && "$SDD_SCRIPTS/review-package" 2026-01-01-FEATURE-100-sample.md "$own_base" "$mixed_head" 2>"$TEST_ROOT/mixed.stderr")"
    mixed_path="$(printf '%s\n' "$mixed_out" | sed -n 's/^wrote \(.*\): [0-9].*$/\1/p')"
    if grep -q "FEATURE#200" "$TEST_ROOT/mixed.stderr" && grep -q "Foreign-ticket" "$mixed_path"; then
        pass "review-package: foreign-ticket commit triggers stderr warning and output-file warning block"
    else
        fail "review-package: foreign-ticket commit triggers stderr warning and output-file warning block"
        echo "    stderr: $(cat "$TEST_ROOT/mixed.stderr")"
    fi

    ( cd "$repo" \
        && printf 'c\n' > foreign2.txt && git add foreign2.txt \
        && git "${git_id[@]}" commit -qm "chore: another unrelated change (BUG-300)" )
    local multi_head
    multi_head="$(cd "$repo" && git rev-parse HEAD)"

    local multi_out multi_path
    multi_out="$(cd "$repo" && "$SDD_SCRIPTS/review-package" 2026-01-01-FEATURE-100-sample.md "$own_base" "$multi_head" 2>"$TEST_ROOT/multi.stderr")"
    multi_path="$(printf '%s\n' "$multi_out" | sed -n 's/^wrote \(.*\): [0-9].*$/\1/p')"
    if grep -q "^[a-f0-9]\+	fix: unrelated change (FEATURE#200)$" "$TEST_ROOT/multi.stderr" \
        && grep -q "^[a-f0-9]\+	chore: another unrelated change (BUG-300)$" "$TEST_ROOT/multi.stderr"; then
        pass "review-package: two foreign-ticket commits each appear on their own line"
    else
        fail "review-package: two foreign-ticket commits each appear on their own line"
        echo "    stderr: $(cat "$TEST_ROOT/multi.stderr")"
    fi

    cat > "$repo/no-ticket-plan.md" <<'PLAN'
# Untracked plan

## Task 1: Sample

Do the thing.
PLAN
    local notick_out notick_path
    notick_out="$(cd "$repo" && "$SDD_SCRIPTS/review-package" no-ticket-plan.md "$own_base" "$mixed_head" 2>"$TEST_ROOT/notick.stderr")"
    notick_path="$(printf '%s\n' "$notick_out" | sed -n 's/^wrote \(.*\): [0-9].*$/\1/p')"
    if [[ ! -s "$TEST_ROOT/notick.stderr" ]] && ! grep -q "Foreign-ticket" "$notick_path"; then
        pass "review-package: plan with no identifiable ticket skips the check"
    else
        fail "review-package: plan with no identifiable ticket skips the check"
        echo "    stderr: $(cat "$TEST_ROOT/notick.stderr")"
    fi

    ( cd "$repo" \
        && printf 'd\n' > noref.txt && git add noref.txt \
        && git "${git_id[@]}" commit -qm "chore: tidy up formatting" )
    local noref_head
    noref_head="$(cd "$repo" && git rev-parse HEAD)"

    local noref_out noref_path
    noref_out="$(cd "$repo" && "$SDD_SCRIPTS/review-package" 2026-01-01-FEATURE-100-sample.md "$noref_head~1" "$noref_head" 2>"$TEST_ROOT/noref.stderr")"
    noref_path="$(printf '%s\n' "$noref_out" | sed -n 's/^wrote \(.*\): [0-9].*$/\1/p')"
    if [[ ! -s "$TEST_ROOT/noref.stderr" ]] && ! grep -q "Foreign-ticket" "$noref_path"; then
        pass "review-package: commit with no ticket reference at all is never flagged"
    else
        fail "review-package: commit with no ticket reference at all is never flagged"
        echo "    stderr: $(cat "$TEST_ROOT/noref.stderr")"
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

    echo ""
    if [[ "$FAILURES" -ne 0 ]]; then
        echo "FAILED: $FAILURES assertion(s)."
        exit 1
    fi
    echo "PASS"
}

main "$@"
