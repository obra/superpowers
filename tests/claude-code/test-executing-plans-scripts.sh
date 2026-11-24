#!/usr/bin/env bash
# Tests for executing-plans' bookkeeping helpers: scripts/task-start extracts
# the brief and records BASE in one call; scripts/task-done runs the task's
# test command, records the result in the ledger, and refuses to record a
# failing task.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
EP_SCRIPTS="$REPO_ROOT/skills/executing-plans/scripts"

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
    echo "=== Test: executing-plans scripts ==="

    TEST_ROOT="$(mktemp -d)"
    trap cleanup EXIT

    git init -q -b main "$TEST_ROOT/repo"
    local repo
    repo="$(cd "$TEST_ROOT/repo" && git rev-parse --show-toplevel)"
    # Same spelling as the scripts print: C:/... from cygpath -m on Windows,
    # plain pwd elsewhere.
    repo="$(cd "$repo" && if command -v cygpath >/dev/null 2>&1; then cygpath -m "$PWD"; else pwd; fi)"
    local git_id=(-c user.email=t@example.com -c user.name=t -c commit.gpgsign=false)

    cat > "$repo/plan.md" <<'PLAN'
# Plan

## Task 1: First thing

Do the first thing.

## Task 2: Second thing

Do the second thing.
PLAN
    ( cd "$repo" && git add plan.md && git "${git_id[@]}" commit -qm fixture )
    local base
    base="$(cd "$repo" && git rev-parse HEAD)"

    # --- task-start: argument validation ---
    local rc=0
    (cd "$repo" && "$EP_SCRIPTS/task-start" plan.md >/dev/null 2>&1) || rc=$?
    if [[ "$rc" -eq 2 ]]; then
        pass "task-start without a task number errors with exit 2"
    else
        fail "task-start without a task number errors with exit 2 (got $rc)"
    fi

    # --- task-start: brief path + BASE in one call ---
    local out
    out="$(cd "$repo" && "$EP_SCRIPTS/task-start" plan.md 1)"
    if [[ "$out" == *"brief: $repo/.superpowers/sdd/plan/task-1-brief.md"* ]]; then
        pass "task-start prints the brief path under the plan's workspace"
    else
        fail "task-start prints the brief path under the plan's workspace"
        echo "    got: $out"
    fi
    if [[ "$out" == *"base: $base"* ]]; then
        pass "task-start prints BASE as the current HEAD"
    else
        fail "task-start prints BASE as the current HEAD"
        echo "    got: $out"
    fi
    if [[ -s "$repo/.superpowers/sdd/plan/task-1-brief.md" ]]; then
        pass "task-start writes the brief file"
    else
        fail "task-start writes the brief file"
    fi

    # --- task-done: records a passing task ---
    ( cd "$repo" && echo x > work.txt && git add work.txt && git "${git_id[@]}" commit -qm "task 1" )
    local head
    head="$(cd "$repo" && git rev-parse HEAD)"
    out="$(cd "$repo" && "$EP_SCRIPTS/task-done" plan.md 1 "$base" -- sh -c 'echo "Ran 3 tests"; echo OK')"
    rc=$?
    local ledger="$repo/.superpowers/sdd/plan/progress.md"
    local expected="Task 1: complete (commits ${base:0:7}..${head:0:7}, tests: sh -c 'echo \"Ran 3 tests\"; echo OK' → exit 0, log: task-1-tests.log)"
    if [[ -f "$ledger" ]] && grep -qF "$expected" "$ledger"; then
        pass "task-done appends the completion line with commit range and test result"
    else
        fail "task-done appends the completion line with commit range and test result"
        echo "    expected: $expected"
        echo "    ledger:"; sed 's/^/      /' "$ledger" 2>/dev/null || echo "      (missing)"
    fi
    if [[ "$out" == *"OK"* ]]; then
        pass "task-done prints the tail of the test output"
    else
        fail "task-done prints the tail of the test output"
        echo "    got: $out"
    fi
    if [[ -s "$repo/.superpowers/sdd/plan/task-1-tests.log" ]]; then
        pass "task-done keeps the full test output in the workspace"
    else
        fail "task-done keeps the full test output in the workspace"
    fi

    # --- task-done: refuses to record a failing task ---
    rc=0
    out="$(cd "$repo" && "$EP_SCRIPTS/task-done" plan.md 2 "$head" -- sh -c 'echo "FAILED (errors=1)"; exit 1' 2>&1)" || rc=$?
    if [[ "$rc" -ne 0 ]]; then
        pass "task-done exits non-zero when the test command fails"
    else
        fail "task-done exits non-zero when the test command fails"
    fi
    if ! grep -q "Task 2: complete" "$ledger"; then
        pass "task-done does not record a failing task as complete"
    else
        fail "task-done does not record a failing task as complete"
    fi
    if [[ "$out" == *"FAILED"* ]]; then
        pass "task-done shows the failing output"
    else
        fail "task-done shows the failing output"
        echo "    got: $out"
    fi

    # --- task-done: records a passing task whose test command prints nothing ---
    # https://github.com/obra/superpowers/issues/2385 -- under `set -euo
    # pipefail`, the ledger's `grep -v '^[[:space:]]*$' log | tail -n 1`
    # exits 1 on an empty/blank log, which used to abort the whole script
    # (silently, no ledger line) even though the test command itself passed.
    ( cd "$repo" && echo y > work2.txt && git add work2.txt && git "${git_id[@]}" commit -qm "task 2" )
    local head2
    head2="$(cd "$repo" && git rev-parse HEAD)"
    local silent_err="$TEST_ROOT/silent-task2.err"
    rc=0
    out="$(cd "$repo" && "$EP_SCRIPTS/task-done" plan.md 2 "$head" -- true 2>"$silent_err")" || rc=$?
    if [[ "$rc" -eq 0 ]]; then
        pass "task-done exits 0 when a passing test command prints nothing"
    else
        fail "task-done exits 0 when a passing test command prints nothing (got rc=$rc)"
        echo "    got: $out"
        cat "$silent_err" 2>/dev/null || true
    fi
    local expected2="Task 2: complete (commits ${head:0:7}..${head2:0:7}, tests: true → exit 0 (no output), log: task-2-tests.log)"
    if [[ -f "$ledger" ]] && grep -qF "$expected2" "$ledger"; then
        pass "task-done records a passing task that printed no output"
    else
        fail "task-done records a passing task that printed no output"
        echo "    expected: $expected2"
        echo "    ledger:"; sed 's/^/      /' "$ledger" 2>/dev/null || echo "      (missing)"
    fi
    if [[ -s "$silent_err" ]] && grep -qi "no output" "$silent_err"; then
        pass "task-done warns on stderr when a passing test command prints nothing"
    else
        fail "task-done warns on stderr when a passing test command prints nothing"
        echo "    stderr:"; sed 's/^/      /' "$silent_err" 2>/dev/null || echo "      (empty)"
    fi

    # --- task-done: rejects nonexistent task ID (#2342), removed task with stale brief, preserves passing log on failed re-run, and handles missing trailing newline ---
    local ledger_before ran_77="$TEST_ROOT/ran-77"
    ledger_before="$(cat "$ledger")"
    rc=0
    (cd "$repo" && "$EP_SCRIPTS/task-done" plan.md 77 "$base" -- sh -c 'touch "$1"; echo ok' _ "$ran_77" >/dev/null 2>&1) || rc=$?
    if [[ "$rc" -eq 2 && "$(cat "$ledger")" == "$ledger_before" && ! -e "$repo/.superpowers/sdd/plan/task-77-tests.log" && ! -e "$ran_77" ]]; then
        pass "task-done rejects nonexistent task ID with exit 2 and writes nothing"
    else
        fail "task-done rejects nonexistent task ID with exit 2 and writes nothing (rc=$rc)"
    fi

    # Leftover cached brief for a task removed from a still-existing plan is rejected
    printf '## Task 5: Removed\n\nOld.\n' > "$repo/.superpowers/sdd/plan/task-5-brief.md"
    rc=0
    (cd "$repo" && "$EP_SCRIPTS/task-done" plan.md 5 "$base" -- true >/dev/null 2>&1) || rc=$?
    if [[ "$rc" -eq 2 && "$(cat "$ledger")" == "$ledger_before" ]]; then
        pass "task-done rejects removed task ID even when stale cached brief exists"
    else
        fail "task-done rejects removed task ID even when stale cached brief exists (rc=$rc)"
    fi

    # Failed re-run of an already-recorded task preserves passing task-1-tests.log and saves failed output in task-1-tests.failed.log
    local rerun_err=""
    rc=0
    rerun_err="$(cd "$repo" && "$EP_SCRIPTS/task-done" plan.md 1 "$base" -- sh -c 'echo "RERUN_FAIL"; exit 1' 2>&1 >/dev/null)" || rc=$?
    if [[ "$rc" -ne 0 ]] && grep -q "Ran 3 tests" "$repo/.superpowers/sdd/plan/task-1-tests.log" \
        && ! grep -q "RERUN_FAIL" "$repo/.superpowers/sdd/plan/task-1-tests.log" \
        && grep -q "RERUN_FAIL" "$repo/.superpowers/sdd/plan/task-1-tests.failed.log" \
        && [[ "$rerun_err" == *"task-1-tests.failed.log"* ]]; then
        pass "failed re-run preserves passing task-1-tests.log and writes RERUN_FAIL to task-1-tests.failed.log"
    else
        fail "failed re-run log handling failed"
    fi

    # Terminated test command preserves partial output in .failed.log, keeps passing log intact, and works with nonexistent TMPDIR
    rm -f "$repo/.superpowers/sdd/plan/task-1-tests.failed.log"
    local term_rc=0
    (cd "$repo" && TMPDIR="$TEST_ROOT/nonexistent-tmpdir" "$EP_SCRIPTS/task-done" plan.md 1 "$base" -- bash -c 'echo "HUNG_SUITE_PARTIAL"; kill -TERM $$' >/dev/null 2>&1) || term_rc=$?
    if [[ "$term_rc" -ne 0 ]] \
        && grep -q "HUNG_SUITE_PARTIAL" "$repo/.superpowers/sdd/plan/task-1-tests.failed.log" \
        && grep -q "Ran 3 tests" "$repo/.superpowers/sdd/plan/task-1-tests.log"; then
        pass "terminated test command saves partial output in .failed.log, preserves passing log, and validates without TMPDIR"
    else
        fail "terminated test command log preservation failed (rc=$term_rc)"
    fi

    # Subdirectory invocation writes canonical repo-relative header so subsequent sdd-workspace calls keep the same workspace
    git init -q -b main "$TEST_ROOT/subdir-hdr-repo"
    local sub_repo
    sub_repo="$(cd "$TEST_ROOT/subdir-hdr-repo" && git rev-parse --show-toplevel)"
    sub_repo="$(cd "$sub_repo" && if command -v cygpath >/dev/null 2>&1; then cygpath -m "$PWD"; else pwd; fi)"
    mkdir -p "$sub_repo/docs/current"
    cp "$repo/plan.md" "$sub_repo/docs/current/plan.md"
    ( cd "$sub_repo" && git add docs/current/plan.md && git "${git_id[@]}" commit -qm init )
    local sub_base sub_ws1 sub_ws2
    sub_base="$(cd "$sub_repo" && git rev-parse HEAD)"
    ( cd "$sub_repo/docs/current" && echo s > s.txt && git add s.txt && git "${git_id[@]}" commit -qm "sub task 1" )
    ( cd "$sub_repo/docs/current" && "$EP_SCRIPTS/task-done" plan.md 1 "$sub_base" -- echo sub-ok >/dev/null )
    sub_ws1="$(cd "$sub_repo/docs/current" && "$REPO_ROOT/skills/subagent-driven-development/scripts/sdd-workspace" plan.md)"
    sub_ws2="$(cd "$sub_repo" && "$REPO_ROOT/skills/subagent-driven-development/scripts/sdd-workspace" docs/current/plan.md)"
    if [[ "$sub_ws1" == "$sub_ws2" && "$(head -n 1 "$sub_ws1/progress.md")" == "# SDD ledger — plan: docs/current/plan.md" ]]; then
        pass "task-done from subdirectory records canonical repo-relative ledger header"
    else
        fail "task-done from subdirectory wrote non-canonical header: $(head -n 1 "$sub_ws1/progress.md" 2>/dev/null)"
    fi

    # Pre-existing ledger without trailing newline still records completion on its own line
    git init -q -b main "$TEST_ROOT/nonewline-repo"
    local nl_repo
    nl_repo="$(cd "$TEST_ROOT/nonewline-repo" && git rev-parse --show-toplevel)"
    nl_repo="$(cd "$nl_repo" && if command -v cygpath >/dev/null 2>&1; then cygpath -m "$PWD"; else pwd; fi)"
    cp "$repo/plan.md" "$nl_repo/plan.md"
    ( cd "$nl_repo" && git add plan.md && git "${git_id[@]}" commit -qm init )
    local nl_base nl_ws
    nl_base="$(cd "$nl_repo" && git rev-parse HEAD)"
    nl_ws="$(cd "$nl_repo" && "$REPO_ROOT/skills/subagent-driven-development/scripts/sdd-workspace" plan.md)"
    printf '# SDD ledger — plan: plan.md' > "$nl_ws/progress.md"
    ( cd "$nl_repo" && echo nl > nl.txt && git add nl.txt && git "${git_id[@]}" commit -qm "nl task 1" )
    ( cd "$nl_repo" && "$EP_SCRIPTS/task-done" plan.md 1 "$nl_base" -- echo ok >/dev/null )
    if grep -q '^Task 1: complete ' "$nl_ws/progress.md"; then
        pass "task-done terminates unterminated ledger line before appending Task 1: complete"
    else
        fail "task-done glued completion line onto unterminated header"
        sed 's/^/    /' "$nl_ws/progress.md"
    fi

    # --- task-done: rejects non-commit BASE (e.g. tree SHA) ---
    ledger_before="$(cat "$ledger")"
    rc=0
    (cd "$repo" && "$EP_SCRIPTS/task-done" plan.md 1 "HEAD^{tree}" -- true >/dev/null 2>&1) || rc=$?
    if [[ "$rc" -eq 2 && "$(cat "$ledger")" == "$ledger_before" ]]; then
        pass "task-done rejects HEAD^{tree} as BASE with exit 2"
    else
        fail "task-done rejects HEAD^{tree} as BASE with exit 2 (rc=$rc)"
    fi

    # --- stripped execute bits (#2642): bash invocation survives chmod -x ---
    local stripped="$TEST_ROOT/stripped"
    mkdir -p "$stripped/executing-plans/scripts" "$stripped/subagent-driven-development/scripts"
    cp "$EP_SCRIPTS"/* "$stripped/executing-plans/scripts/"
    cp "$REPO_ROOT/skills/subagent-driven-development/scripts"/* "$stripped/subagent-driven-development/scripts/"
    chmod -x "$stripped/executing-plans/scripts"/* "$stripped/subagent-driven-development/scripts"/*

    git init -q -b main "$TEST_ROOT/noexec-repo"
    local noexec_repo
    noexec_repo="$(cd "$TEST_ROOT/noexec-repo" && git rev-parse --show-toplevel)"
    noexec_repo="$(cd "$noexec_repo" && if command -v cygpath >/dev/null 2>&1; then cygpath -m "$PWD"; else pwd; fi)"
    cp "$repo/plan.md" "$noexec_repo/plan.md"
    ( cd "$noexec_repo" && git add plan.md && git "${git_id[@]}" commit -qm fixture )
    local noexec_base
    noexec_base="$(cd "$noexec_repo" && git rev-parse HEAD)"

    local noexec_start_out="" noexec_start_rc=0
    noexec_start_out="$(cd "$noexec_repo" && bash "$stripped/executing-plans/scripts/task-start" plan.md 1 2>&1)" || noexec_start_rc=$?
    if [[ "$noexec_start_rc" -eq 0 && -s "$noexec_repo/.superpowers/sdd/plan/task-1-brief.md" && "$noexec_start_out" == *"base: $noexec_base"* ]]; then
        pass "bash task-start succeeds when all scripts have execute bits stripped"
    else
        fail "bash task-start succeeds when all scripts have execute bits stripped (rc=$noexec_start_rc)"
        echo "    out: $noexec_start_out"
    fi

    ( cd "$noexec_repo" && echo z > work.txt && git add work.txt && git "${git_id[@]}" commit -qm "task 1" )
    local noexec_head
    noexec_head="$(cd "$noexec_repo" && git rev-parse HEAD)"
    local noexec_done_out="" noexec_done_rc=0
    noexec_done_out="$(cd "$noexec_repo" && bash "$stripped/executing-plans/scripts/task-done" plan.md 1 "$noexec_base" -- echo noexec-ok 2>&1)" || noexec_done_rc=$?
    local noexec_ledger="$noexec_repo/.superpowers/sdd/plan/progress.md"
    local noexec_expected="Task 1: complete (commits ${noexec_base:0:7}..${noexec_head:0:7}, tests: echo noexec-ok → exit 0, log: task-1-tests.log)"
    if [[ "$noexec_done_rc" -eq 0 && -f "$noexec_ledger" ]] && grep -qF "$noexec_expected" "$noexec_ledger"; then
        pass "bash task-done succeeds when all scripts have execute bits stripped"
    else
        fail "bash task-done succeeds when all scripts have execute bits stripped (rc=$noexec_done_rc)"
        echo "    out: $noexec_done_out"
        echo "    ledger:"; sed 's/^/      /' "$noexec_ledger" 2>/dev/null || echo "      (missing)"
    fi

    # --- deleted plan resilience (#2630): task-done succeeds for cached task, rejects uncached task ---
    git init -q -b main "$TEST_ROOT/deleted-repo"
    local del_repo
    del_repo="$(cd "$TEST_ROOT/deleted-repo" && git rev-parse --show-toplevel)"
    del_repo="$(cd "$del_repo" && if command -v cygpath >/dev/null 2>&1; then cygpath -m "$PWD"; else pwd; fi)"
    mkdir -p "$del_repo/docs/plans"
    cp "$repo/plan.md" "$del_repo/docs/plans/gone.md"
    ( cd "$del_repo" && git add docs/plans/gone.md && git "${git_id[@]}" commit -qm "add plan" )
    local del_base del_head del_rc=0
    del_base="$(cd "$del_repo" && git rev-parse HEAD)"
    ( cd "$del_repo" && "$EP_SCRIPTS/task-start" docs/plans/gone.md 1 >/dev/null )
    ( cd "$del_repo" && git rm -q docs/plans/gone.md && git "${git_id[@]}" commit -qm "delete plan" )
    del_head="$(cd "$del_repo" && git rev-parse HEAD)"
    ( cd "$del_repo" && "$EP_SCRIPTS/task-done" docs/plans/gone.md 1 "$del_base" -- echo gone-ok >/dev/null 2>&1 ) || del_rc=$?
    local del_ledger="$del_repo/.superpowers/sdd/gone/progress.md"
    local del_expected="Task 1: complete (commits ${del_base:0:7}..${del_head:0:7}, tests: echo gone-ok → exit 0, log: task-1-tests.log)"
    if [[ "$del_rc" -eq 0 && -f "$del_ledger" ]] && grep -qF "$del_expected" "$del_ledger"; then
        pass "task-done succeeds after plan is deleted when task-start cached brief (#2630)"
    else
        fail "task-done succeeds after plan is deleted when task-start cached brief (#2630) (rc=$del_rc)"
        echo "    ledger:"; sed 's/^/      /' "$del_ledger" 2>/dev/null || echo "      (missing)"
    fi
    local del_uncached_rc=0
    ( cd "$del_repo" && "$EP_SCRIPTS/task-done" docs/plans/gone.md 2 "$del_base" -- echo never >/dev/null 2>&1 ) || del_uncached_rc=$?
    if [[ "$del_uncached_rc" -eq 2 ]] && ! grep -q "Task 2: complete" "$del_ledger"; then
        pass "task-done exits 2 on deleted plan when requested task was never cached"
    else
        fail "task-done exits 2 on deleted plan when requested task was never cached (rc=$del_uncached_rc)"
    fi

    # --- .gitattributes enforces LF on skills/*/scripts/* ---
    local attr_out
    attr_out="$(git -C "$REPO_ROOT" check-attr eol skills/subagent-driven-development/scripts/task-brief skills/executing-plans/scripts/task-done)"
    if [[ "$attr_out" == *"skills/subagent-driven-development/scripts/task-brief: eol: lf"* \
       && "$attr_out" == *"skills/executing-plans/scripts/task-done: eol: lf"* ]]; then
        pass ".gitattributes enforces eol: lf on skills/*/scripts/*"
    else
        fail ".gitattributes enforces eol: lf on skills/*/scripts/*"
        echo "    got: $attr_out"
    fi

    # --- no usable repository: every helper stops with one message (#2242, #2429) ---
    # The same message for a new project and for a caller standing in the
    # wrong directory (such as the plugin's skill directory, where git init
    # is the wrong fix), so "init and commit" is only the new-project case.
    git init -q -b main "$TEST_ROOT/unborn"
    cp "$repo/plan.md" "$TEST_ROOT/unborn/plan.md"
    mkdir -p "$TEST_ROOT/no-repo"
    cp "$repo/plan.md" "$TEST_ROOT/no-repo/plan.md"
    # git's own first error line follows the shared message, so the reason
    # git refused is never hidden.
    local where msg said
    for where in unborn no-repo; do
        msg="SDD scripts must run from inside the git working tree you're executing in, with at least one commit (current directory: $TEST_ROOT/$where). If this is a new project, run 'git init' and make a first commit, then rerun."
        said="git said: fatal: "
        [[ "$where" == no-repo ]] && said="git said: fatal: not a git repository"
        rc=0
        out="$(cd "$TEST_ROOT/$where" && "$EP_SCRIPTS/task-start" plan.md 1 2>&1)" || rc=$?
        if [[ "$rc" -eq 2 && "$out" == "$msg"$'\n'"$said"* ]]; then
            pass "task-start in a $where directory exits 2 with the shared message"
        else
            fail "task-start in a $where directory exits 2 with the shared message"
            echo "    exit: $rc"
            echo "    got: $out"
        fi
        rc=0
        out="$(cd "$TEST_ROOT/$where" && "$EP_SCRIPTS/task-done" plan.md 1 HEAD -- true 2>&1)" || rc=$?
        if [[ "$rc" -eq 2 && "$out" == "$msg"$'\n'"$said"* ]]; then
            pass "task-done in a $where directory exits 2 with the shared message"
        else
            fail "task-done in a $where directory exits 2 with the shared message"
            echo "    exit: $rc"
            echo "    got: $out"
        fi
    done
    if [[ ! -e "$TEST_ROOT/unborn/.superpowers" && ! -e "$TEST_ROOT/no-repo/.superpowers" ]]; then
        pass "nothing is written without a usable repository"
    else
        fail "nothing is written without a usable repository"
    fi

    # --- outside any repository, a plan in a repository is not a fallback (#2429) ---
    # Like git, the scripts act on the current directory's working tree; an
    # absolute plan path into some repository does not pick that one instead.
    msg="SDD scripts must run from inside the git working tree you're executing in, with at least one commit (current directory: $TEST_ROOT/no-repo). If this is a new project, run 'git init' and make a first commit, then rerun."
    local before head_now
    head_now="$(cd "$repo" && git rev-parse HEAD)"
    before="$(find "$repo/.superpowers" | sort; cat "$repo/.superpowers/sdd/plan/progress.md")"
    rc=0
    out="$(cd "$TEST_ROOT/no-repo" && "$EP_SCRIPTS/task-start" "$repo/plan.md" 2 2>&1)" || rc=$?
    if [[ "$rc" -eq 2 && "$out" == "$msg"$'\n'"git said: fatal: not a git repository"* ]]; then
        pass "task-start outside any repository stops with the shared message despite a plan in a repository"
    else
        fail "task-start outside any repository stops with the shared message despite a plan in a repository"
        echo "    exit: $rc"
        echo "    got: $out"
    fi
    rc=0
    out="$(cd "$TEST_ROOT/no-repo" && "$EP_SCRIPTS/task-done" "$repo/plan.md" 2 "$head_now" -- true 2>&1)" || rc=$?
    if [[ "$rc" -eq 2 && "$out" == "$msg"$'\n'"git said: fatal: not a git repository"* ]]; then
        pass "task-done outside any repository stops with the shared message despite a plan in a repository"
    else
        fail "task-done outside any repository stops with the shared message despite a plan in a repository"
        echo "    exit: $rc"
        echo "    got: $out"
    fi
    if [[ "$(find "$repo/.superpowers" | sort; cat "$repo/.superpowers/sdd/plan/progress.md")" == "$before" && ! -e "$TEST_ROOT/no-repo/.superpowers" ]]; then
        pass "outside any repository, task-start and task-done write nothing to the plan's repository"
    else
        fail "outside any repository, task-start and task-done write nothing to the plan's repository"
    fi

    echo
    if [[ "$FAILURES" -eq 0 ]]; then
        echo "PASS"
    else
        echo "FAIL ($FAILURES)"
        exit 1
    fi
}

main "$@"
