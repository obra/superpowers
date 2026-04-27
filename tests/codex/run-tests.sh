#!/usr/bin/env bash
# Codex compatibility smoke test runner
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "========================================"
echo " Codex Compatibility Test Suite"
echo "========================================"
echo ""

bash "$SCRIPT_DIR/test-legacy-cli.sh"
echo ""
bash "$SCRIPT_DIR/test-native-discovery.sh"

echo ""
echo "========================================"
echo " All Codex compatibility tests passed"
echo "========================================"
