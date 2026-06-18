#!/usr/bin/env bash
# Static regression checks for Claude Code's brainstorming question policy.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

policy="skills/using-superpowers/references/claude-code-tools.md"
brainstorm="skills/brainstorming/SKILL.md"
kimi=".kimi-plugin/plugin.json"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

grep -q "not tool actions" "$policy" ||
  fail "Claude Code tool mapping must say ordinary user questions are not tool actions"

grep -q "plain conversational text" "$policy" ||
  fail "Claude Code tool mapping must preserve conversational text questions"

grep -q "Do not map those questions to \`AskUserQuestion\` by default" "$policy" ||
  fail "Claude Code tool mapping must explicitly avoid default AskUserQuestion routing"

grep -q "conversational text, not a structured question tool" "$brainstorm" ||
  fail "brainstorming must reinforce conversational question presentation for Claude Code"

if grep -RInE "always use.*AskUserQuestion|prefer.*AskUserQuestion|default.*AskUserQuestion" \
  skills/using-superpowers skills/brainstorming docs/README.md README.md 2>/dev/null; then
  fail "found a global instruction preferring AskUserQuestion"
fi

grep -q "call Kimi Code's \`AskUserQuestion\` tool" "$kimi" ||
  fail "Kimi's explicit AskUserQuestion opt-in mapping must remain intact"

echo "PASS: Claude Code brainstorming question policy is conversational and Kimi opt-in remains intact"
