#!/usr/bin/env bash
# Validate the Antigravity tool mapping. The companion plugin-install test
# covers the root manifest and always-on bootstrap rule. This test checks
# subagent dispatch via invoke_subagent (self/research types), task tracking via
# a task artifact, and SKILL.md pointing at the mapping.
#
# Mirrors tests/pi/test-pi-extension.mjs's "tools reference documents
# harness-specific mappings" check. CI-safe: does not require `agy` installed.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

MAPPING="$REPO_ROOT/skills/using-superpowers/references/antigravity-tools.md"
SKILL="$REPO_ROOT/skills/using-superpowers/SKILL.md"

fail() { echo "FAIL: $*" >&2; exit 1; }

echo "test-antigravity-tools: checking Antigravity tool mapping"

# --- Mapping exists ---------------------------------------------------------
[ -f "$MAPPING" ] || fail "tool mapping missing at $MAPPING"

# --- Core action→tool mappings are documented -------------------------------
for tool in write_to_file replace_file_content invoke_subagent; do
  grep -q "$tool" "$MAPPING" \
    || fail "mapping does not document the '$tool' tool"
done

# --- Subagents use the built-in self/research types -------------------------
grep -q '`self`' "$MAPPING" \
  || fail "mapping does not document the built-in 'self' subagent type"
grep -q '`research`' "$MAPPING" \
  || fail "mapping does not document the built-in 'research' subagent type"

# --- Task tracking documents the 'task' artifact mechanism ------------------
grep -qE '^\| Task tracking .*\|.*task artifact.*\|$' "$MAPPING" \
  || fail "mapping does not document task tracking as a 'task' artifact"

# --- SKILL.md Platform Adaptation links the mapping -------------------------
grep -q "antigravity-tools.md" "$SKILL" \
  || fail "SKILL.md Platform Adaptation does not reference antigravity-tools.md"

echo "PASS: Antigravity tool mapping valid (subagent dispatch, task artifact, SKILL.md link)"
