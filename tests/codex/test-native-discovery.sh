#!/usr/bin/env bash
# Smoke tests for native Codex skill discovery.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "--- Native Discovery ---"

if ! command -v codex >/dev/null 2>&1; then
  echo "  [SKIP] codex CLI not found"
  exit 0
fi

mkdir -p "$HOME/.agents/skills"
ln -sfn "$REPO_ROOT/skills" "$HOME/.agents/skills/horspowers"

if [ -L "$HOME/.agents/skills/horspowers" ]; then
  echo "  [PASS] native skill symlink exists"
else
  echo "  [FAIL] native skill symlink missing"
  exit 1
fi

output_file="$(mktemp)"
cleanup() {
  rm -f "$output_file"
}
trap cleanup EXIT

if ! timeout 120s codex exec "What horspowers skills are available in this session? List the skill names only." >"$output_file" 2>&1; then
  echo "  [FAIL] codex exec did not complete successfully"
  sed -n '1,120p' "$output_file"
  exit 1
fi

if grep -q "using-horspowers" "$output_file"; then
  echo "  [PASS] Codex sees using-horspowers via native discovery"
else
  echo "  [FAIL] Codex did not report using-horspowers"
  sed -n '1,160p' "$output_file"
  exit 1
fi

if grep -q "brainstorming" "$output_file"; then
  echo "  [PASS] Codex sees brainstorming via native discovery"
else
  echo "  [FAIL] Codex did not report brainstorming"
  sed -n '1,160p' "$output_file"
  exit 1
fi

if grep -q "writing-plans" "$output_file"; then
  echo "  [PASS] Codex sees writing-plans via native discovery"
else
  echo "  [FAIL] Codex did not report writing-plans"
  sed -n '1,160p' "$output_file"
  exit 1
fi
