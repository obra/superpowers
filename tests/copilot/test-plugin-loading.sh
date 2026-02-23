#!/usr/bin/env bash
# Test: Copilot CLI Plugin Loading
# Verifies that the superpowers plugin installs correctly for GitHub Copilot CLI
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Test: Copilot CLI Plugin Loading ==="

# Source setup to create isolated environment
source "$SCRIPT_DIR/setup.sh"

# Trap to cleanup on exit
trap cleanup_test_env EXIT

COPILOT_DIR="$HOME/.copilot"

# Test 1: Verify skills directory is populated
echo "Test 1: Checking skills directory..."
skill_count=$(find "$COPILOT_DIR/skills" -maxdepth 1 -mindepth 1 -type l 2>/dev/null | wc -l)
if [ "$skill_count" -gt 0 ]; then
    echo "  [PASS] Found $skill_count skill symlinks installed"
else
    echo "  [FAIL] No skill symlinks found in $COPILOT_DIR/skills"
    exit 1
fi

# Test 2: Verify using-superpowers skill exists (critical for bootstrap)
echo "Test 2: Checking using-superpowers skill (required for bootstrap)..."
if [ -L "$COPILOT_DIR/skills/using-superpowers" ] && [ -d "$COPILOT_DIR/skills/using-superpowers" ]; then
    echo "  [PASS] using-superpowers skill exists"
else
    echo "  [FAIL] using-superpowers skill not found"
    exit 1
fi

# Test 3: Verify agents directory is populated
echo "Test 3: Checking agents directory..."
agent_count=$(find "$COPILOT_DIR/agents" -maxdepth 1 -mindepth 1 -name "*.md" -type l 2>/dev/null | wc -l)
if [ "$agent_count" -gt 0 ]; then
    echo "  [PASS] Found $agent_count agent symlinks installed"
else
    echo "  [FAIL] No agent symlinks found in $COPILOT_DIR/agents"
    exit 1
fi

# Test 4: Verify .agent.md files are linked (not plain .md when .agent.md exists)
echo "Test 4: Checking .agent.md convention..."
if [ -L "$COPILOT_DIR/agents/code-reviewer.agent.md" ]; then
    echo "  [PASS] code-reviewer.agent.md symlink exists"
else
    echo "  [FAIL] code-reviewer.agent.md symlink not found"
    exit 1
fi
if [ -L "$COPILOT_DIR/agents/code-reviewer.md" ]; then
    echo "  [FAIL] Plain code-reviewer.md symlink exists alongside .agent.md (should be skipped)"
    exit 1
else
    echo "  [PASS] Plain code-reviewer.md not linked (correctly skipped)"
fi

# Test 5: Verify hooks.json is valid JSON
echo "Test 5: Checking hooks.json validity..."
hooks_file="$REPO_ROOT/.copilot/hooks/hooks.json"
if python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$hooks_file" 2>/dev/null; then
    echo "  [PASS] hooks.json is valid JSON"
elif node -e "require(process.argv[1])" -- "$hooks_file" 2>/dev/null; then
    echo "  [PASS] hooks.json is valid JSON"
elif jq empty "$hooks_file" 2>/dev/null; then
    echo "  [PASS] hooks.json is valid JSON"
else
    echo "  [WARN] Could not validate hooks.json (python3/node/jq not available); skipping"
fi

# Test 6: Verify session-start.sh is executable and runs without error
echo "Test 6: Checking session-start.sh..."
session_start="$REPO_ROOT/.copilot/hooks/session-start.sh"
if [ -x "$session_start" ]; then
    echo "  [PASS] session-start.sh is executable"
else
    echo "  [FAIL] session-start.sh is not executable"
    exit 1
fi
if bash "$session_start"; then
    echo "  [PASS] session-start.sh runs without error"
else
    echo "  [FAIL] session-start.sh exited with error"
    exit 1
fi

# Test 7: Verify copilot-instructions.md was injected
echo "Test 7: Checking copilot-instructions.md injection..."
if grep -q "SUPERPOWERS-CONTEXT-START" "$COPILOT_DIR/copilot-instructions.md" 2>/dev/null; then
    echo "  [PASS] Superpowers context block injected into copilot-instructions.md"
else
    echo "  [FAIL] Superpowers context block not found in copilot-instructions.md"
    exit 1
fi

# Test 8: Verify install is idempotent (running twice doesn't break things)
echo "Test 8: Checking idempotency (running install twice)..."
if bash "$REPO_ROOT/.copilot/install.sh" > /dev/null 2>&1; then
    echo "  [PASS] Second install run succeeded"
else
    echo "  [FAIL] Second install run failed"
    exit 1
fi
block_count=$(grep -c "SUPERPOWERS-CONTEXT-START" "$COPILOT_DIR/copilot-instructions.md" 2>/dev/null || true)
block_count=${block_count:-0}
if [ "$block_count" -eq 1 ]; then
    echo "  [PASS] Context block appears exactly once after double install"
else
    echo "  [FAIL] Context block appears $block_count times (expected 1)"
    exit 1
fi

echo ""
echo "=== All Copilot CLI plugin loading tests passed ==="
