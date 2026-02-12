#!/usr/bin/env bash
# Test: scrna-seq-seurat skill
# Verifies that the skill is loaded and teaches correct Seurat workflow
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

echo "=== Test: scrna-seq-seurat skill ==="
echo ""

# Test 1: Skill is recognized
echo "Test 1: Skill loading..."

output=$(run_skill_claude "What is the scrna-seq-seurat skill? Describe its key steps briefly." 60)

if assert_contains "$output" "Seurat\|seurat\|single.cell\|scRNA" "Skill is recognized"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

echo ""

# Test 2: QC filtering with mitochondrial percentage
echo "Test 2: QC metrics..."

output=$(run_skill_claude "According to the scrna-seq-seurat skill, what QC metrics should you calculate before filtering? How do you get mitochondrial percentage?" 60)

if assert_contains "$output" "PercentageFeatureSet\|percent.mt\|mitochond" "Mentions mitochondrial QC"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

if assert_contains "$output" "MT-\|mt-\|^MT" "Mentions MT gene pattern"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

echo ""

# Test 3: Inspect distributions before filtering
echo "Test 3: Visual QC before filtering..."

output=$(run_skill_claude "In the scrna-seq-seurat skill, should you set QC thresholds blindly or inspect the data first? How?" 60)

if assert_contains "$output" "VlnPlot\|violin\|inspect\|visualiz\|distribut" "Inspect distributions first"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

echo ""

# Test 4: ElbowPlot for PC selection
echo "Test 4: PC selection..."

output=$(run_skill_claude "How does the scrna-seq-seurat skill recommend choosing the number of PCs for clustering?" 60)

if assert_contains "$output" "ElbowPlot\|elbow" "Uses ElbowPlot"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

echo ""

# Test 5: Resolution parameter
echo "Test 5: Clustering resolution..."

output=$(run_skill_claude "What does the scrna-seq-seurat skill say about choosing the resolution parameter for FindClusters?" 60)

if assert_contains "$output" "resolution\|Resolution" "Discusses resolution"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

echo ""

# Test 6: Visualization alternatives
echo "Test 6: Visualization recommendations..."

output=$(run_skill_claude "What visualization alternatives does the scrna-seq-seurat skill recommend beyond the default Seurat DimPlot?" 60)

if assert_contains "$output" "SCPubr\|scpubr" "Mentions SCPubr"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

if assert_contains "$output" "BadranSeq\|badranseq\|BadranSeq" "Mentions BadranSeq"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

echo ""

# Test 7: SCTransform preference
echo "Test 7: Normalization preference..."

output=$(run_skill_claude "What normalization method does the scrna-seq-seurat skill recommend as preferred? What is the alternative?" 60)

if assert_contains "$output" "SCTransform\|sctransform" "Recommends SCTransform"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

echo ""

# Test 8: Volcano plot cross-reference
echo "Test 8: Volcano plot cross-reference..."

output=$(run_skill_claude "What skill does scrna-seq-seurat reference for volcano plot visualization?" 60)

if assert_contains "$output" "volcano-plots-enhancedvolcano\|EnhancedVolcano" "References volcano skill"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

echo ""

echo "=== scrna-seq-seurat: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] || exit 1
