#!/usr/bin/env bash
# Run in Cursor integrated terminal or iTerm (TTY required for passphrase).
set -euo pipefail

python3 -m pip install --user cryptography -q 2>/dev/null || true

python3 "${HOME}/.cursor/skills/code-presser/scripts/cpx_press.py" seal \
  --input /Users/isaaczhu/workspace/applifier/external-gateway \
  --output /Users/isaaczhu/workspace/isaac/superpowers/resources/eg \
  --split 5

echo ""
echo "Done. Shards in eg/:"
ls -la /Users/isaaczhu/workspace/isaac/superpowers/resources/eg
