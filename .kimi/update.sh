#!/usr/bin/env bash
# Update Superpowers for Kimi Code
# Pulls latest changes and re-runs the install script.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=== Updating Superpowers ==="
cd "${REPO_ROOT}"
git pull

echo ""
"${SCRIPT_DIR}/install.sh"
