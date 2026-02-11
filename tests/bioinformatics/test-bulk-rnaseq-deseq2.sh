#!/usr/bin/env bash
# Test: bulk-rnaseq-deseq2 skill
# Verifies that the skill is loaded and teaches correct DESeq2 workflow
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/../claude-code/test-helpers.sh"

echo "=== Test: bulk-rnaseq-deseq2 skill ==="
echo ""

# Test 1: Skill is recognized
echo "Test 1: Skill loading..."

output=$(run_claude "What is the bulk-rnaseq-deseq2 skill? Describe its key steps briefly." 30)

if assert_contains "$output" "DESeq2\|deseq2\|differential expression" "Skill is recognized"; then
    :
else
    exit 1
fi

echo ""

# Test 2: Pre-filtering before DESeq()
echo "Test 2: Pre-filtering order..."

output=$(run_claude "According to the bulk-rnaseq-deseq2 skill, when should you pre-filter low-count genes — before or after running DESeq()? What function is used?" 30)

if assert_contains "$output" "before\|prior\|first" "Pre-filter before DESeq"; then
    :
else
    exit 1
fi

if assert_contains "$output" "rowSums" "Uses rowSums for filtering"; then
    :
else
    exit 1
fi

echo ""

# Test 3: VST/rlog before PCA
echo "Test 3: Transformation before PCA..."

output=$(run_claude "In the bulk-rnaseq-deseq2 skill, what must you do before running plotPCA? Why can't you use raw counts?" 30)

if assert_contains "$output" "vst\|VST\|rlog" "Requires VST or rlog"; then
    :
else
    exit 1
fi

if assert_order "$output" "vst\|VST\|rlog" "plotPCA\|PCA" "Transformation before PCA"; then
    :
else
    exit 1
fi

echo ""

# Test 4: Export preserves gene names
echo "Test 4: Export pattern..."

output=$(run_claude "How does the bulk-rnaseq-deseq2 skill recommend exporting DESeq2 results? How are gene names preserved?" 30)

if assert_contains "$output" "tibble\|rownames" "Uses tibble with rownames"; then
    :
else
    exit 1
fi

echo ""

# Test 5: Shrinkage is optional
echo "Test 5: Shrinkage optionality..."

output=$(run_claude "Is log fold change shrinkage required or optional in the bulk-rnaseq-deseq2 skill? When is it recommended?" 30)

if assert_contains "$output" "optional\|recommended\|not required" "Shrinkage is optional"; then
    :
else
    exit 1
fi

echo ""

# Test 6: Volcano plot cross-reference
echo "Test 6: Volcano plot cross-reference..."

output=$(run_claude "What skill does bulk-rnaseq-deseq2 reference for visualization? What is the exact skill name?" 30)

if assert_contains "$output" "volcano-plots-enhancedvolcano\|EnhancedVolcano" "References volcano skill"; then
    :
else
    exit 1
fi

echo ""

# Test 7: Raw counts requirement
echo "Test 7: Raw counts input..."

output=$(run_claude "What type of input does DESeq2 require according to the bulk-rnaseq-deseq2 skill? Can you use normalized counts or TPM?" 30)

if assert_contains "$output" "raw.*count\|unnormalized\|integer" "Requires raw counts"; then
    :
else
    exit 1
fi

if assert_contains "$output" "not.*normalized\|not.*TPM\|never.*normalized\|avoid.*normalized\|no.*TPM\|no.*normalized" "Warns against normalized input"; then
    :
else
    exit 1
fi

echo ""

echo "=== All bulk-rnaseq-deseq2 skill tests passed ==="
