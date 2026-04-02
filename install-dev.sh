#!/bin/bash
# Install ace-superpowers in dev mode (symlinks)

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

echo "Installing ace-superpowers in DEV mode for IDE: $IDE"

case $IDE in
  claude)
    mkdir -p .claude/commands
    for file in "$SCRIPT_DIR/plugins/claude/commands/"*.md; do
      if [ -f "$file" ]; then
        basename_file=$(basename "$file")
        ln -sf "$file" ".claude/commands/$basename_file"
        echo "Linked: $basename_file"
      fi
    done
    echo "Installed symlinks to .claude/commands/"
    ;;
  opencode)
    mkdir -p .opencode/commands
    for file in "$SCRIPT_DIR/plugins/opencode/commands/"*.md; do
      if [ -f "$file" ]; then
        basename_file=$(basename "$file")
        ln -sf "$file" ".opencode/commands/$basename_file"
        echo "Linked: $basename_file"
      fi
    done
    echo "Installed symlinks to .opencode/commands/"
    ;;
  *)
    echo "Unknown IDE: $IDE"
    exit 1
    ;;
esac

echo "Dev installation complete!"
