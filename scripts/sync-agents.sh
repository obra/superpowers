#!/usr/bin/env bash
#
# Sync AGENTS.md → CLAUDE.md, .cursorrules, .github/copilot-instructions.md
#
# AGENTS.md is the single source of truth.
# Sections wrapped in <!-- BEGIN:SUPERPOWERS_ONLY --> ... <!-- END:SUPERPOWERS_ONLY -->
# are included in CLAUDE.md and .cursorrules but stripped for Copilot.
#

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE="$REPO_ROOT/AGENTS.md"

if [ ! -f "$SOURCE" ]; then
  echo "ERROR: AGENTS.md not found at $SOURCE"
  exit 1
fi

# --- CLAUDE.md (full content) ---
cp "$SOURCE" "$REPO_ROOT/CLAUDE.md"
echo "Synced: AGENTS.md → CLAUDE.md"

# --- .cursorrules (full content) ---
cp "$SOURCE" "$REPO_ROOT/.cursorrules"
echo "Synced: AGENTS.md → .cursorrules"

# --- .github/copilot-instructions.md (stripped) ---
mkdir -p "$REPO_ROOT/.github"
sed '/<!-- BEGIN:SUPERPOWERS_ONLY -->/,/<!-- END:SUPERPOWERS_ONLY -->/d' "$SOURCE" \
  | sed '/^$/N;/^\n$/d' \
  > "$REPO_ROOT/.github/copilot-instructions.md"
echo "Synced: AGENTS.md → .github/copilot-instructions.md (superpowers sections stripped)"

echo ""
echo "Done. All agent instruction files are in sync."
