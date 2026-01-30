#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

PROMPTS_DIR="$REPO_DIR/.continue/prompts"

if [ ! -d "$PROMPTS_DIR" ]; then
  echo "Missing directory: $PROMPTS_DIR"
  exit 1
fi

prompts=(
  "superpowers-bootstrap.prompt"
  "superpowers-brainstorm.prompt"
  "superpowers-write-plan.prompt"
  "superpowers-execute-plan.prompt"
)

for file in "${prompts[@]}"; do
  path="$PROMPTS_DIR/$file"

  if [ ! -f "$path" ]; then
    echo "Missing prompt file: $path"
    exit 1
  fi

  if ! awk 'NR==1{print} NR==2{print} NR==3{print} NR==4{print}' "$path" | grep -q '^---$'; then
    echo "Prompt frontmatter must start with ---: $path"
    exit 1
  fi

  if ! grep -q '^name: ' "$path"; then
    echo "Prompt missing frontmatter field: name ($path)"
    exit 1
  fi

  if ! grep -q '^description: ' "$path"; then
    echo "Prompt missing frontmatter field: description ($path)"
    exit 1
  fi

  if ! grep -q '^invokable: true$' "$path"; then
    echo "Prompt missing frontmatter field: invokable: true ($path)"
    exit 1
  fi
done

echo "Continue prompts OK (${#prompts[@]} files)"
