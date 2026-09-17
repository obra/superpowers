#!/usr/bin/env bash
# Run all DeepSeek Harness (dsh) integration tests.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== DeepSeek Harness integration tests ==="

echo
echo ">>> $SCRIPT_DIR/test-dsh-plugin.mjs"
node --test "$SCRIPT_DIR/test-dsh-plugin.mjs"

for t in "$SCRIPT_DIR"/test-*.sh; do
  echo
  echo ">>> $t"
  bash "$t"
done

echo
echo "=== All DeepSeek Harness tests passed ==="
