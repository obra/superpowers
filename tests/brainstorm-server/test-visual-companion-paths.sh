#!/usr/bin/env bash
# Regression check for #1134: visual companion script paths must be relative
# to the brainstorming skill directory, not the plugin root.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
GUIDE="$REPO_ROOT/skills/brainstorming/visual-companion.md"

failures=0

assert_contains() {
    local pattern="$1"
    local label="$2"

    if grep -Fq "$pattern" "$GUIDE"; then
        echo "  [PASS] $label"
    else
        echo "  [FAIL] $label"
        echo "    Expected to find: $pattern"
        failures=$((failures + 1))
    fi
}

assert_not_contains() {
    local pattern="$1"
    local label="$2"

    if grep -Fq "$pattern" "$GUIDE"; then
        echo "  [FAIL] $label"
        echo "    Did not expect to find: $pattern"
        failures=$((failures + 1))
    else
        echo "  [PASS] $label"
    fi
}

echo "=== Visual Companion Path Test ==="
echo ""

assert_contains 'SKILL_DIR=<directory containing this visual-companion.md file>' "Guide defines a skill-directory placeholder"
assert_contains '"$SKILL_DIR/scripts/start-server.sh" --project-dir /path/to/project' "Launch examples use skill-relative start-server path"
assert_contains '"$SKILL_DIR/scripts/start-server.sh" --project-dir /path/to/project --foreground' "Foreground launch example uses skill-relative start-server path"
assert_contains '"$SKILL_DIR/scripts/stop-server.sh" "$SESSION_DIR"' "Cleanup example uses skill-relative stop-server path"
assert_contains '`$SKILL_DIR/scripts/frame-template.html`' "Frame template reference is skill-relative"
assert_contains '`$SKILL_DIR/scripts/helper.js`' "Helper script reference is skill-relative"

assert_not_contains '${CLAUDE_PLUGIN_ROOT}' "Guide does not use Claude-specific plugin root"
assert_not_contains 'scripts/start-server.sh --project-dir /path/to/project' "Guide does not use bare start-server command examples"
assert_not_contains 'scripts/start-server.sh \' "Guide does not use bare multiline start-server command examples"
assert_not_contains 'scripts/stop-server.sh $SESSION_DIR' "Guide does not use bare stop-server command example"

echo ""

if [ "$failures" -gt 0 ]; then
    echo "STATUS: FAILED ($failures failures)"
    exit 1
fi

echo "STATUS: PASSED"
