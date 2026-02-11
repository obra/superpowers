---
name: volcano-plots-enhancedvolcano
description: Use when creating volcano plots from differential expression results, visualizing DE genes, or using the EnhancedVolcano package
---

# Volcano Plots with EnhancedVolcano

## Overview

EnhancedVolcano creates publication-ready volcano plots from any differential expression results. The main challenge is mapping the right columns from your DE output — the plotting itself is straightforward.

**Core principle:** Know your column names. DESeq2 and Seurat use different names for the same things.

## When to Use

- User has **differential expression results** (from DESeq2, Seurat, limma, edgeR, or any tool)
- Goal is to create a **volcano plot** visualizing significance vs fold change
- Any mention of volcano plot, EnhancedVolcano, or DE visualization

**When NOT to use:**
- MA plots, heatmaps, or other visualization types
- Data that is not differential expression output

## Column Mapping

The critical step — get this wrong and the plot is meaningless or errors out.

| DE Source | gene column | log2FC column (x) | p-value column (y) |
|-----------|-------------|---------------------|---------------------|
| DESeq2 `results()` | rownames → convert to column | `log2FoldChange` | `padj` |
| Seurat `FindMarkers()` | rownames → convert to column | `avg_log2FC` | `p_val_adj` |
| limma `topTable()` | rownames → convert to column | `logFC` | `adj.P.Val` |
| edgeR `topTags()` | rownames → convert to column | `logFC` | `FDR` |

**Always use adjusted p-values**, not raw. Raw p-values produce misleadingly significant-looking plots.

## Core Usage

**From DESeq2 results:**

```r
library(EnhancedVolcano)
library(tidyverse)

# Convert rownames to column FIRST
res_df <- res |>
  as.data.frame() |>
  as_tibble(rownames = "gene")

EnhancedVolcano(
  res_df,
  lab = res_df$gene,
  x = "log2FoldChange",
  y = "padj",
  title = "Treated vs Control",
  pCutoff = 0.05,
  FCcutoff = 1.0
)
```

**From Seurat FindMarkers:**

```r
# Convert rownames to column FIRST
markers_df <- markers |>
  as.data.frame() |>
  as_tibble(rownames = "gene")

EnhancedVolcano(
  markers_df,
  lab = markers_df$gene,
  x = "avg_log2FC",
  y = "p_val_adj",
  title = "Cluster X vs Rest",
  pCutoff = 0.05,
  FCcutoff = 0.5
)
```

## Common Customizations

```r
EnhancedVolcano(
  res_df,
  lab = res_df$gene,
  x = "log2FoldChange",
  y = "padj",
  # --- Cutoff lines ---
  pCutoff = 0.05,
  FCcutoff = 1.0,
  # --- Label specific genes ---
  selectLab = c("BRCA1", "TP53", "MYC"),
  # --- Aesthetics ---
  pointSize = 2.0,
  labSize = 4.0,
  # --- Colors: NS, Log2FC, P, P&Log2FC ---
  col = c("grey30", "forestgreen", "royalblue", "red2"),
  # --- Cleaner labels ---
  drawConnectors = TRUE,
  widthConnectors = 0.5
)
```

| Parameter | Purpose | Typical Values |
|-----------|---------|----------------|
| `pCutoff` | Horizontal significance line | 0.05, 0.01, 1e-6 |
| `FCcutoff` | Vertical fold-change lines | 0.5, 1.0, 2.0 |
| `selectLab` | Label only specific genes | Character vector of gene names |
| `pointSize` | Dot size | 1.0–3.0 |
| `labSize` | Label text size | 3.0–5.0 |
| `col` | Colors for four quadrants | Vector of 4 colors |
| `drawConnectors` | Line from point to label | TRUE for cleaner plots |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using raw p-values instead of adjusted | Always use `padj` (DESeq2) or `p_val_adj` (Seurat) |
| Forgetting to convert rownames | Rownames are silently dropped by some operations. Convert with `as_tibble(rownames = "gene")` before plotting. |
| Wrong column name for source | DESeq2 uses `log2FoldChange`; Seurat uses `avg_log2FC`. Check with `colnames()`. |
| Setting FCcutoff too high for scRNA-seq | Single-cell fold changes are typically smaller. Use 0.25–0.5 for Seurat results. |
