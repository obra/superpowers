#!/usr/bin/env bash
# Smoke tests for the legacy Codex compatibility CLI.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "--- Legacy CLI Compatibility ---"

if ! command -v node >/dev/null 2>&1; then
  echo "  [SKIP] Node.js not found"
  exit 0
fi

output=$(node "$REPO_ROOT/.codex/superpowers-codex" find-skills)

if echo "$output" | grep -q "horspowers:brainstorming"; then
  echo "  [PASS] find-skills lists horspowers skills"
else
  echo "  [FAIL] find-skills did not list horspowers:brainstorming"
  exit 1
fi

if echo "$output" | grep -q "horspowers:using-horspowers"; then
  echo "  [PASS] find-skills lists using-horspowers"
else
  echo "  [FAIL] find-skills did not list horspowers:using-horspowers"
  exit 1
fi

skill_output=$(node "$REPO_ROOT/.codex/superpowers-codex" use-skill horspowers:brainstorming)

if echo "$skill_output" | grep -q "<HARD-GATE>"; then
  echo "  [PASS] use-skill loads current brainstorming content"
else
  echo "  [FAIL] use-skill did not load updated brainstorming skill"
  exit 1
fi

bootstrap_output=$(node "$REPO_ROOT/.codex/superpowers-codex" bootstrap)

if echo "$bootstrap_output" | grep -q "~/.agents/skills/horspowers"; then
  echo "  [PASS] bootstrap points to native discovery path"
else
  echo "  [FAIL] bootstrap output did not mention ~/.agents/skills/horspowers"
  exit 1
fi
