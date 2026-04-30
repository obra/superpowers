#!/usr/bin/env bash
# Test: Bootstrap Agent Control
# Verifies agent-scoped bootstrap skipping without requiring OpenCode runtime.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Bootstrap Agent Control ==="

source "$SCRIPT_DIR/setup.sh"
trap cleanup_test_env EXIT

node "$SCRIPT_DIR/test-bootstrap-agent-control.mjs"

echo ""
echo "=== Bootstrap agent control test passed ==="
