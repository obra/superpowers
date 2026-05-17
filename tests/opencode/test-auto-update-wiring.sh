#!/usr/bin/env bash
# Test: OpenCode auto-update wiring
# Verifies the OpenCode plugin includes startup git auto-update logic.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: OpenCode Auto-Update Wiring ==="

# Source setup to create isolated environment
source "$SCRIPT_DIR/setup.sh"

# Trap to cleanup on exit
trap cleanup_test_env EXIT

plugin_file="$HOME/.config/opencode/superpowers/.opencode/plugins/superpowers-prepared.js"

echo "Test 1: Plugin file exists..."
if [ -f "$plugin_file" ]; then
    echo "  [PASS] Plugin file exists"
else
    echo "  [FAIL] Plugin file missing at $plugin_file"
    exit 1
fi

echo "Test 2: Auto-update function exists..."
if rg -q "checkForUpdates" "$plugin_file"; then
    echo "  [PASS] checkForUpdates logic present"
else
    echo "  [FAIL] Missing checkForUpdates logic"
    exit 1
fi

echo "Test 3: 24h cache marker exists..."
if rg -q "update-check\\.cache|86400" "$plugin_file"; then
    echo "  [PASS] Cache/TTL wiring present"
else
    echo "  [FAIL] Missing cache/TTL wiring"
    exit 1
fi

echo "Test 4: Non-destructive git update flow exists..."
if rg -q "merge" "$plugin_file" && rg -q "\\-\\-ff-only" "$plugin_file" && rg -q "origin/main" "$plugin_file" && ! rg -q "reset --hard origin/main" "$plugin_file"; then
    echo "  [PASS] Safe git update flow wiring present"
else
    echo "  [FAIL] Missing safe git update flow wiring"
    exit 1
fi

echo ""
echo "=== OpenCode auto-update wiring tests passed ==="
