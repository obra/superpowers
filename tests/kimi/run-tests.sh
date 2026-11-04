#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

python3 -m pytest "$SCRIPT_DIR/test_plugin_manifest.py"
