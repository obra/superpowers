#!/usr/bin/env bash
# Unified runner for brainstorm server tests.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo " Brainstorm Server Test Suite"
echo "========================================"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js not found"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm not found"
  exit 1
fi

if [ ! -d node_modules/ws ]; then
  echo "Installing test dependencies with npm ci..."
  npm ci
  echo ""
fi

echo "--- Node Integration Tests ---"
npm test
echo ""

echo "--- Windows Lifecycle Tests ---"
bash ./windows-lifecycle.test.sh
echo ""

echo "========================================"
echo " Brainstorm Server tests passed"
echo "========================================"
