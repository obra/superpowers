#!/usr/bin/env bash
# Test: Plugin Loading
# Verifies that the superpowers plugin loads correctly in OpenCode
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Plugin Loading ==="

# Source setup to create isolated environment
source "$SCRIPT_DIR/setup.sh"

# Trap to cleanup on exit
trap cleanup_test_env EXIT

# Test 1: Verify plugin file exists and is registered
echo "Test 1: Checking plugin registration..."
if [ -L "$HOME/.config/opencode/plugins/superpowers.js" ]; then
    echo "  [PASS] Plugin symlink exists"
else
    echo "  [FAIL] Plugin symlink not found at $HOME/.config/opencode/plugins/superpowers.js"
    exit 1
fi

# Verify symlink target exists
if [ -f "$(readlink -f "$HOME/.config/opencode/plugins/superpowers.js")" ]; then
    echo "  [PASS] Plugin symlink target exists"
else
    echo "  [FAIL] Plugin symlink target does not exist"
    exit 1
fi

# Test 2: Verify lib/skills-core.js is in place
echo "Test 2: Checking skills-core.js..."
if [ -f "$HOME/.config/opencode/superpowers/lib/skills-core.js" ]; then
    echo "  [PASS] skills-core.js exists"
else
    echo "  [FAIL] skills-core.js not found"
    exit 1
fi

# Test 3: Verify skills directory is populated
echo "Test 3: Checking skills directory..."
skill_count=$(find "$HOME/.config/opencode/superpowers/skills" -name "SKILL.md" | wc -l)
if [ "$skill_count" -gt 0 ]; then
    echo "  [PASS] Found $skill_count skills installed"
else
    echo "  [FAIL] No skills found in installed location"
    exit 1
fi

# Test 4: Check using-superpowers skill exists (critical for bootstrap)
echo "Test 4: Checking using-superpowers skill (required for bootstrap)..."
if [ -f "$HOME/.config/opencode/superpowers/skills/using-superpowers/SKILL.md" ]; then
    echo "  [PASS] using-superpowers skill exists"
else
    echo "  [FAIL] using-superpowers skill not found (required for bootstrap)"
    exit 1
fi

# Test 5: Verify plugin JavaScript syntax (basic check)
echo "Test 5: Checking plugin JavaScript syntax..."
plugin_file="$HOME/.config/opencode/superpowers/.opencode/plugins/superpowers.js"
if node --check "$plugin_file" 2>/dev/null; then
    echo "  [PASS] Plugin JavaScript syntax is valid"
else
    echo "  [FAIL] Plugin has JavaScript syntax errors"
    exit 1
fi

# Test 6: Verify personal test skill was created
echo "Test 6: Checking test fixtures..."
if [ -f "$HOME/.config/opencode/skills/personal-test/SKILL.md" ]; then
    echo "  [PASS] Personal test skill fixture created"
else
    echo "  [FAIL] Personal test skill fixture not found"
    exit 1
fi

# Test 7: Verify superpowers.jsonc is scaffolded and drives agent config
echo "Test 7: Checking superpowers.jsonc scaffolding and config merge..."
superpowers_config="$HOME/.config/opencode/superpowers.jsonc"

if [ -f "$superpowers_config" ]; then
    echo "  [FAIL] superpowers.jsonc should not exist before plugin initialization"
    exit 1
fi

node_output=$(node --input-type=module <<'EOF'
import path from 'path';
import { pathToFileURL } from 'url';
import fs from 'fs';

const pluginPath = path.join(process.env.HOME, '.config/opencode/superpowers/.opencode/plugins/superpowers.js');
const { SuperpowersPlugin } = await import(pathToFileURL(pluginPath).href);
const plugin = await SuperpowersPlugin({ client: {}, directory: process.cwd() });

const initialConfig = {};
await plugin.config(initialConfig);

const scaffoldPath = path.join(process.env.HOME, '.config/opencode/superpowers.jsonc');
const scaffoldExists = fs.existsSync(scaffoldPath);
const scaffoldContent = scaffoldExists ? fs.readFileSync(scaffoldPath, 'utf8') : '';

fs.writeFileSync(
  scaffoldPath,
  `{
  // Override default subagent models here.
  "agent": {
    "implementer-sp": { "model": "anthropic/claude-haiku-4-5" },
    "spec-reviewer-sp": { "model": "anthropic/claude-sonnet-4-5" },
    "code-reviewer-sp": { "model": "anthropic/claude-opus-4-1" }
  }
}
`
);

const overriddenConfig = {};
await plugin.config(overriddenConfig);

console.log(JSON.stringify({
  scaffoldExists,
  scaffoldContent,
  initialModel: initialConfig.agent?.['implementer-sp']?.model,
  overrideModel: overriddenConfig.agent?.['implementer-sp']?.model,
  overrideSpecModel: overriddenConfig.agent?.['spec-reviewer-sp']?.model,
  overrideCodeModel: overriddenConfig.agent?.['code-reviewer-sp']?.model,
  overridePromptPresent: Boolean(overriddenConfig.agent?.['implementer-sp']?.prompt)
}));
EOF
)

if echo "$node_output" | grep -q '"scaffoldExists":true'; then
    echo "  [PASS] superpowers.jsonc was scaffolded on first config hook run"
else
    echo "  [FAIL] superpowers.jsonc was not scaffolded"
    echo "  Output: $node_output"
    exit 1
fi

if echo "$node_output" | grep -q 'anthropic/claude-sonnet-4-6'; then
    echo "  [PASS] Scaffolded config includes agent defaults"
else
    echo "  [FAIL] Scaffolded config missing agent defaults"
    echo "  Output: $node_output"
    exit 1
fi

if echo "$node_output" | grep -q '"overrideModel":"anthropic/claude-haiku-4-5"'; then
    echo "  [PASS] implementer model is loaded from superpowers.jsonc"
else
    echo "  [FAIL] implementer model was not loaded from superpowers.jsonc"
    echo "  Output: $node_output"
    exit 1
fi

if echo "$node_output" | grep -q '"overrideSpecModel":"anthropic/claude-sonnet-4-5"'; then
    echo "  [PASS] spec reviewer model is loaded from superpowers.jsonc"
else
    echo "  [FAIL] spec reviewer model was not loaded from superpowers.jsonc"
    echo "  Output: $node_output"
    exit 1
fi

if echo "$node_output" | grep -q '"overrideCodeModel":"anthropic/claude-opus-4-1"'; then
    echo "  [PASS] code reviewer model is loaded from superpowers.jsonc"
else
    echo "  [FAIL] code reviewer model was not loaded from superpowers.jsonc"
    echo "  Output: $node_output"
    exit 1
fi

if echo "$node_output" | grep -q '"overridePromptPresent":true'; then
    echo "  [PASS] plugin still injects agent prompts after config merge"
else
    echo "  [FAIL] agent prompt was lost after config merge"
    echo "  Output: $node_output"
    exit 1
fi

echo ""
echo "=== All plugin loading tests passed ==="
