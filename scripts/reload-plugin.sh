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

echo "==> Superpowers Plugin Reload Commands"
echo ""
echo "Copy and paste these into Claude Code (paste both lines at once):"
echo ""
echo "/plugin uninstall superpowers@superpowers-dev"
echo "/plugin install superpowers@superpowers-dev"
echo ""
echo "IMPORTANT: After reload, start a new session to see changes."
