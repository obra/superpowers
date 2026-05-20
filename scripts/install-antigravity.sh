#!/usr/bin/env bash
set -euo pipefail

# Resolve paths
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PLUGINS_DIR="$HOME/.gemini/config/plugins/superpowers"

if [ -d "$PLUGINS_DIR" ] || [ -L "$PLUGINS_DIR" ]; then
    echo "Removing existing superpowers plugin directory at $PLUGINS_DIR..."
    rm -rf "$PLUGINS_DIR"
fi

echo "Creating superpowers plugin directory at $PLUGINS_DIR..."
mkdir -p "$PLUGINS_DIR"

# Link files
ln -sf "$REPO_ROOT/.antigravity-plugin/plugin.json" "$PLUGINS_DIR/plugin.json"
ln -sf "$REPO_ROOT/.antigravity-plugin/ANTIGRAVITY.md" "$PLUGINS_DIR/ANTIGRAVITY.md"
ln -sf "$REPO_ROOT/skills" "$PLUGINS_DIR/skills"

echo "Superpowers plugin installed successfully for Antigravity!"
