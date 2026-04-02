#!/bin/bash
# Install ace-superpowers plugin for detected IDE

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IDE=${1:-auto}

detect_ide() {
  if [ -d ".claude" ] || [ -n "$CLAUDE_CODE" ]; then
    echo "claude"
  elif [ -d ".opencode" ]; then
    echo "opencode"
  elif [ -d ".cursor" ]; then
    echo "cursor"
  else
    echo "unknown"
  fi
}

if [ "$IDE" = "auto" ]; then
  IDE=$(detect_ide)
fi

echo "Installing ace-superpowers for IDE: $IDE"

case $IDE in
  claude)
    mkdir -p .claude/commands
    cp "$SCRIPT_DIR/plugins/claude/commands/"*.md .claude/commands/
    echo "Installed to .claude/commands/"
    ;;
  opencode)
    mkdir -p .opencode/commands
    cp "$SCRIPT_DIR/plugins/opencode/commands/"*.md .opencode/commands/
    echo "Installed to .opencode/commands/"
    ;;
  *)
    echo "Unknown IDE: $IDE"
    exit 1
    ;;
esac

echo "Installation complete!"
