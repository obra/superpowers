#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
README="$REPO_ROOT/README.md"
DOC="$REPO_ROOT/docs/README.kiro.md"

fail() { echo "FAIL: $*" >&2; exit 1; }
[ -f "$DOC" ] || fail "docs/README.kiro.md missing"
for text in \
  '### Kiro CLI' \
  'scripts/install-kiro.sh' \
  'docs/README.kiro.md'; do
  grep -Fq -- "$text" "$README" || fail "README missing $text"
done
for text in \
  'Kiro CLI v3' \
  'kiro-cli settings chat.defaultAgent superpowers' \
  'kiro-cli chat --agent-engine v3' \
  '--source .' \
  'kiro-cli chat --agent superpowers --agent-engine v3' \
  'XDG_DATA_HOME' \
  '.superpowers-kiro-install' \
  'Native Windows is not supported' \
  'Kiro Powers' \
  'Load skill' \
  'superpowers-worker-default-model' \
  'superpowers-worker-lite-model' \
  'claude-sonnet-5' \
  'would shadow' \
  'superpowers.json.disabled' \
  'TUI'; do
  grep -Fq -- "$text" "$DOC" || fail "Kiro guide missing $text"
done

echo "PASS: Kiro documentation contract"
