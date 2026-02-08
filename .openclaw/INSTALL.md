# Installing Superpowers for OpenClaw

Enable superpowers skills in OpenClaw via native skill discovery. Clone the repo and expose its `skills/` directory in your OpenClaw workspace.

## Prerequisites

- [OpenClaw](https://docs.openclaw.ai) installed
- Git

## Installation

### Automatic install (recommended)

Run this script in your terminal:

```bash
set -euo pipefail

REPO_URL="https://github.com/obra/superpowers.git"
INSTALL_DIR="$HOME/.openclaw/superpowers"
WORKSPACE_SKILLS_DIR="$HOME/.openclaw/workspace/skills"
TARGET_DIR="$WORKSPACE_SKILLS_DIR/superpowers"

if [ -d "$INSTALL_DIR/.git" ]; then
  git -C "$INSTALL_DIR" pull --ff-only
else
  git clone "$REPO_URL" "$INSTALL_DIR"
fi

mkdir -p "$WORKSPACE_SKILLS_DIR"
rm -rf "$TARGET_DIR"

if ln -s "$INSTALL_DIR/skills" "$TARGET_DIR" 2>/dev/null; then
  echo "Linked superpowers skills into $TARGET_DIR"
else
  cp -R "$INSTALL_DIR/skills" "$TARGET_DIR"
  echo "Symlink unavailable, copied skills into $TARGET_DIR"
fi
```

Start a new OpenClaw session (or restart the gateway) so the updated skills set is reloaded.

## Verify

```bash
ls -la ~/.openclaw/workspace/skills/superpowers
```

You should see a symlink (or a copied directory) that contains the superpowers skill folders.

## Updating

```bash
cd ~/.openclaw/superpowers && git pull
```

If you used a symlink, updates are immediate. If you used copy mode, re-run the install script to refresh the workspace copy.

## Uninstalling

```bash
rm -rf ~/.openclaw/workspace/skills/superpowers
```

Optionally remove the clone:

```bash
rm -rf ~/.openclaw/superpowers
```
