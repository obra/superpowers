#!/usr/bin/env bash
# Setup helpers for Junie integration tests — creates isolated ~/.junie equivalent
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

export TEST_HOME
TEST_HOME=$(mktemp -d)
export HOME="$TEST_HOME"

# install-junie.sh respects JUNIE_HOME if set
export JUNIE_HOME="$TEST_HOME/.junie"

cleanup_test_env() {
    if [ -n "${TEST_HOME:-}" ] && [ -d "$TEST_HOME" ]; then
        rm -rf "$TEST_HOME"
    fi
}

export -f cleanup_test_env
export REPO_ROOT
