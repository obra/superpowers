#!/usr/bin/env bash
# Codex compatibility smoke test runner
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "========================================"
echo " Codex Compatibility Test Suite"
echo "========================================"
echo ""
echo "Using Codex binary: ${CODEX_BIN:-codex}"
echo ""

bash "$SCRIPT_DIR/test-legacy-cli.sh"
echo ""
bash "$SCRIPT_DIR/test-native-discovery.sh"
echo ""
bash "$SCRIPT_DIR/test-tdd-trigger.sh"
echo ""
bash "$SCRIPT_DIR/test-skill-trigger-queue-sync.sh"
echo ""
bash "$SCRIPT_DIR/test-document-review-flow.sh"

echo ""
echo "========================================"
echo " All Codex compatibility tests passed"
echo "========================================"
