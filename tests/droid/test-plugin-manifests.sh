#!/usr/bin/env bash
# Test: Factory Droid plugin manifest files
# Verifies .factory-plugin/ directory structure and JSON validity
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: Plugin Manifest Files ==="
echo ""

FAILED=0

# Test 1: .factory-plugin directory exists
echo "Test 1: Plugin directory structure..."
assert_dir_exists "$REPO_ROOT/.factory-plugin" ".factory-plugin/ directory exists" || FAILED=$((FAILED + 1))
echo ""

# Test 2: plugin.json exists and is valid JSON
echo "Test 2: plugin.json validity..."
assert_file_exists "$REPO_ROOT/.factory-plugin/plugin.json" "plugin.json exists" || FAILED=$((FAILED + 1))
assert_valid_json "$REPO_ROOT/.factory-plugin/plugin.json" "plugin.json is valid JSON" || FAILED=$((FAILED + 1))
echo ""

# Test 3: plugin.json required fields
echo "Test 3: plugin.json required fields..."
assert_json_field "$REPO_ROOT/.factory-plugin/plugin.json" "name" "superpowers" "name = superpowers" || FAILED=$((FAILED + 1))
assert_json_field "$REPO_ROOT/.factory-plugin/plugin.json" "version" "4.3.1" "version present" || FAILED=$((FAILED + 1))

# Verify description is non-empty
desc=$(python3 -c "import json; print(json.load(open('$REPO_ROOT/.factory-plugin/plugin.json')).get('description', ''))" 2>/dev/null)
if [ -n "$desc" ]; then
    echo "  [PASS] description is non-empty"
else
    echo "  [FAIL] description is empty"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 4: marketplace.json exists and is valid JSON
echo "Test 4: marketplace.json validity..."
assert_file_exists "$REPO_ROOT/.factory-plugin/marketplace.json" "marketplace.json exists" || FAILED=$((FAILED + 1))
assert_valid_json "$REPO_ROOT/.factory-plugin/marketplace.json" "marketplace.json is valid JSON" || FAILED=$((FAILED + 1))
echo ""

# Test 5: marketplace.json structure
echo "Test 5: marketplace.json structure..."
assert_json_field "$REPO_ROOT/.factory-plugin/marketplace.json" "name" "superpowers" "marketplace name = superpowers" || FAILED=$((FAILED + 1))

# Verify plugins array exists and has at least one entry
plugin_count=$(python3 -c "import json; print(len(json.load(open('$REPO_ROOT/.factory-plugin/marketplace.json')).get('plugins', [])))" 2>/dev/null)
if [ "$plugin_count" -ge 1 ]; then
    echo "  [PASS] plugins array has $plugin_count entry(ies)"
else
    echo "  [FAIL] plugins array is empty or missing"
    FAILED=$((FAILED + 1))
fi

# Verify first plugin name matches
assert_json_field "$REPO_ROOT/.factory-plugin/marketplace.json" "plugins.0.name" "superpowers" "first plugin name = superpowers" || FAILED=$((FAILED + 1))
echo ""

# Test 6: Version consistency between plugin.json and marketplace.json
echo "Test 6: Version consistency..."
plugin_version=$(python3 -c "import json; print(json.load(open('$REPO_ROOT/.factory-plugin/plugin.json'))['version'])" 2>/dev/null)
marketplace_version=$(python3 -c "import json; print(json.load(open('$REPO_ROOT/.factory-plugin/marketplace.json'))['plugins'][0]['version'])" 2>/dev/null)

if [ "$plugin_version" = "$marketplace_version" ]; then
    echo "  [PASS] Versions match: $plugin_version"
else
    echo "  [FAIL] Version mismatch: plugin.json=$plugin_version, marketplace.json=$marketplace_version"
    FAILED=$((FAILED + 1))
fi
echo ""

# Test 7: Consistency with .claude-plugin
echo "Test 7: Consistency with .claude-plugin..."
if [ -f "$REPO_ROOT/.claude-plugin/plugin.json" ]; then
    claude_version=$(python3 -c "import json; print(json.load(open('$REPO_ROOT/.claude-plugin/plugin.json'))['version'])" 2>/dev/null)
    if [ "$plugin_version" = "$claude_version" ]; then
        echo "  [PASS] Factory version matches Claude Code version: $plugin_version"
    else
        echo "  [FAIL] Version mismatch with .claude-plugin: factory=$plugin_version, claude=$claude_version"
        FAILED=$((FAILED + 1))
    fi
else
    echo "  [SKIP] .claude-plugin/plugin.json not found"
fi
echo ""

# Summary
if [ $FAILED -eq 0 ]; then
    echo "=== All plugin manifest tests passed ==="
    exit 0
else
    echo "=== FAILED: $FAILED test(s) ==="
    exit 1
fi
