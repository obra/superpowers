#!/usr/bin/env bash
# Verifies the Claude Code plugin package is isolated under claude-code/.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PLUGIN_DIR="$REPO_ROOT/claude-code"
PLUGIN_JSON="$PLUGIN_DIR/.claude-plugin/plugin.json"
MARKETPLACE_JSON="$REPO_ROOT/.claude-plugin/marketplace.json"
SKILLS_DIR="$PLUGIN_DIR/skills"

fail() {
  echo "  [FAIL] $1"
  exit 1
}

pass() {
  echo "  [PASS] $1"
}

require_file() {
  [ -f "$1" ] || fail "Missing required file: $1"
  pass "found $2"
}

require_dir() {
  [ -d "$1" ] || fail "Missing required directory: $1"
  pass "found $2"
}

forbid_dir() {
  [ ! -d "$1" ] || fail "Runtime directory should not remain at repository root: $1"
  pass "root does not contain $2"
}

echo "=== Test: Claude Code Plugin Package ==="

require_file "$MARKETPLACE_JSON" "root Claude Code marketplace"
grep -Eq '"source"[[:space:]]*:[[:space:]]*"\./claude-code"' "$MARKETPLACE_JSON" \
  || fail 'Claude Code marketplace must point at "./claude-code"'
pass 'Claude Code marketplace points at ./claude-code'

require_file "$PLUGIN_JSON" "Claude Code plugin metadata"
require_dir "$SKILLS_DIR" "Claude Code skills directory"
require_file "$SKILLS_DIR/using-superpowers/SKILL.md" "using-superpowers skill"
require_file "$PLUGIN_DIR/hooks/session-start.sh" "session-start hook"
require_file "$PLUGIN_DIR/commands/brainstorm.md" "brainstorm command"
require_file "$PLUGIN_DIR/agents/audit-agent.md" "audit agent"

forbid_dir "$REPO_ROOT/skills" "skills/"
forbid_dir "$REPO_ROOT/hooks" "hooks/"
forbid_dir "$REPO_ROOT/commands" "commands/"
forbid_dir "$REPO_ROOT/agents" "agents/"
