#!/bin/bash
# Test script for polyglot hooks on macOS/Linux
# Run from the superpowers repo root: ./test-polyglot.sh

set -e

echo "=== Polyglot Hook Test Suite ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

pass() { echo -e "${GREEN}PASS${NC}: $1"; }
fail() { echo -e "${RED}FAIL${NC}: $1"; exit 1; }

# Get repo root
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_ROOT"

echo "Repo root: $REPO_ROOT"
echo ""

# Test 1: Check files exist
echo "--- Test 1: Required files exist ---"
[ -f hooks/session-start.cmd ] && pass "hooks/session-start.cmd exists" || fail "hooks/session-start.cmd missing"
[ -f hooks/session-start.sh ] && pass "hooks/session-start.sh exists" || fail "hooks/session-start.sh missing"
[ -f hooks/run-hook.cmd ] && pass "hooks/run-hook.cmd exists" || fail "hooks/run-hook.cmd missing"
echo ""

# Test 2: Check execute permissions
echo "--- Test 2: Execute permissions ---"
[ -x hooks/session-start.cmd ] && pass "session-start.cmd is executable" || fail "session-start.cmd not executable (run: chmod +x hooks/session-start.cmd)"
[ -x hooks/session-start.sh ] && pass "session-start.sh is executable" || fail "session-start.sh not executable"
[ -x hooks/run-hook.cmd ] && pass "run-hook.cmd is executable" || fail "run-hook.cmd not executable (run: chmod +x hooks/run-hook.cmd)"
echo ""

# Test 3: Simple polyglot wrapper (session-start.cmd)
echo "--- Test 3: Simple polyglot wrapper (session-start.cmd) ---"
export CLAUDE_PLUGIN_ROOT="$REPO_ROOT"
output=$(./hooks/session-start.cmd 2>&1)
if echo "$output" | grep -q '"hookEventName"'; then
    pass "session-start.cmd produces JSON with hookEventName"
else
    fail "session-start.cmd did not produce expected JSON output"
    echo "Output was: $output"
fi

if echo "$output" | grep -q '"SessionStart"'; then
    pass "session-start.cmd outputs SessionStart event"
else
    fail "session-start.cmd missing SessionStart in output"
fi

if echo "$output" | grep -q 'superpowers'; then
    pass "session-start.cmd includes superpowers content"
else
    fail "session-start.cmd missing superpowers content"
fi
echo ""

# Test 4: Parameterized wrapper (run-hook.cmd)
echo "--- Test 4: Parameterized wrapper (run-hook.cmd) ---"
output2=$(./hooks/run-hook.cmd session-start.sh 2>&1)
if echo "$output2" | grep -q '"hookEventName"'; then
    pass "run-hook.cmd session-start.sh produces JSON with hookEventName"
else
    fail "run-hook.cmd did not produce expected JSON output"
    echo "Output was: $output2"
fi
echo ""

# Test 5: Verify JSON is valid (if jq is available)
echo "--- Test 5: JSON validity ---"
if command -v jq &> /dev/null; then
    # Run fresh and pipe directly to jq to avoid variable escaping issues
    if ./hooks/session-start.cmd 2>&1 | jq . > /dev/null 2>&1; then
        pass "Output is valid JSON (verified with jq)"
    else
        fail "Output is not valid JSON"
        echo "Run manually to debug: CLAUDE_PLUGIN_ROOT=\$(pwd) ./hooks/session-start.cmd | jq ."
    fi
else
    echo "SKIP: jq not installed, cannot validate JSON"
fi
echo ""

# Test 6: Verify heredoc skips CMD block
echo "--- Test 6: Heredoc correctly skips CMD block ---"
# The output should NOT contain Windows-specific stuff like @echo or cygpath errors
if echo "$output" | grep -qi "cygpath"; then
    fail "Output contains 'cygpath' - CMD block may be leaking"
elif echo "$output" | grep -qi "@echo"; then
    fail "Output contains '@echo' - CMD block may be leaking"
else
    pass "No CMD block content in output"
fi
echo ""

echo "=== All tests passed! ==="
echo ""
echo "The polyglot wrappers work correctly on this Unix system."
echo "You can now merge the windows-hook-support branch."
