#!/usr/bin/env bash
# Setup script for Copilot CLI plugin tests
# Creates an isolated test environment and runs install.sh
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

# Helper function for cleanup (call from tests or trap)
cleanup_test_env() {
    if [ -n "${TEST_HOME:-}" ] && [ -d "$TEST_HOME" ]; then
        rm -rf "$TEST_HOME"
    fi
}
export -f cleanup_test_env
export REPO_ROOT

# Create temp home directory for isolation
TEST_HOME=$(mktemp -d)
export TEST_HOME
export HOME="$TEST_HOME"

# Run install.sh in isolated environment
bash "$REPO_ROOT/.copilot/install.sh"

echo "Setup complete: $TEST_HOME"
