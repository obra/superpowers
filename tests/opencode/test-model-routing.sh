#!/usr/bin/env bash
# Test: OpenCode model-routing profile installer
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: OpenCode model-routing profiles ==="
node "$SCRIPT_DIR/test-model-routing.mjs"
echo "=== OpenCode model-routing profiles passed ==="
