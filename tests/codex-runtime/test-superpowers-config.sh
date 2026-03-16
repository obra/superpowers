#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_BIN="$REPO_ROOT/bin/superpowers-config"

STATE_DIR="$(mktemp -d)"
trap 'rm -rf "$STATE_DIR"' EXIT
export SUPERPOWERS_STATE_DIR="$STATE_DIR"

missing="$("$CONFIG_BIN" get update_check)"
if [[ -n "$missing" ]]; then
  echo "Expected missing config key to return empty output"
  exit 1
fi

"$CONFIG_BIN" set update_check false
value="$("$CONFIG_BIN" get update_check)"
if [[ "$value" != "false" ]]; then
  echo "Expected update_check=false, got: $value"
  exit 1
fi

"$CONFIG_BIN" set update_check true
value="$("$CONFIG_BIN" get update_check)"
if [[ "$value" != "true" ]]; then
  echo "Expected update_check=true after overwrite, got: $value"
  exit 1
fi

"$CONFIG_BIN" set superpowers_contributor true
listing="$("$CONFIG_BIN" list)"
if ! printf '%s\n' "$listing" | rg -q '^update_check: true$'; then
  echo "Expected config listing to include update_check: true"
  exit 1
fi
if ! printf '%s\n' "$listing" | rg -q '^superpowers_contributor: true$'; then
  echo "Expected config listing to include superpowers_contributor: true"
  exit 1
fi

echo "superpowers-config smoke test passed."
