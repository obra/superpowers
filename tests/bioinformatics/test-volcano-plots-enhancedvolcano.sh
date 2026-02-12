#!/usr/bin/env bash
# Test: volcano-plots-enhancedvolcano skill
# Verifies correct column mapping and usage patterns
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/../claude-code/test-helpers.sh"

# Create symlink to handle spaces in path (OneDrive, iCloud, etc.)
PLUGIN_DIR="/tmp/superpowers-test-link"
ln -sfn "$REPO_DIR" "$PLUGIN_DIR"

# Override run_claude to include --plugin-dir so skills are discoverable
# Always returns 0 — assertions check content, not exit codes
run_skill_claude() {
    local prompt="$1"
    local timeout_secs="${2:-60}"
    local output_file
    output_file=$(mktemp)

    timeout "$timeout_secs" claude -p "$prompt" \
        --plugin-dir "$PLUGIN_DIR" \
        --max-turns 3 \
        < /dev/null > "$output_file" 2>&1 || true

    cat "$output_file"
    rm -f "$output_file"
    return 0
}

PASS=0
FAIL=0

echo "=== Test: volcano-plots-enhancedvolcano skill ==="
echo ""

# Test 1: Skill is recognized
echo "Test 1: Skill loading..."

output=$(run_skill_claude "What is the volcano-plots-enhancedvolcano skill? Describe what it covers." 60)

if assert_contains "$output" "EnhancedVolcano\|volcano" "Skill is recognized"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

echo ""

# Test 2: DESeq2 column mapping
echo "Test 2: DESeq2 column mapping..."

output=$(run_skill_claude "According to the volcano-plots-enhancedvolcano skill, what are the correct column names to use from DESeq2 results for the x and y axes?" 60)

if assert_contains "$output" "log2FoldChange" "Correct DESeq2 x column"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

if assert_contains "$output" "padj" "Correct DESeq2 y column"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

echo ""

# Test 3: Seurat column mapping
echo "Test 3: Seurat column mapping..."

output=$(run_skill_claude "According to the volcano-plots-enhancedvolcano skill, what are the correct column names to use from Seurat FindMarkers results for the x and y axes?" 60)

if assert_contains "$output" "avg_log2FC" "Correct Seurat x column"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

if assert_contains "$output" "p_val_adj" "Correct Seurat y column"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

echo ""

# Test 4: Rownames conversion warning
echo "Test 4: Rownames conversion..."

output=$(run_skill_claude "What does the volcano-plots-enhancedvolcano skill say about rownames when preparing data for EnhancedVolcano? What problem can occur?" 60)

if assert_contains "$output" "rownames\|row.names\|row names\|rowname" "Mentions rownames issue"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

echo ""

# Test 5: Common customizations
echo "Test 5: Customization options..."

output=$(run_skill_claude "What customization options does the volcano-plots-enhancedvolcano skill cover? List the key parameters." 60)

if assert_contains "$output" "pCutoff\|FCcutoff\|selectLab\|drawConnectors" "Covers key customizations"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

echo ""

# Test 6: Adjusted vs raw p-value warning
echo "Test 6: P-value warning..."

output=$(run_skill_claude "Does the volcano-plots-enhancedvolcano skill warn about using raw vs adjusted p-values?" 60)

if assert_contains "$output" "adjusted\|padj\|p_val_adj\|raw" "Warns about p-value type"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

echo ""

echo "=== volcano-plots-enhancedvolcano: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] || exit 1
