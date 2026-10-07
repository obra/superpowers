#!/usr/bin/env bash
# Validate the IBM Bob tool mapping.
# Checks that bob-tools.md exists, documents the key Bob-specific tool names,
# and that SKILL.md's Platform Adaptation section links to it.
#
# Mirrors tests/antigravity/test-antigravity-tools.sh.
# CI-safe: does not require Bob to be installed.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

MAPPING="$REPO_ROOT/skills/using-superpowers/references/bob-tools.md"
SKILL="$REPO_ROOT/skills/using-superpowers/SKILL.md"

fail() { echo "FAIL: $*" >&2; exit 1; }

echo "test-bob-tools: checking IBM Bob tool mapping"

# --- Mapping exists ----------------------------------------------------------
[ -f "$MAPPING" ] || fail "tool mapping missing at $MAPPING"

# --- Core action→tool mappings are documented --------------------------------
for tool in use_skill spawn_subagent update_todo_list execute_command \
            read_file write_file apply_diff grep glob; do
  grep -q "$tool" "$MAPPING" \
    || fail "mapping does not document the '$tool' tool"
done

# --- Subagent dispatch documents both named types ----------------------------
grep -q '"general"' "$MAPPING" \
  || fail "mapping does not document the 'general' subagent type"
grep -q '"explore"' "$MAPPING" \
  || fail "mapping does not document the 'explore' subagent type"

# --- fork_context is documented ----------------------------------------------
grep -q 'fork_context' "$MAPPING" \
  || fail "mapping does not document the fork_context parameter"

# --- SKILL.md Platform Adaptation links the mapping --------------------------
grep -q "bob-tools.md" "$SKILL" \
  || fail "SKILL.md Platform Adaptation does not reference bob-tools.md"

echo "PASS: IBM Bob tool mapping valid (core tools, subagent dispatch, SKILL.md link)"
