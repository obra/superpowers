#!/bin/bash
set -e

# 1. Check that ~/.superpowers exists; if not, clone it
if [ ! -d "$HOME/.superpowers" ]; then
  echo "Cloning obra/superpowers..."
  git clone https://github.com/obra/superpowers "$HOME/.superpowers"
else
  echo "Superpowers already cloned at ~/.superpowers. Updating..."
  cd "$HOME/.superpowers" && git pull
fi

# 2. Create ~/.openclaw/skills/ if it doesn't exist
mkdir -p "$HOME/.openclaw/skills"

# 3. Create all 14 symlinks, skipping any that already exist
echo "Creating symlinks..."
for skill_dir in "$HOME/.superpowers/skills"/*/; do
  # Ensure it is a valid directory
  if [ -d "$skill_dir" ]; then
    skill_name=$(basename "$skill_dir")
    target="$HOME/.openclaw/skills/$skill_name"
    if [ ! -L "$target" ] && [ ! -e "$target" ]; then
      ln -s "$skill_dir" "$target"
      echo "  Linked $skill_name"
    else
      echo "  Skipped $skill_name (already exists)"
    fi
  fi
done

# 4. Check whether AGENTS.md already contains a Superpowers block; if not, append the contents of AGENTS-snippet.md
WORKSPACE_AGENTS="$HOME/.openclaw/workspace/AGENTS.md"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$WORKSPACE_AGENTS" ]; then
  if grep -q "## Superpowers" "$WORKSPACE_AGENTS"; then
    echo "Superpowers block already exists in $WORKSPACE_AGENTS. Skipping snippet injection."
  else
    echo "Injecting Superpowers block into $WORKSPACE_AGENTS..."
    echo "" >> "$WORKSPACE_AGENTS"
    cat "$SCRIPT_DIR/AGENTS-snippet.md" >> "$WORKSPACE_AGENTS"
    echo "Snippet injected."
  fi
else
  echo "Workspace AGENTS.md not found at $WORKSPACE_AGENTS. Please manually append the contents of AGENTS-snippet.md to your AGENTS.md when ready."
fi

# 5. Run openclaw skills info using-superpowers to verify
echo "Verifying installation..."
if command -v openclaw &> /dev/null; then
  openclaw skills info using-superpowers || echo "Skill check failed, check openclaw configuration."
else
  echo "openclaw command not found in PATH, skipping automatic verification."
fi

# 6. Print a success summary
echo "Superpowers OpenClaw Wrapper installation complete!"
