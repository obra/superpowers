#!/usr/bin/env bash
# Test: scrna-seq-seurat skill
# Verifies that the skill is loaded and teaches correct Seurat workflow
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/../claude-code/test-helpers.sh"

echo "=== Test: scrna-seq-seurat skill ==="
echo ""

# Test 1: Skill is recognized
echo "Test 1: Skill loading..."

output=$(run_claude "What is the scrna-seq-seurat skill? Describe its key steps briefly." 30)

if assert_contains "$output" "Seurat\|seurat\|single.cell\|scRNA" "Skill is recognized"; then
    :
else
    exit 1
fi

echo ""

# Test 2: QC filtering with mitochondrial percentage
echo "Test 2: QC metrics..."

output=$(run_claude "According to the scrna-seq-seurat skill, what QC metrics should you calculate before filtering? How do you get mitochondrial percentage?" 30)

if assert_contains "$output" "PercentageFeatureSet\|percent.mt\|mitochond" "Mentions mitochondrial QC"; then
    :
else
    exit 1
fi

if assert_contains "$output" "MT-\|mt-\|^MT" "Mentions MT gene pattern"; then
    :
else
    exit 1
fi

echo ""

# Test 3: Inspect distributions before filtering
echo "Test 3: Visual QC before filtering..."

output=$(run_claude "In the scrna-seq-seurat skill, should you set QC thresholds blindly or inspect the data first? How?" 30)

if assert_contains "$output" "VlnPlot\|violin\|inspect\|visualiz\|distribut" "Inspect distributions first"; then
    :
else
    exit 1
fi

echo ""

# Test 4: ElbowPlot for PC selection
echo "Test 4: PC selection..."

output=$(run_claude "How does the scrna-seq-seurat skill recommend choosing the number of PCs for clustering?" 30)

if assert_contains "$output" "ElbowPlot\|elbow" "Uses ElbowPlot"; then
    :
else
    exit 1
fi

echo ""

# Test 5: Resolution parameter
echo "Test 5: Clustering resolution..."

output=$(run_claude "What does the scrna-seq-seurat skill say about choosing the resolution parameter for FindClusters?" 30)

if assert_contains "$output" "resolution\|Resolution" "Discusses resolution"; then
    :
else
    exit 1
fi

echo ""

# Test 6: Visualization alternatives
echo "Test 6: Visualization recommendations..."

output=$(run_claude "What visualization alternatives does the scrna-seq-seurat skill recommend beyond the default Seurat DimPlot?" 30)

if assert_contains "$output" "SCPubr\|scpubr" "Mentions SCPubr"; then
    :
else
    exit 1
fi

if assert_contains "$output" "BadranSeq\|badranseq" "Mentions BadranSeq"; then
    :
else
    exit 1
fi

echo ""

# Test 7: SCTransform preference
echo "Test 7: Normalization preference..."

output=$(run_claude "What normalization method does the scrna-seq-seurat skill recommend as preferred? What is the alternative?" 30)

if assert_contains "$output" "SCTransform\|sctransform" "Recommends SCTransform"; then
    :
else
    exit 1
fi

echo ""

# Test 8: Volcano plot cross-reference
echo "Test 8: Volcano plot cross-reference..."

output=$(run_claude "What skill does scrna-seq-seurat reference for volcano plot visualization?" 30)

if assert_contains "$output" "volcano-plots-enhancedvolcano\|EnhancedVolcano" "References volcano skill"; then
    :
else
    exit 1
fi

echo ""

echo "=== All scrna-seq-seurat skill tests passed ==="
