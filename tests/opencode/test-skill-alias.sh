#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Native skill bare-name alias fallback ==="
node "$SCRIPT_DIR/test-skill-alias-unit.mjs"
echo "=== Alias fallback unit test passed ==="
