#!/usr/bin/env bash
# Test: idempotency, content preservation, and uninstall
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/setup.sh"
trap cleanup_test_env EXIT

echo "=== Test: Idempotency ==="

"$REPO_ROOT/scripts/install-junie.sh"
"$REPO_ROOT/scripts/install-junie.sh"

begin_count=$(grep -cF "<!-- BEGIN SUPERPOWERS -->" "$JUNIE_HOME/AGENTS.md")
end_count=$(grep -cF "<!-- END SUPERPOWERS -->" "$JUNIE_HOME/AGENTS.md")

if [ "$begin_count" -eq 1 ] && [ "$end_count" -eq 1 ]; then
    echo "  [PASS] Exactly one sentinel block after two installs"
else
    echo "  [FAIL] Found $begin_count BEGIN and $end_count END sentinels (expected 1 each)"
    exit 1
fi

echo ""
echo "=== Test: Pre-existing content is preserved ==="

# Write pre-existing content then re-install
printf '# My guidelines\n\nAlways use TypeScript.\n' > "$JUNIE_HOME/AGENTS.md"
"$REPO_ROOT/scripts/install-junie.sh"

if grep -qF "Always use TypeScript." "$JUNIE_HOME/AGENTS.md"; then
    echo "  [PASS] Pre-existing content preserved after install"
else
    echo "  [FAIL] Pre-existing content was overwritten"
    exit 1
fi

echo ""
echo "=== Test: Uninstall ==="

"$REPO_ROOT/scripts/uninstall-junie.sh"

if grep -qF "<!-- BEGIN SUPERPOWERS -->" "$JUNIE_HOME/AGENTS.md" 2>/dev/null; then
    echo "  [FAIL] Sentinel block still present after uninstall"
    exit 1
else
    echo "  [PASS] Sentinel block removed"
fi

if grep -qF "Always use TypeScript." "$JUNIE_HOME/AGENTS.md"; then
    echo "  [PASS] Pre-existing content preserved after uninstall"
else
    echo "  [FAIL] Pre-existing content was removed by uninstall"
    exit 1
fi

if [ -d "$JUNIE_HOME/skills/superpowers" ] && find "$JUNIE_HOME/skills/superpowers" -maxdepth 1 -mindepth 1 | grep -q .; then
    echo "  [FAIL] Skill symlinks still present after uninstall"
    exit 1
else
    echo "  [PASS] Skill symlinks removed"
fi

if [ -d "$JUNIE_HOME/commands" ] && find "$JUNIE_HOME/commands" -maxdepth 1 -mindepth 1 -name "superpowers-*.md" | grep -q .; then
    echo "  [FAIL] Command symlinks still present after uninstall"
    exit 1
else
    echo "  [PASS] Command symlinks removed"
fi

echo ""
echo "All tests passed."
