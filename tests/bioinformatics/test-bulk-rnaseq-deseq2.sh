#!/usr/bin/env bash
# Test: bulk-rnaseq-deseq2 skill
# Verifies that the skill is loaded and teaches correct DESeq2 workflow
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

echo "=== Test: bulk-rnaseq-deseq2 skill ==="
echo ""

# Test 1: Skill is recognized
echo "Test 1: Skill loading..."

output=$(run_skill_claude "What is the bulk-rnaseq-deseq2 skill? Describe its key steps briefly." 60)

if assert_contains "$output" "DESeq2\|deseq2\|differential expression" "Skill is recognized"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

echo ""

# Test 2: Pre-filtering before DESeq()
echo "Test 2: Pre-filtering order..."

output=$(run_skill_claude "According to the bulk-rnaseq-deseq2 skill, when should you pre-filter low-count genes — before or after running DESeq()? What function is used?" 60)

if assert_contains "$output" "before\|prior\|first" "Pre-filter before DESeq"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

if assert_contains "$output" "rowSums" "Uses rowSums for filtering"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

echo ""

# Test 3: VST/rlog before PCA
echo "Test 3: Transformation before PCA..."

output=$(run_skill_claude "In the bulk-rnaseq-deseq2 skill, what must you do before running plotPCA? Why can't you use raw counts?" 60)

if assert_contains "$output" "vst\|VST\|rlog\|variance.stabili" "Requires VST or rlog"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

echo ""

# Test 4: Export preserves gene names
echo "Test 4: Export pattern..."

output=$(run_skill_claude "How does the bulk-rnaseq-deseq2 skill recommend exporting DESeq2 results? How are gene names preserved?" 60)

if assert_contains "$output" "tibble\|rownames" "Uses tibble with rownames"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

echo ""

# Test 5: Shrinkage is optional
echo "Test 5: Shrinkage optionality..."

output=$(run_skill_claude "Is log fold change shrinkage required or optional in the bulk-rnaseq-deseq2 skill? When is it recommended?" 60)

if assert_contains "$output" "optional\|recommended\|not required" "Shrinkage is optional"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

echo ""

# Test 6: Volcano plot cross-reference
echo "Test 6: Volcano plot cross-reference..."

output=$(run_skill_claude "What skill does bulk-rnaseq-deseq2 reference for visualization? What is the exact skill name?" 60)

if assert_contains "$output" "volcano-plots-enhancedvolcano\|EnhancedVolcano" "References volcano skill"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

echo ""

# Test 7: Raw counts requirement
echo "Test 7: Raw counts input..."

output=$(run_skill_claude "What type of input does DESeq2 require according to the bulk-rnaseq-deseq2 skill? Can you use normalized counts or TPM?" 60)

if assert_contains "$output" "raw.*count\|unnormalized\|integer" "Requires raw counts"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

if assert_contains "$output" "not.*normalized\|not.*TPM\|never.*normalized\|avoid.*normalized\|no.*TPM\|no.*normalized\|don.*normalized\|shouldn.*normalized" "Warns against normalized input"; then
    PASS=$((PASS + 1))
else
    FAIL=$((FAIL + 1))
fi

echo ""

echo "=== bulk-rnaseq-deseq2: $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ] || exit 1
