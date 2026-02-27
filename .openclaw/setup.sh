#!/usr/bin/env bash
set -euo pipefail

# Configurable inputs (override via env vars)
SUPERPOWERS_REPO_URL="${SUPERPOWERS_REPO_URL:-https://github.com/obra/superpowers.git}"
SUPERPOWERS_REPO_REF="${SUPERPOWERS_REPO_REF:-main}"
SUPERPOWERS_DIR="${SUPERPOWERS_DIR:-$HOME/.superpowers}"
OPENCLAW_SKILLS_DIR="${OPENCLAW_SKILLS_DIR:-$HOME/.openclaw/skills}"
WORKSPACE_AGENTS="${OPENCLAW_WORKSPACE_AGENTS:-$HOME/.openclaw/workspace/AGENTS.md}"
WRAPPER_MARKER="<!-- superpowers-openclaw-wrapper -->"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SNIPPET_FILE="$SCRIPT_DIR/AGENTS-snippet.md"

# Preflight checks
if ! command -v git >/dev/null 2>&1; then
  echo "ERROR: git is required but not found in PATH."
  exit 1
fi
if [ ! -r "$SNIPPET_FILE" ]; then
  echo "ERROR: AGENTS-snippet.md not found or not readable at $SNIPPET_FILE"
  exit 1
fi

echo "Superpowers OpenClaw wrapper config:"
echo "  SUPERPOWERS_REPO_URL=$SUPERPOWERS_REPO_URL"
echo "  SUPERPOWERS_REPO_REF=$SUPERPOWERS_REPO_REF"
echo "  SUPERPOWERS_DIR=$SUPERPOWERS_DIR"
echo "  OPENCLAW_SKILLS_DIR=$OPENCLAW_SKILLS_DIR"
echo "  WORKSPACE_AGENTS=$WORKSPACE_AGENTS"

# 1) Clone or update superpowers
if [ ! -d "$SUPERPOWERS_DIR/.git" ]; then
  echo "Cloning Superpowers repo..."
  git clone --depth 1 --branch "$SUPERPOWERS_REPO_REF" "$SUPERPOWERS_REPO_URL" "$SUPERPOWERS_DIR"
else
  echo "Superpowers already present at $SUPERPOWERS_DIR. Updating..."
  git -C "$SUPERPOWERS_DIR" remote set-url origin "$SUPERPOWERS_REPO_URL"

  # If shallow, unshallow so switching refs remains reliable.
  if [ "$(git -C "$SUPERPOWERS_DIR" rev-parse --is-shallow-repository)" = "true" ]; then
    git -C "$SUPERPOWERS_DIR" fetch --unshallow origin
  fi

  git -C "$SUPERPOWERS_DIR" fetch origin "$SUPERPOWERS_REPO_REF"
  git -C "$SUPERPOWERS_DIR" checkout -B "$SUPERPOWERS_REPO_REF" FETCH_HEAD
fi

# 2) Create target skills dir
mkdir -p "$OPENCLAW_SKILLS_DIR"

# 3) Symlink all skill directories
if [ ! -d "$SUPERPOWERS_DIR/skills" ]; then
  echo "ERROR: skills directory not found at $SUPERPOWERS_DIR/skills"
  exit 1
fi

echo "Creating symlinks..."
for skill_dir in "$SUPERPOWERS_DIR"/skills/*; do
  [ -d "$skill_dir" ] || continue
  skill_name="$(basename "$skill_dir")"
  target="$OPENCLAW_SKILLS_DIR/$skill_name"
  if [ ! -L "$target" ] && [ ! -e "$target" ]; then
    ln -s "$skill_dir" "$target"
    echo "  Linked $skill_name"
  else
    echo "  Skipped $skill_name (already exists)"
  fi
done

# 4) Inject AGENTS snippet if not already present
if [ -f "$WORKSPACE_AGENTS" ]; then
  if grep -q "$WRAPPER_MARKER" "$WORKSPACE_AGENTS"; then
    echo "Wrapper snippet already present in $WORKSPACE_AGENTS. Skipping snippet injection."
  else
    echo "Injecting Superpowers block into $WORKSPACE_AGENTS..."
    echo "" >> "$WORKSPACE_AGENTS"
    cat "$SNIPPET_FILE" >> "$WORKSPACE_AGENTS"
    echo "Snippet injected."
  fi
else
  echo "Workspace AGENTS.md not found at $WORKSPACE_AGENTS."
  echo "Please manually append $SNIPPET_FILE to your AGENTS.md when ready."
fi

# 5) Optional verification
echo "Verifying installation..."
if command -v openclaw >/dev/null 2>&1; then
  openclaw skills info using-superpowers || echo "Skill check failed, check openclaw configuration."
else
  echo "openclaw command not found in PATH, skipping automatic verification."
fi

echo "Superpowers OpenClaw Wrapper installation complete!"
