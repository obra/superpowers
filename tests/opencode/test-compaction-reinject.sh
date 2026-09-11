#!/usr/bin/env bash
# Test: Compaction Re-injection
# Verifies the OpenCode transform re-injects the bootstrap on the
# post-compaction continue-turn (port of Pi's session_compact behavior).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Compaction Re-injection ==="

source "$SCRIPT_DIR/setup.sh"
trap cleanup_test_env EXIT

echo "Test 1: Re-injection across compaction shapes, no double-injection, cache intact..."
node "$SCRIPT_DIR/test-compaction-reinject.mjs" "$SUPERPOWERS_PLUGIN_FILE"
echo "  [PASS] Post-compaction turns are re-grounded; normal path unchanged"

echo ""
echo "=== All compaction re-injection tests passed ==="
