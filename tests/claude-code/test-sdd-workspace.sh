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

# Push a path through the same `cd ... && pwd` normalization that
# sdd-workspace's own printed output goes through, so both sides of a
# string comparison are guaranteed to be spelled identically. On Windows
# Git Bash/MSYS, `git rev-parse --show-toplevel` (Windows-style,
# C:/Users/...) and `cd ... && pwd` (MSYS-style, /c/Users/...) can print
# different spellings of the identical physical directory; on Linux/macOS
# this is a no-op since the two already agree (module the resolved-symlink
# /var -> /private/var case handled by the mktemp comment above).
physical_path() { (cd "$1" && pwd); }

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
    repo="$(physical_path "$repo")"

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

    # --- range guards: BASE must be an ancestor of HEAD, range must be non-empty ---
    local divergent
    divergent="$(cd "$repo" && git "${git_id[@]}" commit-tree 'HEAD~1^{tree}' -p 'HEAD~1' -m divergent)"
    rc=0
    local guard_err
    guard_err="$(cd "$repo" && "$SDD_SCRIPTS/review-package" plan-a.md "$divergent" HEAD 2>&1 >/dev/null)" || rc=$?
    if [[ "$rc" -eq 3 && "$guard_err" == *"not a descendant"* ]]; then
        pass "review-package rejects a BASE that is not an ancestor of HEAD with exit 3"
    else
        fail "review-package rejects a BASE that is not an ancestor of HEAD with exit 3"
        echo "    exit: $rc"
        echo "    stderr: $guard_err"
    fi

    rc=0
    guard_err="$(cd "$repo" && "$SDD_SCRIPTS/review-package" plan-a.md HEAD HEAD 2>&1 >/dev/null)" || rc=$?
    if [[ "$rc" -eq 3 && "$guard_err" == *"empty commit range"* ]]; then
        pass "review-package rejects an empty BASE..HEAD range with exit 3"
    else
        fail "review-package rejects an empty BASE..HEAD range with exit 3"
        echo "    exit: $rc"
        echo "    stderr: $guard_err"
    fi

    # --- Worktree isolation: a linked worktree resolves its own workspace ---
    local wt="$TEST_ROOT/wt"
    ( cd "$repo" && git worktree add -q "$wt" -b wt-feature )
    local wt_root wt_dir
    wt_root="$(cd "$wt" && git rev-parse --show-toplevel)"
    wt_root="$(physical_path "$wt_root")"
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

    # --- helpers survive a mode-stripping extractor dropping exec bits (#2040) ---
    local stripped="$TEST_ROOT/stripped-scripts"
    mkdir -p "$stripped"
    cp "$SDD_SCRIPTS/sdd-workspace" "$SDD_SCRIPTS/task-brief" "$SDD_SCRIPTS/review-package" "$stripped/"
    chmod -x "$stripped"/*
    local noexec_out noexec_rc=0
    noexec_out="$(cd "$repo" && bash "$stripped/task-brief" plan-b.md 1 2>&1)" || noexec_rc=$?
    if [[ "$noexec_rc" -eq 0 && -f "$repo/.superpowers/sdd/plan-b/task-1-brief.md" ]]; then
        pass "task-brief works with no exec bit on sdd-workspace"
    else
        fail "task-brief works with no exec bit on sdd-workspace"
        echo "    rc: $noexec_rc"
        echo "    output: $noexec_out"
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

    # --- A repo's own committed .superpowers/sdd/.gitignore is left alone ---
    git init -q -b main "$TEST_ROOT/own-ignore"
    local own own_ignore
    own="$(cd "$TEST_ROOT/own-ignore" && git rev-parse --show-toplevel)"
    own_ignore=$'*\n!.gitignore\n!*/\n!*/progress.md'
    mkdir -p "$own/.superpowers/sdd"
    printf '%s\n' "$own_ignore" > "$own/.superpowers/sdd/.gitignore"
    printf '# Plan\n\n## Task 1: One\n\nOne.\n' > "$own/plan.md"
    (cd "$own" && git add -A && git -c user.name=t -c user.email=t@t commit -qm init)
    (cd "$own" && "$SDD_SCRIPTS/sdd-workspace" plan.md >/dev/null)
    if [[ "$(cat "$own/.superpowers/sdd/.gitignore")" == "$own_ignore" \
        && -z "$(cd "$own" && git status --porcelain -- .superpowers/sdd/.gitignore)" ]]; then
        pass "an existing .superpowers/sdd/.gitignore is not overwritten"
    else
        fail "an existing .superpowers/sdd/.gitignore is not overwritten"
        echo "    now: $(cat "$own/.superpowers/sdd/.gitignore")"
    fi

    # --- An unwritable workspace fails fast with a message, never spins ---
    # The slug loop runs in a `while ! owns ...` condition where `set -e` is
    # suspended, so a failure of owns() beyond "another plan owns it" used to
    # retry forever. A regular file squatting on the workspace parent is the
    # deterministic trigger; timeout distinguishes "spins" from "fails".
    git init -q -b main "$TEST_ROOT/spin"
    local spin spin_rc=0
    spin="$(cd "$TEST_ROOT/spin" && git rev-parse --show-toplevel)"
    printf '# P\n\n## Task 1: One\n\nOne.\n' > "$spin/spin-plan.md"
    mkdir -p "$spin/.superpowers/sdd"
    printf 'blocker\n' > "$spin/.superpowers/sdd/spin-plan"
    timeout 10 bash -c 'cd "$1" && "$2" spin-plan.md >/dev/null 2>&1' \
        _ "$spin" "$SDD_SCRIPTS/sdd-workspace" || spin_rc=$?
    if [[ "$spin_rc" -ne 0 && "$spin_rc" -ne 124 ]]; then
        pass "unwritable workspace: non-zero exit, no timeout (fails instead of spinning)"
    else
        fail "unwritable workspace: non-zero exit, no timeout (fails instead of spinning)"
        echo "    exit: $spin_rc (124 = killed by timeout = spin)"
    fi

    # --- A full counter range stops with a message, not forever ---
    git init -q -b main "$TEST_ROOT/capped"
    local capped rc_capped=0
    capped="$(cd "$TEST_ROOT/capped" && git rev-parse --show-toplevel)"
    printf '# P\n\n## Task 1: One\n\nOne.\n' > "$capped/plan.md"
    for slot in plan plan-capped; do
        mkdir -p "$capped/.superpowers/sdd/$slot"
        printf 'other/plan.md\n' > "$capped/.superpowers/sdd/$slot/plan-path"
    done
    for i in $(seq 2 33); do
        mkdir -p "$capped/.superpowers/sdd/plan-capped-$i"
        printf 'other/plan.md\n' > "$capped/.superpowers/sdd/plan-capped-$i/plan-path"
    done
    timeout 10 bash -c 'cd "$1" && "$2" plan.md >/dev/null 2>&1' \
        _ "$capped" "$SDD_SCRIPTS/sdd-workspace" || rc_capped=$?
    if [[ "$rc_capped" -ne 0 && "$rc_capped" -ne 124 ]]; then
        pass "33 occupied slots: gives up with non-zero exit (bounded search)"
    else
        fail "33 occupied slots: gives up with non-zero exit (bounded search)"
        echo "    exit: $rc_capped"
    fi

    # --- A lost marker race is classified, never treated as unusable ---
    # Two controllers can reach the same fresh slug. A wins `mkdir`; B sees
    # the directory, takes the existing-directory branch, and wins the
    # noclobber marker write. A's own write then fails, and A must classify
    # via the winner's marker — skip the slot if another plan owns it, adopt
    # it if it holds the same plan — instead of exiting 2 as "unusable".
    # The PATH shim below makes that interleaving deterministic: it creates
    # the directory and writes the winner's marker before owns() writes its
    # own.
    git init -q -b main "$TEST_ROOT/race"
    local race race_bin race_dir race_rc own_race own_race_dir own_race_rc
    race="$(physical_path "$(cd "$TEST_ROOT/race" && git rev-parse --show-toplevel)")"
    printf '# P\n\n## Task 1: One\n\nOne.\n' > "$race/race-plan.md"
    race_bin="$TEST_ROOT/race-bin"
    mkdir -p "$race_bin"
    cat > "$race_bin/mkdir" <<'SH'
#!/usr/bin/env bash
command -p mkdir "$@" || exit $?
if [[ $# -eq 1 && "$1" == "${INJECT_DIR:-}" ]]; then
    printf '%s\n' "${INJECT_PLAN:-other/plan.md}" > "$1/plan-path"
    if [[ -n "${INJECT_SENTINEL:-}" ]]; then : > "$INJECT_SENTINEL"; fi
fi
SH
    chmod +x "$race_bin/mkdir"

    race_rc=0
    race_dir="$(cd "$race" && PATH="$race_bin:$PATH" \
        INJECT_DIR="$race/.superpowers/sdd/race-plan" \
        "$SDD_SCRIPTS/sdd-workspace" race-plan.md 2>/dev/null)" || race_rc=$?
    if [[ "$race_rc" -eq 0 && "$race_dir" == "$race/.superpowers/sdd/race-plan-race" \
        && "$(cat "$race_dir/plan-path" 2>/dev/null)" == "race-plan.md" ]]; then
        pass "lost marker race to another plan: skips the slot instead of failing"
    else
        fail "lost marker race to another plan: skips the slot instead of failing"
        echo "    exit:   $race_rc"
        echo "    dir:    $race_dir"
        echo "    marker: $(cat "$race_dir/plan-path" 2>/dev/null)"
    fi

    git init -q -b main "$TEST_ROOT/race-own"
    own_race_rc=0
    own_race="$(physical_path "$(cd "$TEST_ROOT/race-own" && git rev-parse --show-toplevel)")"
    printf '# P\n\n## Task 1: One\n\nOne.\n' > "$own_race/race-own-plan.md"
    own_race_dir="$(cd "$own_race" && PATH="$race_bin:$PATH" \
        INJECT_DIR="$own_race/.superpowers/sdd/race-own-plan" \
        INJECT_PLAN="race-own-plan.md" \
        INJECT_SENTINEL="$TEST_ROOT/race-own-injected" \
        "$SDD_SCRIPTS/sdd-workspace" race-own-plan.md 2>/dev/null)" || own_race_rc=$?
    # The injected marker alone cannot prove the race happened: without it the
    # fresh-directory path produces the same directory and marker, so the case
    # would pass while never reaching claim_marker's lost-write branch. The
    # sentinel the shim drops is the proof that the interleaving occurred.
    if [[ "$own_race_rc" -eq 0 && "$own_race_dir" == "$own_race/.superpowers/sdd/race-own-plan" \
        && -e "$TEST_ROOT/race-own-injected" \
        && "$(cat "$own_race_dir/plan-path" 2>/dev/null)" == "race-own-plan.md" ]]; then
        pass "lost marker race to the same plan: adopts the workspace"
    else
        fail "lost marker race to the same plan: adopts the workspace"
        echo "    exit:     $own_race_rc"
        echo "    dir:      $own_race_dir"
        echo "    injected: $([[ -e "$TEST_ROOT/race-own-injected" ]] && echo yes || echo no)"
        echo "    marker:   $(cat "$own_race_dir/plan-path" 2>/dev/null)"
    fi

    # --- A read inside the winner's open-before-write gap retries ---
    # The noclobber winner creates plan-path and writes the line as two
    # steps, so a loser reading in between sees an empty file. Treating that
    # as another plan's marker splits one plan across two slots; the reader
    # must retry briefly instead. The cat shim below answers the first read
    # with nothing and the retry with the real file.
    git init -q -b main "$TEST_ROOT/race-empty"
    local race_empty race_empty_dir race_empty_rc
    race_empty="$(physical_path "$(cd "$TEST_ROOT/race-empty" && git rev-parse --show-toplevel)")"
    printf '# P\n\n## Task 1: One\n\nOne.\n' > "$race_empty/race-empty-plan.md"
    mkdir -p "$race_empty/.superpowers/sdd/race-empty-plan"
    printf 'race-empty-plan.md\n' > "$race_empty/.superpowers/sdd/race-empty-plan/plan-path"
    cat > "$race_bin/cat" <<'SH'
#!/usr/bin/env bash
if [[ -n "${EMPTY_ONCE_STAMP:-}" && ! -e "$EMPTY_ONCE_STAMP" ]]; then
    : > "$EMPTY_ONCE_STAMP"
    exit 0
fi
command -p cat "$@"
SH
    chmod +x "$race_bin/cat"
    race_empty_rc=0
    race_empty_dir="$(cd "$race_empty" && PATH="$race_bin:$PATH" \
        EMPTY_ONCE_STAMP="$TEST_ROOT/race-empty-stamp" \
        "$SDD_SCRIPTS/sdd-workspace" race-empty-plan.md 2>/dev/null)" || race_empty_rc=$?
    if [[ "$race_empty_rc" -eq 0 && "$race_empty_dir" == "$race_empty/.superpowers/sdd/race-empty-plan" \
        && -e "$TEST_ROOT/race-empty-stamp" \
        && "$(cat "$race_empty_dir/plan-path" 2>/dev/null)" == "race-empty-plan.md" ]]; then
        pass "empty marker read from the write gap: retries and adopts"
    else
        fail "empty marker read from the write gap: retries and adopts"
        echo "    exit:     $race_empty_rc"
        echo "    dir:      $race_empty_dir"
        echo "    injected: $([[ -e "$TEST_ROOT/race-empty-stamp" ]] && echo yes || echo no)"
        echo "    marker:   $(cat "$race_empty_dir/plan-path" 2>/dev/null)"
    fi

    echo ""
    if [[ "$FAILURES" -ne 0 ]]; then
        echo "FAILED: $FAILURES assertion(s)."
        exit 1
    fi
    echo "PASS"
}

main "$@"
