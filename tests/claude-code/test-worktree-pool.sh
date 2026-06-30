#!/usr/bin/env bash
# Tests for scripts/worktree-pool: a persistent pool of recyclable git
# worktrees. Verifies provisioning, leasing, releasing, recycling (a released
# slot keeps its warm build artifacts), the SDD_POOL_MAX cap, gc of stale
# leases, bad-input handling, and that the lease lock is atomic under
# concurrent leases.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
POOL="$REPO_ROOT/skills/subagent-driven-development/scripts/worktree-pool"

FAILURES=0
TEST_ROOT=""

pass() { echo "  [PASS] $1"; }
fail() {
    echo "  [FAIL] $1"
    [ $# -gt 1 ] && echo "    $2"
    FAILURES=$((FAILURES + 1))
}

cleanup() {
    # The pool's worktrees live under $TEST_ROOT/repo/.worktrees, so deleting
    # the whole temp tree removes the repo and all its worktrees together —
    # nothing survives to hold a stale worktree registration.
    if [[ -n "$TEST_ROOT" && -d "$TEST_ROOT" ]]; then
        rm -rf "$TEST_ROOT"
    fi
}

# Run the pool script in the test repo. Captures stdout; returns the script's
# exit code without tripping set -e.
pool() {
    ( cd "$REPO" && "$POOL" "$@" )
}

slot_dirs() { find "$REPO/.worktrees/pool" -maxdepth 1 -type d -name 'slot-*' 2>/dev/null | sort; }

main() {
    echo "=== Test: worktree-pool ==="

    [ -x "$POOL" ] || { echo "FATAL: $POOL not executable"; exit 1; }

    TEST_ROOT="$(mktemp -d)"
    trap cleanup EXIT

    git init -q -b main "$TEST_ROOT/repo"
    REPO="$(cd "$TEST_ROOT/repo" && git rev-parse --show-toplevel)"
    local gid=(-c user.email=t@example.com -c user.name=t -c commit.gpgsign=false)
    ( cd "$REPO" \
        && printf '.worktrees/\n' > .gitignore \
        && git add .gitignore \
        && git "${gid[@]}" commit -qm init )
    local base
    base="$(cd "$REPO" && git rev-parse HEAD)"

    # --- provision -------------------------------------------------------
    pool provision 2 >/dev/null
    local n
    n="$(slot_dirs | wc -l | tr -d ' ')"
    [ "$n" = "2" ] && pass "provision 2 creates 2 slots" || fail "provision 2 creates 2 slots" "got $n"

    pool provision 2 >/dev/null
    n="$(slot_dirs | wc -l | tr -d ' ')"
    [ "$n" = "2" ] && pass "provision is idempotent (still 2)" || fail "provision is idempotent" "got $n"

    # status shows both free
    local st
    st="$(pool status)"
    if [ "$(printf '%s\n' "$st" | grep -c '^free')" = "2" ]; then
        pass "status lists 2 free slots"
    else
        fail "status lists 2 free slots" "$st"
    fi

    # --- lease -----------------------------------------------------------
    local sa
    sa="$(pool lease "$base" task-a)"
    if [[ "$sa" == "$REPO/.worktrees/pool/slot-"* && -d "$sa/.lease" ]]; then
        pass "lease returns a slot path and marks it leased"
    else
        fail "lease returns a slot path and marks it leased" "got $sa"
    fi

    # leased slot is on the requested branch at the requested base
    local br head
    br="$(git -C "$sa" rev-parse --abbrev-ref HEAD)"
    head="$(git -C "$sa" rev-parse HEAD)"
    if [ "$br" = "task-a" ] && [ "$head" = "$base" ]; then
        pass "leased slot is on the fresh branch at base"
    else
        fail "leased slot is on the fresh branch at base" "branch=$br head=$head base=$base"
    fi

    # status now shows one leased
    if [ "$(pool status | grep -c '^LEASED')" = "1" ]; then
        pass "status shows the slot LEASED"
    else
        fail "status shows the slot LEASED" "$(pool status)"
    fi

    # --- distinct slot for a second lease --------------------------------
    local sb
    sb="$(pool lease "$base" task-b)"
    [ "$sb" != "$sa" ] && pass "second lease gets a distinct slot" || fail "second lease gets a distinct slot" "both $sa"

    # --- cap exhaustion --------------------------------------------------
    local rc=0
    ( cd "$REPO" && SDD_POOL_MAX=2 "$POOL" lease "$base" task-c ) >/dev/null 2>&1 || rc=$?
    [ "$rc" = "3" ] && pass "lease exits 3 when pool exhausted at cap" || fail "lease exits 3 when pool exhausted at cap" "rc=$rc"

    # --- warm artifact survives release + recycle ------------------------
    printf 'compiled\n' > "$sa/WARM.bin"   # untracked build artifact
    pool release "$sa" >/dev/null
    # only one free slot now (sa), so the next lease must recycle it
    local sc
    sc="$(pool lease "$base" task-d)"
    if [ "$sc" = "$sa" ]; then
        pass "release frees the slot and the next lease recycles it"
    else
        fail "release frees the slot and the next lease recycles it" "released $sa got $sc"
    fi
    if [ -f "$sc/WARM.bin" ]; then
        pass "recycled slot keeps its warm build artifact (no clean)"
    else
        fail "recycled slot keeps its warm build artifact (no clean)"
    fi

    # --- release errors on a non-leased slot -----------------------------
    # sc (== sa) is currently leased; first release frees it, second must fail.
    pool release "$sc" >/dev/null 2>&1 || true
    rc=0
    pool release "$sc" >/dev/null 2>&1 || rc=$?
    [ "$rc" = "2" ] && pass "release of a free slot exits 2" || fail "release of a free slot exits 2" "rc=$rc"

    # --- gc clears a stale lease (age 0 with gc 0) -----------------------
    pool lease "$base" task-e >/dev/null   # leave one leased
    [ "$(pool status | grep -c '^LEASED')" -ge 1 ] || fail "setup: expected a leased slot before gc"
    pool gc 0 >/dev/null
    if [ "$(pool status | grep -c '^LEASED')" = "0" ]; then
        pass "gc 0 clears stale leases"
    else
        fail "gc 0 clears stale leases" "$(pool status)"
    fi

    # gc also clears a lease with no 'since' marker (t=0 path)
    local s1="$REPO/.worktrees/pool/slot-1"
    mkdir -p "$s1/.lease"   # simulate a crashed lease with no metadata
    pool gc 999999 >/dev/null
    [ ! -d "$s1/.lease" ] && pass "gc clears a lease missing its 'since' marker" || fail "gc clears a lease missing its 'since' marker"

    # --- bad base ref ----------------------------------------------------
    rc=0
    pool lease no-such-ref task-x >/dev/null 2>&1 || rc=$?
    [ "$rc" = "2" ] && pass "lease with bad base ref exits 2" || fail "lease with bad base ref exits 2" "rc=$rc"

    # --- no subcommand ---------------------------------------------------
    rc=0
    pool >/dev/null 2>&1 || rc=$?
    [ "$rc" = "2" ] && pass "no subcommand exits 2 (usage)" || fail "no subcommand exits 2" "rc=$rc"

    # --- atomic lock under concurrent leases -----------------------------
    # One free slot, cap 1: exactly one of two concurrent leases must win.
    pool gc 0 >/dev/null                       # free everything
    rm -rf "$REPO/.worktrees/pool"             # reset to a clean pool
    ( cd "$REPO" && git worktree prune )
    pool provision 1 "$base" >/dev/null
    local o1 o2 r1=0 r2=0
    o1="$TEST_ROOT/o1"; o2="$TEST_ROOT/o2"
    ( cd "$REPO" && SDD_POOL_MAX=1 "$POOL" lease "$base" race-1 ) >"$o1" 2>/dev/null &
    local p1=$!
    ( cd "$REPO" && SDD_POOL_MAX=1 "$POOL" lease "$base" race-2 ) >"$o2" 2>/dev/null &
    local p2=$!
    wait $p1 || r1=$?
    wait $p2 || r2=$?
    local wins=0
    [ "$r1" = "0" ] && wins=$((wins + 1))
    [ "$r2" = "0" ] && wins=$((wins + 1))
    if [ "$wins" = "1" ] && { [ "$r1" = "3" ] || [ "$r2" = "3" ]; }; then
        pass "concurrent leases: exactly one wins, the other exits 3 (atomic lock)"
    else
        fail "concurrent leases: exactly one wins, the other exits 3" "r1=$r1 r2=$r2 wins=$wins"
    fi

    echo ""
    if [[ "$FAILURES" -ne 0 ]]; then
        echo "FAILED: $FAILURES assertion(s)."
        exit 1
    fi
    echo "PASS"
}

main "$@"
