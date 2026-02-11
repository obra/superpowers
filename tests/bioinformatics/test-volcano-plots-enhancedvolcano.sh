#!/usr/bin/env bash
# Test: volcano-plots-enhancedvolcano skill
# Verifies correct column mapping and usage patterns
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/../claude-code/test-helpers.sh"

echo "=== Test: volcano-plots-enhancedvolcano skill ==="
echo ""

# Test 1: Skill is recognized
echo "Test 1: Skill loading..."

output=$(run_claude "What is the volcano-plots-enhancedvolcano skill? Describe what it covers." 30)

if assert_contains "$output" "EnhancedVolcano\|volcano" "Skill is recognized"; then
    :
else
    exit 1
fi

echo ""

# Test 2: DESeq2 column mapping
echo "Test 2: DESeq2 column mapping..."

output=$(run_claude "According to the volcano-plots-enhancedvolcano skill, what are the correct column names to use from DESeq2 results for the x and y axes?" 30)

if assert_contains "$output" "log2FoldChange" "Correct DESeq2 x column"; then
    :
else
    exit 1
fi

if assert_contains "$output" "padj" "Correct DESeq2 y column"; then
    :
else
    exit 1
fi

echo ""

# Test 3: Seurat column mapping
echo "Test 3: Seurat column mapping..."

output=$(run_claude "According to the volcano-plots-enhancedvolcano skill, what are the correct column names to use from Seurat FindMarkers results for the x and y axes?" 30)

if assert_contains "$output" "avg_log2FC" "Correct Seurat x column"; then
    :
else
    exit 1
fi

if assert_contains "$output" "p_val_adj" "Correct Seurat y column"; then
    :
else
    exit 1
fi

echo ""

# Test 4: Rownames conversion warning
echo "Test 4: Rownames conversion..."

output=$(run_claude "What does the volcano-plots-enhancedvolcano skill say about rownames when preparing data for EnhancedVolcano? What problem can occur?" 30)

if assert_contains "$output" "rownames\|row.names\|row names" "Mentions rownames issue"; then
    :
else
    exit 1
fi

echo ""

# Test 5: Common customizations
echo "Test 5: Customization options..."

output=$(run_claude "What customization options does the volcano-plots-enhancedvolcano skill cover? List the key parameters." 30)

if assert_contains "$output" "pCutoff\|FCcutoff\|selectLab\|drawConnectors" "Covers key customizations"; then
    :
else
    exit 1
fi

echo ""

# Test 6: Adjusted vs raw p-value warning
echo "Test 6: P-value warning..."

output=$(run_claude "Does the volcano-plots-enhancedvolcano skill warn about using raw vs adjusted p-values?" 30)

if assert_contains "$output" "adjusted\|padj\|p_val_adj\|raw" "Warns about p-value type"; then
    :
else
    exit 1
fi

echo ""

echo "=== All volcano-plots-enhancedvolcano skill tests passed ==="
