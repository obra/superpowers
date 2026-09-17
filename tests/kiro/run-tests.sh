#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

for test_script in "$SCRIPT_DIR"/test-*.sh; do
  echo ">>> $test_script"
  bash "$test_script"
done
