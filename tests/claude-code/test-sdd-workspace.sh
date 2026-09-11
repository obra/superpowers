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

    # --- Ownership markers: two plans with the same basename (#2045) ---
    mkdir -p "$repo/docs/alpha" "$repo/docs/beta"
    cat > "$repo/docs/alpha/plan.md" <<'PLAN'
# Alpha Plan

## Task 1: Alpha work

Alpha-only requirement text.
PLAN
    cat > "$repo/docs/beta/plan.md" <<'PLAN'
# Beta Plan

## Task 1: Beta work

Beta-only requirement text.
PLAN

    local dir_alpha dir_beta
    dir_alpha="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" docs/alpha/plan.md)"
    dir_beta="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" docs/beta/plan.md)"
    if [[ "$dir_alpha" != "$dir_beta" ]]; then
        pass "same-basename plans resolve to distinct workspaces"
    else
        fail "same-basename plans resolve to distinct workspaces"
        echo "    alpha: $dir_alpha"
        echo "    beta:  $dir_beta"
    fi

    ( cd "$repo" && "$SDD_SCRIPTS/task-brief" docs/alpha/plan.md 1 >/dev/null )
    ( cd "$repo" && "$SDD_SCRIPTS/task-brief" docs/beta/plan.md 1 >/dev/null )
    if grep -q "Alpha-only requirement text." "$dir_alpha/task-1-brief.md" 2>/dev/null \
        && grep -q "Beta-only requirement text." "$dir_beta/task-1-brief.md" 2>/dev/null; then
        pass "same-basename plans keep both task briefs intact"
    else
        fail "same-basename plans keep both task briefs intact"
        echo "    alpha brief: $(cat "$dir_alpha/task-1-brief.md" 2>/dev/null)"
        echo "    beta brief:  $(cat "$dir_beta/task-1-brief.md" 2>/dev/null)"
    fi

    # --- Legacy adoption: pre-existing workspace without a marker ---
    printf '# Foo\n\n## Task 1: Foo\n\nFoo.\n' > "$repo/foo.md"
    mkdir -p "$repo/.superpowers/sdd/foo"
    printf 'ledger\n' > "$repo/.superpowers/sdd/foo/progress.md"
    local dir_foo
    dir_foo="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" foo.md)"
    if [[ "$dir_foo" == "$repo/.superpowers/sdd/foo" \
        && -f "$dir_foo/progress.md" \
        && "$(cat "$dir_foo/plan-path" 2>/dev/null)" == "foo.md" ]]; then
        pass "legacy markerless workspace is adopted in place and marked"
    else
        fail "legacy markerless workspace is adopted in place and marked"
        echo "    dir: $dir_foo"
        echo "    marker: $(cat "$dir_foo/plan-path" 2>/dev/null)"
    fi

    # --- Ownership conflict: marker names a different plan ---
    printf '# Bar\n\n## Task 1: Bar\n\nBar.\n' > "$repo/bar.md"
    mkdir -p "$repo/.superpowers/sdd/bar"
    printf 'somewhere-else/bar.md\n' > "$repo/.superpowers/sdd/bar/plan-path"
    printf 'other ledger\n' > "$repo/.superpowers/sdd/bar/progress.md"
    local dir_bar
    dir_bar="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" bar.md)"
    if [[ "$dir_bar" == "$repo/.superpowers/sdd/bar-repo" \
        && "$(cat "$dir_bar/plan-path" 2>/dev/null)" == "bar.md" ]]; then
        pass "owned workspace disambiguates with parent-dir suffix"
    else
        fail "owned workspace disambiguates with parent-dir suffix"
        echo "    got: $dir_bar"
    fi
    if [[ "$(cat "$repo/.superpowers/sdd/bar/plan-path")" == "somewhere-else/bar.md" \
        && "$(cat "$repo/.superpowers/sdd/bar/progress.md")" == "other ledger" ]]; then
        pass "conflicting plan leaves the original workspace untouched"
    else
        fail "conflicting plan leaves the original workspace untouched"
    fi

    # --- Counter fallback: parent-suffixed workspace is owned too ---
    printf '# Baz\n\n## Task 1: Baz\n\nBaz.\n' > "$repo/baz.md"
    mkdir -p "$repo/.superpowers/sdd/baz" "$repo/.superpowers/sdd/baz-repo"
    printf 'one/baz.md\n' > "$repo/.superpowers/sdd/baz/plan-path"
    printf 'two/baz.md\n' > "$repo/.superpowers/sdd/baz-repo/plan-path"
    local dir_baz
    dir_baz="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" baz.md)"
    if [[ "$dir_baz" == "$repo/.superpowers/sdd/baz-repo-2" \
        && "$(cat "$dir_baz/plan-path" 2>/dev/null)" == "baz.md" ]]; then
        pass "double conflict falls back to a counter suffix"
    else
        fail "double conflict falls back to a counter suffix"
        echo "    got: $dir_baz"
    fi

    # --- Same plan spelled differently resolves to one workspace ---
    local dir_rel dir_abs dir_dotdot
    dir_rel="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" docs/alpha/plan.md)"
    dir_abs="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" "$repo/docs/alpha/plan.md")"
    dir_dotdot="$(cd "$repo/docs/beta" && "$SDD_SCRIPTS/sdd-workspace" ../alpha/plan.md)"
    if [[ "$dir_rel" == "$dir_abs" && "$dir_rel" == "$dir_dotdot" \
        && "$(cat "$dir_rel/plan-path" 2>/dev/null)" == "docs/alpha/plan.md" ]]; then
        pass "relative, absolute, and ../ spellings share one workspace and marker"
    else
        fail "relative, absolute, and ../ spellings share one workspace and marker"
        echo "    rel:    $dir_rel"
        echo "    abs:    $dir_abs"
        echo "    dotdot: $dir_dotdot"
        echo "    marker: $(cat "$dir_rel/plan-path" 2>/dev/null)"
    fi

    # --- Out-of-repo plans keep working, marker holds the absolute path ---
    mkdir -p "$TEST_ROOT/outside"
    printf '# Remote\n\n## Task 1: Remote\n\nRemote.\n' > "$TEST_ROOT/outside/remote-plan.md"
    local outside_abs dir_out
    outside_abs="$(cd "$TEST_ROOT/outside" && pwd -P)/remote-plan.md"
    dir_out="$(cd "$repo" && "$SDD_SCRIPTS/sdd-workspace" "$TEST_ROOT/outside/remote-plan.md")"
    if [[ "$dir_out" == "$repo/.superpowers/sdd/remote-plan" \
        && "$(cat "$dir_out/plan-path" 2>/dev/null)" == "$outside_abs" ]]; then
        pass "out-of-repo plan gets a basename slug and an absolute-path marker"
    else
        fail "out-of-repo plan gets a basename slug and an absolute-path marker"
        echo "    dir:    $dir_out"
        echo "    marker: $(cat "$dir_out/plan-path" 2>/dev/null)"
    fi

    echo ""
    if [[ "$FAILURES" -ne 0 ]]; then
        echo "FAILED: $FAILURES assertion(s)."
        exit 1
    fi
    echo "PASS"
}

main "$@"
