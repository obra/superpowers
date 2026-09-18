#!/usr/bin/env bash
# Test: V2 Skill Registration Contract (#2106 review)
# Verifies setup() registers skills matching OpenCode 2.0.4's Skill.Info
# schema (path field, no stale location/slash) and contains per-skill
# draft.add() failures instead of aborting registration.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: V2 Skill Registration Contract ==="

source "$SCRIPT_DIR/setup.sh"
trap cleanup_test_env EXIT

node "$SCRIPT_DIR/test-skill-registration.mjs" "$SUPERPOWERS_PLUGIN_FILE"
node "$SCRIPT_DIR/test-skill-registration.mjs" "$OPENCODE_CONFIG_DIR/plugins/superpowers.js"

echo "  [PASS] Skill payloads match the 2.0.4 Skill.Info contract"
echo "  [PASS] A rejected draft.add() skips one skill without aborting the rest"
echo "  [PASS] Quoted and multi-line frontmatter values register unquoted"
echo ""
echo "=== All skill registration tests passed ==="
