#!/usr/bin/env bash
# Tests for VCS config reading in session-start hook
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOOK="$(cd "$SCRIPT_DIR/../../hooks" && pwd)/session-start"
FAILURES=0

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }

echo "=== Session-start VCS config tests ==="

# --- Test 1: Default VCS is git when no config file ---
echo "Test 1: Default VCS is git when no config exists"
TMPDIR_T=$(mktemp -d)
HOME_ORIG="$HOME"
export HOME="$TMPDIR_T"
output=$(bash "$HOOK" 2>&1) || true
if echo "$output" | grep -q 'VCS: git'; then
    pass "default is git"
else
    fail "default is git — got: $(echo "$output" | grep 'VCS:' || echo 'no VCS line')"
fi
export HOME="$HOME_ORIG"
rm -rf "$TMPDIR_T"

# --- Test 2: VCS reads jj from config ---
echo "Test 2: VCS reads jj from config"
TMPDIR_T=$(mktemp -d)
mkdir -p "$TMPDIR_T/.config/superpowers"
echo '{"vcs": "jj"}' > "$TMPDIR_T/.config/superpowers/config.json"
export HOME="$TMPDIR_T"
output=$(bash "$HOOK" 2>&1) || true
if echo "$output" | grep -q 'VCS: jj'; then
    pass "reads jj from config"
else
    fail "reads jj from config — got: $(echo "$output" | grep 'VCS:' || echo 'no VCS line')"
fi
export HOME="$HOME_ORIG"
rm -rf "$TMPDIR_T"

# --- Test 3: VCS reads git from config ---
echo "Test 3: VCS reads explicit git from config"
TMPDIR_T=$(mktemp -d)
mkdir -p "$TMPDIR_T/.config/superpowers"
echo '{"vcs": "git"}' > "$TMPDIR_T/.config/superpowers/config.json"
export HOME="$TMPDIR_T"
output=$(bash "$HOOK" 2>&1) || true
if echo "$output" | grep -q 'VCS: git'; then
    pass "reads git from config"
else
    fail "reads git from config — got: $(echo "$output" | grep 'VCS:' || echo 'no VCS line')"
fi
export HOME="$HOME_ORIG"
rm -rf "$TMPDIR_T"

# --- Test 4: Invalid VCS value falls back to git ---
echo "Test 4: Invalid VCS value falls back to git"
TMPDIR_T=$(mktemp -d)
mkdir -p "$TMPDIR_T/.config/superpowers"
echo '{"vcs": "svn"}' > "$TMPDIR_T/.config/superpowers/config.json"
export HOME="$TMPDIR_T"
output=$(bash "$HOOK" 2>&1) || true
if echo "$output" | grep -q 'VCS: git'; then
    pass "invalid value falls back to git"
else
    fail "invalid value falls back to git — got: $(echo "$output" | grep 'VCS:' || echo 'no VCS line')"
fi
if echo "$output" | grep -q 'important-reminder.*Unsupported VCS'; then
    pass "invalid value emits visible warning"
else
    fail "invalid value emits visible warning — no important-reminder found"
fi
export HOME="$HOME_ORIG"
rm -rf "$TMPDIR_T"

# --- Test 5: Missing vcs key falls back to git ---
echo "Test 5: Config exists but no vcs key"
TMPDIR_T=$(mktemp -d)
mkdir -p "$TMPDIR_T/.config/superpowers"
echo '{"other": "value"}' > "$TMPDIR_T/.config/superpowers/config.json"
export HOME="$TMPDIR_T"
output=$(bash "$HOOK" 2>&1) || true
if echo "$output" | grep -q 'VCS: git'; then
    pass "missing key falls back to git"
else
    fail "missing key falls back to git — got: $(echo "$output" | grep 'VCS:' || echo 'no VCS line')"
fi
export HOME="$HOME_ORIG"
rm -rf "$TMPDIR_T"

echo ""
if [ "$FAILURES" -eq 0 ]; then
    echo "All tests passed."
    exit 0
else
    echo "$FAILURES test(s) failed."
    exit 1
fi
