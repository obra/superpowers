#!/usr/bin/env bash
# SessionStart hook for Copilot CLI superpowers plugin
# Ensures the superpowers skill cache is up to date

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Verify skills directory exists
if [ ! -d "${PLUGIN_ROOT}/skills" ]; then
    echo "Warning: Superpowers skills directory not found at ${PLUGIN_ROOT}/skills" >&2
    exit 0
fi

exit 0
