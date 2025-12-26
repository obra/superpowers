#!/bin/bash
# Scaffold the Svelte Todo test project
# Usage: ./scaffold.sh /path/to/target/directory

set -e

TARGET_DIR="${1:?Usage: $0 <target-directory>}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Create target directory
mkdir -p "$TARGET_DIR"
cd "$TARGET_DIR"

# Initialize git repo
git init

# Copy design and plan
cp "$SCRIPT_DIR/design.md" .
cp "$SCRIPT_DIR/plan.md" .

# Create .claude settings to allow reads/writes in this directory
mkdir -p .claude
cat > .claude/settings.local.json << 'SETTINGS'
{
  "permissions": {
    "allow": [
      "Read(**)",
      "Edit(**)",
      "Write(**)",
      "Bash(npm:*)",
      "Bash(npx:*)",
      "Bash(mkdir:*)",
      "Bash(git:*)"
    ]
  }
}
SETTINGS

# Create initial commit
git add .
git commit -m "Initial project setup with design and plan"

echo "Scaffolded Svelte Todo project at: $TARGET_DIR"
echo ""
echo "To run the test:"
echo "  claude -p \"Execute this plan using superpowers:subagent-driven-development. Plan: $TARGET_DIR/plan.md\" --plugin-dir /path/to/superpowers"
