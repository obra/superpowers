#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== Template Render Check ==="

agents=(claude codex opencode)

for agent in "${agents[@]}"; do
  echo "--- $agent ---"
  node "$ROOT_DIR/scripts/render-agent.js" --agent "$agent" --check
done

echo "All agents rendered successfully."
