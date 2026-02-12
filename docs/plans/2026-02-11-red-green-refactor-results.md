# RED-GREEN-REFACTOR Testing Results

**Date:** 2026-02-12
**Branch:** `bioinformatics-skills`

## Summary

Executed the full RED-GREEN-REFACTOR TDD cycle for 3 bioinformatics skills. All 27 assertions pass across 3 test suites.

## RED Phase — Baseline Captures (without skills)

Ran generic pipeline prompts via `claude -p` without `--plugin-dir` to capture what Claude gets right/wrong from general knowledge alone.

### DESeq2 Baseline

| Criterion | Baseline Result | Notes |
|-----------|----------------|-------|
| Pre-filtering before DESeq() | PASS | Used rowSums filtering |
| VST/rlog before PCA | PASS | Applied VST before plotPCA |
| Export with tibble + rownames | PASS | Used rownames_to_column |
| Shrinkage optional | FAIL | Presented as standard step, not optional |
| Raw counts warning | PASS | Mentioned raw/unnormalized counts |
| Volcano cross-reference | PASS | Mentioned EnhancedVolcano |

**Baseline: 5/6 criteria met.** Main gap: shrinkage optionality.

### Seurat Baseline

| Criterion | Baseline Result | Notes |
|-----------|----------------|-------|
| PercentageFeatureSet with MT pattern | PASS | Used ^MT- pattern |
| VlnPlot before filtering | PASS | Inspected distributions first |
| ElbowPlot for PC selection | PASS | Used ElbowPlot() |
| Resolution discussion | PASS | Discussed resolution parameter |
| SCPubr/BadranSeq mention | FAIL | Not mentioned at all |
| SCTransform preference | PASS | Used SCTransform |
| Volcano cross-reference | FAIL | Not cross-referenced |

**Baseline: 5/7 criteria met.** Main gaps: visualization alternatives (SCPubr, BadranSeq) and cross-skill references.

### EnhancedVolcano Baseline

| Criterion | Baseline Result | Notes |
|-----------|----------------|-------|
| DESeq2 columns correct | PASS | log2FoldChange, padj |
| Seurat columns correct | PASS | avg_log2FC, p_val_adj |
| Rownames conversion | PASS | Used as_tibble with rownames |
| Adjusted p-value warning | PASS | Warned about raw vs adjusted |
| Customization parameters | PASS | drawConnectors, selectLab, etc. |

**Baseline: 5/5 criteria met.** Claude's general knowledge covers EnhancedVolcano well.

## GREEN Phase — Test Results (with skills loaded)

Ran all 3 test suites with `--plugin-dir` pointing to the superpowers repository.

| Test Suite | Assertions | Passed | Failed |
|-----------|-----------|--------|--------|
| bulk-rnaseq-deseq2 | 9 | 9 | 0 |
| scrna-seq-seurat | 10 | 10 | 0 |
| volcano-plots-enhancedvolcano | 8 | 8 | 0 |
| **Total** | **27** | **27** | **0** |

## REFACTOR Phase — What Was Fixed

Three categories of issues found and fixed in the test scripts:

### 1. Skills not discoverable (critical)
- **Problem:** `run_claude` from test-helpers.sh doesn't pass `--plugin-dir`, so `claude -p` can't find the skills
- **Fix:** Added custom `run_skill_claude()` function with `--plugin-dir "$PLUGIN_DIR"` and `--max-turns 3`

### 2. Path spaces causing hangs (platform-specific)
- **Problem:** OneDrive/iCloud paths with spaces cause `claude -p --plugin-dir` to hang indefinitely
- **Fix:** Create symlink to space-free path before running tests

### 3. Bash arithmetic with set -e (subtle bug)
- **Problem:** `((PASS++))` with `set -e` exits the script when PASS=0, because post-increment returns the pre-increment value (0), which bash treats as a failed command
- **Fix:** Changed to `PASS=$((PASS + 1))` which always succeeds

### 4. Stdin blocking in subshells
- **Problem:** `claude -p` blocks waiting for stdin when run inside `$()` subshell capture
- **Fix:** Added `< /dev/null` to claude command

## Value-Add Analysis

### Where skills add unique value

| Skill | What baseline missed | What skill provides |
|-------|---------------------|-------------------|
| bulk-rnaseq-deseq2 | Shrinkage presented as required | Explicitly marks lfcShrink as optional with rationale |
| scrna-seq-seurat | No mention of SCPubr or BadranSeq | Recommends publication-quality visualization alternatives |
| scrna-seq-seurat | No volcano cross-reference | Cross-references volcano-plots-enhancedvolcano skill |
| volcano-plots-enhancedvolcano | N/A (baseline was strong) | Provides structured column mapping table for quick reference |

### Interpretation

Claude's general knowledge covers the core bioinformatics workflows well. The skills add value in three specific areas:

1. **Opinionated guidance** — Marking shrinkage as optional rather than presenting it as a required step
2. **Package ecosystem knowledge** — Recommending SCPubr and BadranSeq, which are niche packages not in Claude's general training
3. **Cross-skill integration** — Connecting related skills (DESeq2 → volcano, Seurat → volcano) for complete workflows
