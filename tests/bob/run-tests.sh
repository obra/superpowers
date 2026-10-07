#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== IBM Bob integration tests ==="
echo ""

bash "$SCRIPT_DIR/test-bob-plugin-manifest.sh"
bash "$SCRIPT_DIR/test-bob-tools.sh"

echo ""
echo "All Bob tests passed."
