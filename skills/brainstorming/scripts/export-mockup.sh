#!/usr/bin/env bash
#
# Export a locked mockup fragment as a self-contained HTML artifact.
#
# Usage:
#   export-mockup.sh <fragment-file> <output-file> [--title "Screen name"]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SCRIPT_DIR/export-mockup.cjs" "$@"
