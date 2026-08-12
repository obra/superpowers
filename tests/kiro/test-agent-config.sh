#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AGENT="$REPO_ROOT/.kiro/agents/superpowers.md"
MAPPING="$REPO_ROOT/skills/using-superpowers/references/kiro-tools.md"

fail() { echo "FAIL: $*" >&2; exit 1; }
assert_contains() {
  local file="$1" text="$2" label="$3"
  grep -Fq -- "$text" "$file" || fail "$label: missing $text"
}
assert_not_contains() {
  local file="$1" text="$2" label="$3"
  if grep -Fq -- "$text" "$file"; then
    fail "$label: unexpectedly contains $text"
  fi
}

[ -f "$AGENT" ] || fail "repository Kiro agent missing"
[ -f "$MAPPING" ] || fail "Kiro tool mapping missing"

for text in \
  'tools: ["*"]' \
  'file://skills/using-superpowers/SKILL.md' \
  'file://skills/using-superpowers/references/kiro-tools.md' \
  'skill://skills/**/SKILL.md' \
  'capability: fs_read' \
  'capability: skill' \
  'welcomeMessage: Superpowers is active.'; do
  assert_contains "$AGENT" "$text" "repository agent"
done
assert_contains "$AGENT" 'follows the loaded Superpowers bootstrap' "agent prompt"
assert_not_contains "$AGENT" 'vendor/superpowers' "upstream paths must not use the outer vendor checkout"

for text in \
  'Native `Load skill` tool' \
  'Subagent tools' \
  'Todo-list tools' \
  'Web tools' \
  '"task_description": "Explore project context"' \
  'objects using `description`'; do
  assert_contains "$MAPPING" "$text" "Kiro mapping"
done
assert_not_contains "$MAPPING" '{"description":' "invalid todo payload example"
assert_not_contains "$MAPPING" 'vendor/superpowers/skills/' "mapping must describe the upstream layout"

echo "PASS: Kiro repository agent and tool mapping"
