#!/usr/bin/env bash
#
# reload-plugin.sh - Helper for reloading superpowers plugin in Claude Code
#
# This script outputs the slash commands needed to reload the superpowers plugin
# after making changes. Copy and paste both commands into Claude Code.
#
# Usage:
#   ./scripts/reload-plugin.sh
#   rls  # if you have the alias set up
#

# Extract marketplace name from marketplace.json
MARKETPLACE=$(jq -r '.name' "$(dirname "$0")/../.claude-plugin/marketplace.json" 2>/dev/null || echo "superpowers-dev")

echo "==> Superpowers Plugin Reload Commands"
echo ""
echo "Copy and paste these into Claude Code (paste both lines at once):"
echo ""
echo "/plugin uninstall superpowers@${MARKETPLACE}"
echo "/plugin install superpowers@${MARKETPLACE}"
echo ""
echo "IMPORTANT: After reload, start a new session to see changes."
