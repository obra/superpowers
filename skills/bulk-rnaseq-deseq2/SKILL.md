---
name: bulk-rnaseq-deseq2
description: Use when performing bulk RNA-seq differential expression analysis, working with count matrices, or setting up DESeq2 pipelines
---

# Bulk RNA-Seq Analysis with DESeq2

## Overview

DESeq2 performs differential expression analysis using a negative binomial generalized linear model. It takes **raw, unnormalized counts** and handles normalization internally.

**Core principle:** Inspect your data at every stage before proceeding. PCA plots and QC checks catch problems that silently ruin results.

## When to Use

- User has a **raw counts matrix** (from featureCounts, Salmon, HTSeq, etc.) and sample metadata
- Goal is to find **differentially expressed genes** between conditions
- Any mention of DESeq2, bulk RNA-seq DE, or count-based differential expression

**When NOT to use:**
- Single-cell data → use superpowers:scrna-seq-seurat
- Already-normalized data (FPKM, TPM, RPKM) → DESeq2 requires raw counts
- Microarray data → use limma

## Quick Reference

| Step | Function | Judgment Call |
|------|----------|---------------|
| Load | `DESeqDataSetFromMatrix()` | Design formula choice |
| Pre-filter | `keep <- rowSums(counts(dds)) >= 10` | Threshold 5–10; filter **before** `DESeq()` |
| Run | `DESeq()` | Never call internal steps manually |
| Transform | `vst()` or `rlog()` | VST default; rlog for small datasets (n < 20) |
| QC | `plotPCA(vsd)` | Outlier detection, batch effects |
| Results | `results(contrast=...)` | Contrast specification |
| Shrinkage (optional) | `lfcShrink(type="apeglm")` | Recommended for ranking and visualization |
| Export | `as_tibble(rownames = "gene")` | Preserves gene IDs as column |

## Core Workflow

```r
library(DESeq2)
library(tidyverse)

# --- Load data ---
# counts_matrix: genes (rows) x samples (columns), raw integer counts
# col_data: data.frame with sample metadata, rownames matching colnames of counts
dds <- DESeqDataSetFromMatrix(
  countData = counts_matrix,
  colData = col_data,
  design = ~ condition
)

# --- Pre-filter low-count genes (before DESeq) ---
keep <- rowSums(counts(dds)) >= 10
dds <- dds[keep, ]

# --- Run DESeq2 ---
dds <- DESeq(dds)

# --- Transform for QC visualization ---
# VST is fast and works well for most datasets
# Use rlog() instead if n < 20 samples
vsd <- vst(dds, blind = FALSE)

# --- PCA for sample-level QC ---
plotPCA(vsd, intgroup = "condition")

# --- Extract results ---
res <- results(dds, contrast = c("condition", "treated", "control"))

# --- Optional: shrink LFCs for ranking/visualization ---
# Requires BiocManager::install("apeglm")
res_shrunk <- lfcShrink(dds, coef = "condition_treated_vs_control", type = "apeglm")

# --- Export as tibble (preserves gene names) ---
res_tbl <- res |>
  as.data.frame() |>
  as_tibble(rownames = "gene") |>
  arrange(padj)
```

## Key Decisions

**Design formula:** Determines what DESeq2 tests. `~ condition` for simple two-group. `~ batch + condition` to control for batch. The variable of interest goes last.

**Pre-filtering threshold:** `rowSums(counts(dds)) >= 10` removes genes with negligible evidence. This speeds up computation and reduces multiple testing burden. Apply **before** `DESeq()`.

**VST vs rlog:** Both stabilize variance for PCA/clustering. VST is fast and preferred for most datasets. Use rlog only for small datasets (< 20 samples) where VST may over-correct.

**Contrast specification:** `contrast = c("factor", "numerator", "denominator")` gives numerator/denominator fold change. For designs with interaction terms, use the `name` argument with `resultsNames(dds)`.

**Shrinkage:** Optional. `lfcShrink()` with apeglm moderates noisy fold changes from low-count genes. Use when ranking genes or feeding results into volcano plots. Not needed if you only care about the significance list.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Passing normalized counts (FPKM/TPM) | DESeq2 needs **raw counts**. It normalizes internally. |
| Running PCA on raw counts | Apply `vst()` or `rlog()` first. Raw counts have mean-variance dependence. |
| Calling `estimateDispersions()` after `DESeq()` | `DESeq()` already does this internally. Don't call components manually. |
| Losing gene names on export | Use `as_tibble(rownames = "gene")` to convert rownames to a column. |
| Pre-filtering after `DESeq()` | Filter **before** to reduce computation and multiple testing burden. |
| Wrong contrast direction | `c("condition", "A", "B")` means A vs B. Check with `resultsNames(dds)`. |

**REQUIRED SUB-SKILL:** Use superpowers:volcano-plots-enhancedvolcano for volcano plot visualization of results.
