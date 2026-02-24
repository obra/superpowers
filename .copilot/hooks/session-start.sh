#!/usr/bin/env bash
# SessionStart hook for Copilot CLI superpowers plugin
# Checks that skills and agents directories exist

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Verify skills directory exists
if [ ! -d "${PLUGIN_ROOT}/skills" ]; then
    echo "Warning: Superpowers skills directory not found at ${PLUGIN_ROOT}/skills" >&2
    exit 0
fi

# Verify agents directory exists
if [ ! -d "${PLUGIN_ROOT}/agents" ]; then
    echo "Warning: Superpowers agents directory not found at ${PLUGIN_ROOT}/agents" >&2
fi

exit 0
