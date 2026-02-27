#!/usr/bin/env bash
#
# One-time setup for new team members.
# Run after cloning: bash scripts/setup.sh
#

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Project Setup ==="
echo ""

# 1. Install git hooks
echo "[1/3] Installing git hooks..."
HOOK_SRC="$REPO_ROOT/scripts/hooks/pre-commit"
HOOK_DST="$REPO_ROOT/.git/hooks/pre-commit"

if [ -f "$HOOK_DST" ]; then
  echo "  WARNING: .git/hooks/pre-commit already exists, backing up to pre-commit.bak"
  cp "$HOOK_DST" "$HOOK_DST.bak"
fi

cp "$HOOK_SRC" "$HOOK_DST"
chmod +x "$HOOK_DST"
echo "  Installed pre-commit hook (auto-syncs AGENTS.md on commit)"

# 2. Sync agent instruction files
echo ""
echo "[2/3] Syncing agent instruction files..."
bash "$REPO_ROOT/scripts/sync-agents.sh"

# 3. Check superpowers plugin
echo ""
echo "[3/3] Checking AI coding tools..."
echo ""
echo "  Please install the superpowers plugin for your editor:"
echo ""
echo "  Claude Code:"
echo "    /plugin marketplace add obra/superpowers-marketplace"
echo "    /plugin install superpowers@superpowers-marketplace"
echo ""
echo "  Cursor:"
echo "    /plugin-add superpowers"
echo ""
echo "  GitHub Copilot:"
echo "    No plugin needed — .github/copilot-instructions.md is already synced."
echo ""
echo "=== Setup complete ==="
