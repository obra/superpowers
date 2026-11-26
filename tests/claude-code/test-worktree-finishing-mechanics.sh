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
FINISHING_SKILL="$REPO_ROOT/skills/finishing-a-development-branch/SKILL.md"

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
        !in_code && /^[ \t]*```bash[ \t]*$/ { in_code = 1; next }
        in_code && /^[ \t]*```[ \t]*$/ { exit }
        in_code { print }
    ' "$file"
}

# True if OUTPUT has LINE as one of its lines.
has_line() {
    local output="$1"
    local line="$2"
    [[ $'\n'"$output"$'\n' == *$'\n'"$line"$'\n'* ]]
}

# Commit what is staged in DIR, allowing an empty commit.
fixture_commit() {
    local dir="$1"
    local message="$2"
    git -C "$dir" -c user.name=Test -c user.email=test@example.com \
        -c commit.gpgsign=false commit -q --allow-empty -m "$message"
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
    # A global excludes file may list .worktrees/; this repository must not.
    git -C "$repo" config core.excludesFile /dev/null
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

# Run the Step 1a base check in WORKTREE, with <START_HEAD> replaced by START.
base_check_output() {
    local check="$1"
    local worktree="$2"
    local start="$3"
    (cd "$worktree" && bash -c "${check//"<START_HEAD>"/$start}")
}

# #2245: a native tool may create the worktree from origin's default branch.
# The Step 1a check, run in the new worktree, tells apart the four states the
# skill's bullets act on. <START_HEAD> and <START_BRANCH> are the values the
# Step 0 snippet printed in the checkout the work started from.
base_check_states() {
    local step0 check seed origin user a b c step0_out start_a start_b branch out
    step0="$(skill_fence "$USING_SKILL" '## Step 0: Detect Existing Isolation')"
    check="$(skill_fence "$USING_SKILL" '**Verify the base commit before Step 2.**')"
    if [[ -z "$check" ]]; then
        fail "no bash fence after \"Verify the base commit before Step 2.\""
        return
    fi

    # A is the common parent. origin/main moves on to C, and the user's main
    # gains B, an unpushed commit such as a plan.
    seed="$CASE_DIR/seed"
    origin="$CASE_DIR/origin.git"
    user="$CASE_DIR/user"
    git init -q -b main "$seed"
    fixture_commit "$seed" A
    a="$(git -C "$seed" rev-parse HEAD)"
    git clone -q --bare "$seed" "$origin"
    git clone -q "$origin" "$user"
    step0_out="$(cd "$user" && bash -c "$step0")"
    start_a="$(printf '%s\n' "$step0_out" | sed -n 's/^START_HEAD=//p')"
    branch="$(printf '%s\n' "$step0_out" | sed -n 's/^BRANCH=//p')"
    fixture_commit "$seed" C
    git -C "$seed" push -q "$origin" main
    git -C "$user" fetch -q origin
    c="$(git -C "$user" rev-parse origin/main)"
    fixture_commit "$user" B
    b="$(git -C "$user" rev-parse HEAD)"
    step0_out="$(cd "$user" && bash -c "$step0")"
    start_b="$(printf '%s\n' "$step0_out" | sed -n 's/^START_HEAD=//p')"
    if [[ "$start_a" == "$a" && "$start_b" == "$b" && "$branch" == "main" ]]; then
        pass "Step 0 prints the starting commit as START_HEAD and the branch as BRANCH"
    else
        fail "Step 0 prints the starting commit as START_HEAD and the branch as BRANCH"
        echo "    got START_HEAD '$start_a' then '$start_b', BRANCH '$branch'"
        return
    fi

    # Each worktree stands in for one that a native tool created.
    git -C "$user" worktree add -q -b at "$CASE_DIR/wt-at" "$a"
    git -C "$user" worktree add -q -b behind "$CASE_DIR/wt-behind" "$a"
    git -C "$user" worktree add -q -b ahead "$CASE_DIR/wt-ahead" "$c"
    git -C "$user" worktree add -q -b diverged "$CASE_DIR/wt-diverged" "$c"

    out="$(base_check_output "$check" "$CASE_DIR/wt-at" "$start_a")"
    if has_line "$out" start-ahead && has_line "$out" worktree-ahead; then
        pass "at the start commit: prints both start-ahead and worktree-ahead"
    else
        fail "at the start commit: prints both start-ahead and worktree-ahead"
        echo "    got: $out"
    fi

    out="$(base_check_output "$check" "$CASE_DIR/wt-behind" "$start_b")"
    if has_line "$out" start-ahead && ! has_line "$out" worktree-ahead; then
        pass "behind the start commit: prints start-ahead only"
    else
        fail "behind the start commit: prints start-ahead only"
        echo "    got: $out"
    fi
    if git -C "$CASE_DIR/wt-behind" merge -q --ff-only "$start_b" &&
        [[ "$(git -C "$CASE_DIR/wt-behind" rev-parse HEAD)" == "$b" ]]; then
        pass "behind the start commit: git merge --ff-only <START_HEAD> brings it to the start commit"
    else
        fail "behind the start commit: git merge --ff-only <START_HEAD> brings it to the start commit"
    fi

    out="$(base_check_output "$check" "$CASE_DIR/wt-ahead" "$start_a")"
    if ! has_line "$out" start-ahead && has_line "$out" worktree-ahead &&
        [[ "${out##*$'\n'}" == "origin/$branch" ]]; then
        pass "ahead of the start commit: prints worktree-ahead only, and origin/<START_BRANCH> last"
    else
        fail "ahead of the start commit: prints worktree-ahead only, and origin/<START_BRANCH> last"
        echo "    got: $out"
    fi

    out="$(base_check_output "$check" "$CASE_DIR/wt-diverged" "$start_b")"
    if ! has_line "$out" start-ahead && ! has_line "$out" worktree-ahead; then
        pass "diverged from the start commit: prints neither marker"
    else
        fail "diverged from the start commit: prints neither marker"
        echo "    got: $out"
    fi
}

# In zsh, `path` is tied to PATH, so a snippet that assigns `path` leaves git
# and every other command unfound in the agent's shell. Run the creation
# snippet under zsh, then git in the same shell.
creation_snippet_keeps_path_under_zsh() {
    local create repo out rc
    if ! command -v zsh >/dev/null 2>&1; then
        echo "  [SKIP] zsh is not installed"
        return
    fi
    create="$(skill_fence "$USING_SKILL" '#### Create the Worktree')"
    if [[ -z "$create" ]]; then
        fail "no bash fence under Create the Worktree"
        return
    fi

    repo="$CASE_DIR/repo"
    git init -q -b main "$repo"
    fixture_commit "$repo" initial
    rc=0
    out="$(cd "$repo" && LOCATION=.worktrees BRANCH_NAME=feature \
        zsh -f -c "$create"$'\n''git --version' 2>&1)" || rc=$?
    if [[ "$rc" -eq 0 && "$out" == *"git version"* && -d "$repo/.worktrees/feature" ]]; then
        pass "the snippet creates the worktree, and git still runs after it"
    else
        fail "the snippet creates the worktree, and git still runs after it (exit $rc)"
        echo "    got: $out"
    fi
}

# The two Step 2 listings in finishing-a-development-branch, by the line that
# leads into each: untracked and changed files, then ignored files.
UNTRACKED_LISTING='If `GIT_DIR != GIT_COMMON`, list files that exist only in this worktree:'
IGNORED_LISTING='That listing leaves out ignored files'
# What the skill leaves out of the ignored listing: Superpowers' own
# bookkeeping files, and dependency and build caches, each shown as one entry.
IGNORED_LEFT_OUT='^\.superpowers/sdd/\.gitignore$|^\.superpowers/brainstorm/\.last-(port|token)$|(^|/)(node_modules|\.venv|target|dist|build|__pycache__)/$'
# The section whose first bash fence is the plain `git worktree remove` block.
CLEANUP_HEADING='## Step 6: Cleanup Workspace'

# Make REPO with one commit whose .gitignore holds IGNORES, and a linked
# worktree for branch feat at REPO/.worktrees/feat.
finishing_fixture() {
    local repo="$1"
    local ignores="$2"
    git init -q -b main "$repo"
    # A global excludes file must not change what this repository ignores.
    git -C "$repo" config core.excludesFile /dev/null
    printf '%s' "$ignores" >"$repo/.gitignore"
    git -C "$repo" add .gitignore
    fixture_commit "$repo" initial
    git -C "$repo" worktree add -q -b feat "$repo/.worktrees/feat"
}

# Run both Step 2 listings in the worktree WT and print the files they name,
# one per line, read the way the skill says: every path the first listing
# prints; from the ignored listing, each `!!` entry outside .superpowers/ and
# each path its second command prints, less IGNORED_LEFT_OUT.
step2_listed_files() {
    local wt="$1"
    local untracked ignored
    untracked="$(skill_fence "$FINISHING_SKILL" "$UNTRACKED_LISTING")"
    ignored="$(skill_fence "$FINISHING_SKILL" "$IGNORED_LISTING")"
    (cd "$wt" && bash -c "$untracked") | sed -n 's/^.. //p'
    (cd "$wt" && bash -c "$ignored") | awk '
        /^!! \.superpowers\// { next }
        /^!! / { print substr($0, 4); next }
        /^\.superpowers\// { print }
    ' | { grep -v -E "$IGNORED_LEFT_OUT" || true; }
}

# Pass for each PATH that is a line of LISTED, fail for each that is not.
# LABEL names the fixture.
check_listed() {
    local label="$1"
    local listed="$2"
    local path
    shift 2
    for path in "$@"; do
        if has_line "$listed" "$path"; then
            pass "$label: lists $path"
        else
            fail "$label: lists $path"
            echo "    got: $(printf '%s' "$listed" | tr '\n' ' ')"
        fi
    done
}

# Pass for each NAME that no line of LISTED contains, fail for each that one
# does. LABEL names the fixture.
check_left_out() {
    local label="$1"
    local listed="$2"
    local name
    shift 2
    for name in "$@"; do
        if [[ "$listed" != *"$name"* ]]; then
            pass "$label: leaves out $name"
        else
            fail "$label: leaves out $name"
            echo "    got: $(printf '%s' "$listed" | tr '\n' ' ')"
        fi
    done
}

# Put in the worktree WT: untracked NOTES.md and build/out.txt, ignored
# .env.local and node_modules/x, a plan workspace, and the .gitignore that
# sdd-workspace writes beside it.
add_step2_files() {
    local wt="$1"
    mkdir -p "$wt/node_modules" "$wt/build" "$wt/.superpowers/sdd/plan-a"
    printf 'notes\n' >"$wt/NOTES.md"
    printf 'SECRET=1\n' >"$wt/.env.local"
    printf 'dependency\n' >"$wt/node_modules/x"
    printf 'output\n' >"$wt/build/out.txt"
    printf '# SDD ledger\n' >"$wt/.superpowers/sdd/plan-a/progress.md"
    printf '*\n' >"$wt/.superpowers/sdd/.gitignore"
}

# #2207: `git status` without --ignored does not show ignored files, which
# also exist only in the worktree. Together the two Step 2 listings name each
# file the human partner has to decide about, including an unfinished plan's
# workspace, and leave out caches and Superpowers' own bookkeeping. A root
# .gitignore that ignores .superpowers/ makes `git status` show it as one
# entry; the second command names the files inside it. A user's
# status.showUntrackedFiles=no must not stop the ignored listing.
listing_shows_ignored_and_untracked() {
    local marker repo wt listed label
    for marker in "$UNTRACKED_LISTING" "$IGNORED_LISTING"; do
        if [[ -z "$(skill_fence "$FINISHING_SKILL" "$marker")" ]]; then
            fail "no bash fence after \"$marker\""
        fi
    done

    label="sdd workspace ignores itself"
    repo="$CASE_DIR/sdd-ignores-itself"
    finishing_fixture "$repo" $'.env.local\nnode_modules/\n.worktrees/\n'
    wt="$repo/.worktrees/feat"
    add_step2_files "$wt"
    if ! listed="$(step2_listed_files "$wt")"; then
        fail "$label: the Step 2 listings run"
        return
    fi
    check_listed "$label" "$listed" \
        NOTES.md .env.local build/out.txt .superpowers/sdd/plan-a/progress.md
    check_left_out "$label" "$listed" node_modules .superpowers/sdd/.gitignore

    label=".superpowers/ ignored at the root"
    repo="$CASE_DIR/superpowers-ignored-at-root"
    finishing_fixture "$repo" $'.env.local\nnode_modules/\n.worktrees/\n.superpowers/\n'
    wt="$repo/.worktrees/feat"
    add_step2_files "$wt"
    mkdir -p "$wt/.superpowers/brainstorm/1-2/content"
    printf '52341\n' >"$wt/.superpowers/brainstorm/.last-port"
    printf 'token\n' >"$wt/.superpowers/brainstorm/.last-token"
    printf '<p>mockup</p>\n' >"$wt/.superpowers/brainstorm/1-2/content/mockup.html"
    if ! listed="$(step2_listed_files "$wt")"; then
        fail "$label: the Step 2 listings run"
        return
    fi
    check_listed "$label" "$listed" \
        NOTES.md .env.local build/out.txt .superpowers/sdd/plan-a/progress.md \
        .superpowers/brainstorm/1-2/content/mockup.html
    check_left_out "$label" "$listed" node_modules .superpowers/sdd/.gitignore \
        .superpowers/brainstorm/.last-port .superpowers/brainstorm/.last-token

    label="status.showUntrackedFiles=no"
    repo="$CASE_DIR/untracked-files-hidden"
    finishing_fixture "$repo" $'.env.local\nnode_modules/\n.worktrees/\n'
    git -C "$repo" config status.showUntrackedFiles no
    wt="$repo/.worktrees/feat"
    add_step2_files "$wt"
    if ! listed="$(step2_listed_files "$wt")"; then
        fail "$label: the Step 2 listings run"
        return
    fi
    check_listed "$label" "$listed" \
        NOTES.md .env.local build/out.txt .superpowers/sdd/plan-a/progress.md
    check_left_out "$label" "$listed" node_modules .superpowers/sdd/.gitignore
}

# #2207: once the human partner's choice has dealt with the untracked files,
# an ignored .env.local can remain. The listings still name it, and plain
# `git worktree remove` deletes it without refusing, which is why Step 6
# removes the worktree only once the listings name nothing. The removal is
# asserted so that a change in git's behavior is noticed.
removal_waits_for_ignored_files() {
    local remove repo wt listed out rc
    remove="$(skill_fence "$FINISHING_SKILL" "$CLEANUP_HEADING")"
    if [[ -z "$remove" ]]; then
        fail "no bash fence under $CLEANUP_HEADING"
        return
    fi

    repo="$CASE_DIR/repo"
    finishing_fixture "$repo" $'.env.local\n.worktrees/\n'
    wt="$repo/.worktrees/feat"
    printf 'notes\n' >"$wt/NOTES.md"
    printf 'SECRET=1\n' >"$wt/.env.local"
    git -C "$wt" add NOTES.md
    fixture_commit "$wt" "add notes"
    if ! listed="$(step2_listed_files "$wt")"; then
        fail "the Step 2 listings run"
        return
    fi
    if has_line "$listed" .env.local && ! has_line "$listed" NOTES.md; then
        pass "with NOTES.md committed, the listings still name .env.local"
    else
        fail "with NOTES.md committed, the listings still name .env.local"
        echo "    got: $(printf '%s' "$listed" | tr '\n' ' ')"
    fi

    # -e stops the block at its first failing command, so its exit status is
    # that of git worktree remove.
    rc=0
    out="$(cd "$repo" && WORKTREE_PATH="$wt" bash -e -c "$remove" 2>&1)" || rc=$?
    if [[ "$rc" -eq 0 && -z "$out" && ! -e "$wt/.env.local" ]]; then
        pass "plain git worktree remove exits 0 and deletes the ignored .env.local"
    else
        fail "plain git worktree remove exits 0 and deletes the ignored .env.local (exit $rc)"
        echo "    got: $out"
    fi
}

# Plain `git worktree remove` refuses while an untracked file is present, with
# the message Step 6 quotes, and leaves the file in place.
removal_refuses_untracked() {
    local remove repo wt out rc
    remove="$(skill_fence "$FINISHING_SKILL" "$CLEANUP_HEADING")"
    if [[ -z "$remove" ]]; then
        fail "no bash fence under $CLEANUP_HEADING"
        return
    fi

    repo="$CASE_DIR/repo"
    finishing_fixture "$repo" $'.worktrees/\n'
    wt="$repo/.worktrees/feat"
    printf 'notes\n' >"$wt/NOTES.md"
    rc=0
    out="$(cd "$repo" && WORKTREE_PATH="$wt" bash -e -c "$remove" 2>&1)" || rc=$?
    if [[ "$rc" -ne 0 && "$out" == *"contains modified or untracked files"* &&
        -f "$wt/NOTES.md" ]]; then
        pass "plain git worktree remove refuses, and NOTES.md remains"
    else
        fail "plain git worktree remove refuses, and NOTES.md remains (exit $rc)"
        echo "    got: $out"
    fi
}

echo "=== Test: worktree and finishing mechanics ==="

run_case ignore_check_uses_selected_dir
run_case base_check_states
run_case creation_snippet_keeps_path_under_zsh
run_case listing_shows_ignored_and_untracked
run_case removal_waits_for_ignored_files
run_case removal_refuses_untracked

echo ""
if [[ "$FAILURES" -gt 0 ]]; then
    echo "STATUS: FAILED ($FAILURES failures)"
    exit 1
fi
echo "STATUS: PASSED"
