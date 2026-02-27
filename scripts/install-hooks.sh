#!/usr/bin/env bash
set -e

REPO="$(git rev-parse --show-toplevel)"
HOOKS_SRC="$REPO/scripts/hooks"
HOOKS_DST="$REPO/.git/hooks"

for hook in "$HOOKS_SRC"/*; do
  name="$(basename "$hook")"
  cp "$hook" "$HOOKS_DST/$name"
  chmod +x "$HOOKS_DST/$name"
  echo "Installed: .git/hooks/$name"
done

echo "Done. Git hooks installed."
