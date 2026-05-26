#!/usr/bin/env bash
# Run in Cursor integrated terminal or iTerm (TTY required for passphrase).
set -euo pipefail

python3 -m pip install --user cryptography -q 2>/dev/null || true

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=_cpx.sh
source "${SCRIPT_DIR}/_cpx.sh"
CPX="$(_resolve_cpx_press "${SCRIPT_DIR}")" || {
  echo "cpx_press.py not found. Set ISAAC_REPO=/path/to/isaac or run from isaac repo." >&2
  exit 1
}
python3 "$CPX" seal \
  --input /Users/isaaczhu/workspace/applifier/web-frontend \
  --output /Users/isaaczhu/workspace/isaac/superpowers/resources/web \
  --split 5

echo ""
echo "Done. Shards:"
ls -la /Users/isaaczhu/workspace/isaac/superpowers/resources/web
