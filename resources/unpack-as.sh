#!/usr/bin/env bash
# Unpack asset shards from resources/as/ (TTY required for passphrase).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=_cpx.sh
source "${SCRIPT_DIR}/_cpx.sh"
CPX="$(_resolve_cpx_press "${SCRIPT_DIR}")" || {
  echo "cpx_press.py not found. Set ISAAC_REPO=/path/to/isaac." >&2
  exit 1
}

OUT="${1:-${SCRIPT_DIR}/asset-unpacked}"

python3 "$CPX" unpack \
  --input "${SCRIPT_DIR}/as" \
  --output "$OUT"

echo ""
echo "Restored to: $OUT"
ls -la "$OUT" | head -20
