#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Running ECA plugin structure tests..."
bash "$SCRIPT_DIR/test-plugin-structure.sh"
