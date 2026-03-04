#!/usr/bin/env bash
# Test: Plugin Bootstrap Behavior
# Verifies that the OpenCode plugin injects bootstrap content and degrades gracefully
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Plugin Bootstrap Behavior ==="

# Source setup to create isolated environment
source "$SCRIPT_DIR/setup.sh"

PLUGIN_FILE="$HOME/.config/opencode/superpowers/.opencode/plugins/superpowers.js"
USING_SKILL_PATH="$HOME/.config/opencode/superpowers/skills/using-superpowers/SKILL.md"

restore_missing_skill() {
  if [ -f "$USING_SKILL_PATH.bak" ]; then
    mv "$USING_SKILL_PATH.bak" "$USING_SKILL_PATH" 2>/dev/null || true
  fi
}

# Trap to cleanup on exit (restores missing skill file and cleans test env)
trap 'restore_missing_skill; cleanup_test_env' EXIT

if [ ! -f "$PLUGIN_FILE" ]; then
    echo "  [FAIL] Plugin file not found at $PLUGIN_FILE"
    exit 1
fi

# Helper: run a small Node snippet that exercises experimental.chat.system.transform
run_transform() {
    node --input-type=module <<'NODE'
import path from 'path';
import { pathToFileURL } from 'url';

const pluginPath = process.env.PLUGIN_FILE_PATH;
if (!pluginPath) {
  console.error('PLUGIN_FILE_PATH not set');
  process.exit(1);
}

const pluginUrl = pathToFileURL(pluginPath).href;
const { SuperpowersPlugin } = await import(pluginUrl);

// Provide a minimal fake client/directory; they are unused by current implementation
const plugin = await SuperpowersPlugin({ client: null, directory: null });

const input = {};
const output = {};

if (!plugin['experimental.chat.system.transform']) {
  console.error('transform hook missing');
  process.exit(1);
}

await plugin['experimental.chat.system.transform'](input, output);

const system = output.system || [];
const combined = system.join('\n');

if (process.env.SUPERPOWERS_OPENCODE_DISABLE_BOOTSTRAP === '1') {
  if (combined && combined.length > 0) {
    console.error('expected no bootstrap content when SUPERPOWERS_OPENCODE_DISABLE_BOOTSTRAP=1');
    process.exit(1);
  }

  process.exit(0);
}

if (process.env.EXPECT_DIAGNOSTIC === '1') {
  if (!combined.includes('proceed cautiously') || !combined.includes('using-superpowers')) {
    console.error('expected diagnostic message when using-superpowers is missing or unreadable');
    process.exit(1);
  }
} else {
  if (!combined.includes('You have superpowers.') || !combined.includes('Tool Mapping for OpenCode')) {
    console.error('expected normal bootstrap content with using-superpowers and tool mapping');
    process.exit(1);
  }
  // Guard against OpenCode renderer-specific crashes caused by fenced code blocks (e.g. ```dot)
  if (combined.includes('```') || combined.includes('digraph skill_flow')) {
    console.error('expected injected bootstrap content to have fenced code blocks stripped');
    process.exit(1);
  }
}

process.exit(0);
NODE
}

echo "Test 1: Normal bootstrap content when using-superpowers exists..."
export PLUGIN_FILE_PATH="$PLUGIN_FILE"
export EXPECT_DIAGNOSTIC="0"
run_transform
echo "  [PASS] Normal bootstrap content injected"

echo "Test 2: Diagnostic bootstrap when using-superpowers is missing..."
if [ ! -f "$USING_SKILL_PATH" ]; then
  echo "  [SKIP] using-superpowers skill not found in test environment; cannot verify missing-skill behavior"
else
  mv "$USING_SKILL_PATH" "$USING_SKILL_PATH.bak"

  export EXPECT_DIAGNOSTIC="1"
  if run_transform; then
    echo "  [PASS] Diagnostic message emitted when using-superpowers is missing"
  else
    echo "  [FAIL] Expected diagnostic message when using-superpowers is missing"
    mv "$USING_SKILL_PATH.bak" "$USING_SKILL_PATH"
    exit 1
  fi

  mv "$USING_SKILL_PATH.bak" "$USING_SKILL_PATH"
fi

echo "Test 3: Bootstrap is disabled when SUPERPOWERS_OPENCODE_DISABLE_BOOTSTRAP=1..."
export SUPERPOWERS_OPENCODE_DISABLE_BOOTSTRAP="1"
unset EXPECT_DIAGNOSTIC
if run_transform; then
  echo "  [PASS] No bootstrap content injected when disabled via env var"
else
  echo "  [FAIL] Expected no bootstrap content when SUPERPOWERS_OPENCODE_DISABLE_BOOTSTRAP=1"
  exit 1
fi
unset SUPERPOWERS_OPENCODE_DISABLE_BOOTSTRAP

echo ""
echo "=== Plugin bootstrap behavior tests passed ==="

