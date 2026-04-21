#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SHARED_SKILLS_DIR="$REPO_ROOT/plugins/nimbou-skills/skills"
CODEX_COMMAND_SKILLS_DIR="$REPO_ROOT/.codex/skills"
CODEX_SKILLS_DIR="${CODEX_SKILLS_DIR:-$HOME/.codex/skills}"

link_path() {
  local source="$1"
  local target="$2"
  local label="$3"

  mkdir -p "$(dirname "$target")"

  if [ -L "$target" ]; then
    ln -sfn "$source" "$target"
    echo "$label already linked: $target"
    return 0
  fi

  if [ -e "$target" ]; then
    echo "Skipping existing $label: $target" >&2
    return 0
  fi

  ln -s "$source" "$target"
  echo "Linked $label: $target"
}

mkdir -p "$CODEX_SKILLS_DIR"

for skills_dir in "$SHARED_SKILLS_DIR" "$CODEX_COMMAND_SKILLS_DIR"; do
  [ -d "$skills_dir" ] || continue

  for source in "$skills_dir"/*; do
    [ -d "$source" ] || continue
    link_path "$source" "$CODEX_SKILLS_DIR/$(basename "$source")" "Codex skill"
  done
done

echo "Configured Codex skills: $CODEX_SKILLS_DIR"
