#!/usr/bin/env bash
# Tests for plan directories: task-brief assembles the header and one task
# file; sdd-workspace names the workspace after the directory; plan-boundary
# flags a name the next plan consumes that the code does not have, checks the
# later plans' attributed names too, and reports clean once the plan is fixed.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SDD="$REPO_ROOT/skills/subagent-driven-development/scripts"
EP="$REPO_ROOT/skills/executing-plans/scripts"
FAILURES=0; TEST_ROOT=""
pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
cleanup() { if [[ -n "$TEST_ROOT" && -d "$TEST_ROOT" ]]; then rm -r -- "$TEST_ROOT"; fi; }
main() {
    echo "=== Test: plan directories ==="
    TEST_ROOT="$(mktemp -d)"; trap cleanup EXIT
    git init -q -b main "$TEST_ROOT/repo"; local repo; repo="$(cd "$TEST_ROOT/repo" && git rev-parse --show-toplevel)"
    local git_id=(-c user.email=t@example.com -c user.name=t -c commit.gpgsign=false)
    mkdir -p "$repo/plans/1-engine" "$repo/plans/2-terminal" "$repo/plans/3-effects" "$repo/pkg"
    cat > "$repo/plans/1-engine/00-header.md" <<'MD'
# Engine Plan
**Goal:** the engine.
## Plan Set
1. `plans/1-engine` — engine. Consumes nothing.
2. `plans/2-terminal` — terminal. Consumes from plan 1: `NewGame`, `Advance`.
3. `plans/3-effects` — effects. Consumes from plan 1: `Advance`; from plan 2: `Canvas`.
MD
    cat > "$repo/plans/1-engine/01-core.md" <<'MD'
### Task 1: Core
**Interfaces:**
- Consumes: nothing.
- Produces: `NewGame() *Game`, `(g *Game) Advance(dt)`.
- [ ] **Step 1:** write it.
MD
    for d in 2-terminal 3-effects; do cp "$repo/plans/1-engine/00-header.md" "$repo/plans/$d/00-header.md"; done
    cat > "$repo/plans/2-terminal/01-app.md" <<'MD'
### Task 1: App
**Interfaces:**
- Consumes: `NewGame`, `Advance` (plan 1).
- Produces: `Canvas`.
MD
    cat > "$repo/plans/3-effects/01-fx.md" <<'MD'
### Task 1: FX
**Interfaces:**
- Consumes: `Advance` (plan 1), `Canvas` (plan 2).
- Produces: `World`.
MD
    # the engine as built calls it Tick, not Advance
    printf 'package pkg\ntype Game struct{}\nfunc NewGame() *Game { return &Game{} }\nfunc (g *Game) Tick(dt int) {}\n' > "$repo/pkg/game.go"
    (cd "$repo" && git add -A && git "${git_id[@]}" commit -q -m "engine")

    local out
    out="$(cd "$repo" && "$SDD/task-brief" plans/2-terminal 1 "$TEST_ROOT/brief.md")"
    if grep -q '^# Engine Plan' "$TEST_ROOT/brief.md" && grep -q '^### Task 1: App' "$TEST_ROOT/brief.md" && ! grep -q 'Task 1: FX' "$TEST_ROOT/brief.md"; then
        pass "task-brief on a directory writes the header plus the one task file"
    else fail "task-brief on a directory writes the header plus the one task file: $out"; fi

    out="$(cd "$repo" && "$SDD/sdd-workspace" plans/2-terminal)"
    if [[ "$out" == */.superpowers/sdd/2-terminal ]]; then pass "sdd-workspace names the workspace after the plan directory"; else fail "sdd-workspace names the workspace after the plan directory: $out"; fi

    local rc=0
    out="$(cd "$repo" && "$EP/plan-boundary" plans/2-terminal 2>&1)" || rc=$?
    if [[ "$rc" -eq 1 && "$out" == *"missing in code: Advance  (consumed by 2-terminal)"* ]]; then
        pass "plan-boundary flags a consumed name the code does not have"
    else fail "plan-boundary flags a consumed name the code does not have (rc=$rc): $out"; fi
    if [[ "$out" == *"missing in code: Advance  (consumed by 3-effects (from plans before 2-terminal))"* && "$out" != *"Canvas"* ]]; then
        pass "plan-boundary checks later plans' names from completed plans only"
    else fail "plan-boundary checks later plans' names from completed plans only: $out"; fi
    if [[ "$out" != *"NewGame"* ]]; then pass "plan-boundary accepts a consumed name the code has"; else fail "plan-boundary accepts a consumed name the code has"; fi

    (cd "$repo" && perl -pi -e 's/Advance/Tick/g' plans/*/00-header.md plans/2-terminal/01-app.md plans/3-effects/01-fx.md)
    rc=0; out="$(cd "$repo" && "$EP/plan-boundary" plans/2-terminal 2>&1)" || rc=$?
    if [[ "$rc" -eq 0 && "$out" == boundary:\ clean* ]]; then pass "plan-boundary reports clean once the plans match the code"; else fail "plan-boundary reports clean once the plans match the code (rc=$rc): $out"; fi

    echo
    if [[ "$FAILURES" -eq 0 ]]; then echo "PASS"; else echo "FAIL ($FAILURES)"; exit 1; fi
}
main "$@"
