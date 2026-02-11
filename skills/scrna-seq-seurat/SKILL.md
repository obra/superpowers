---
name: scrna-seq-seurat
description: Use when performing single-cell RNA-seq analysis, clustering, QC filtering, or working with Seurat objects
---

# Single-Cell RNA-Seq Analysis with Seurat

## Overview

Seurat is a toolkit for single-cell RNA-seq QC, normalization, clustering, and marker gene identification. It takes raw count matrices (typically from 10X Chromium) and produces annotated cell populations.

**Core principle:** QC filtering decisions shape every downstream result. Always inspect distributions before choosing thresholds — never use blind defaults.

## When to Use

- User has **10X Chromium output** or a single-cell count matrix
- Goal is to go from raw counts to **clusters and marker genes**
- Any mention of Seurat, scRNA-seq, single-cell clustering, or cell type identification

**When NOT to use:**
- Bulk RNA-seq → use superpowers:bulk-rnaseq-deseq2
- Spatial transcriptomics (Visium, MERFISH)
- Multi-sample integration (future skill)

## Quick Reference

| Step | Function | Judgment Call |
|------|----------|---------------|
| Load | `Read10X()` / `CreateSeuratObject()` | min.cells, min.features cutoffs |
| QC metrics | `PercentageFeatureSet(pattern = "^MT-")` | Species-specific: `^MT-` (human) vs `^mt-` (mouse) |
| Inspect | `VlnPlot()` / `FeatureScatter()` | Identify thresholds from distributions |
| Filter | `subset()` on nFeature, nCount, percent.mt | Set from visual inspection, not defaults |
| Normalize | `SCTransform()` or `NormalizeData()` | SCTransform preferred for most cases |
| Dim reduction | `RunPCA()` then `ElbowPlot()` | Choose PCs from elbow |
| Cluster | `FindNeighbors() |> FindClusters()` | Resolution 0.1–1.2 depending on expected populations |
| Visualize | `RunUMAP() |> DimPlot()` | Consider SCPubr or BadranSeq for publication aesthetics |
| Markers | `FindAllMarkers()` / `FindMarkers()` | test.use, min.pct, logfc.threshold |

## Core Workflow

```r
library(Seurat)
library(tidyverse)

# --- Load 10X data ---
counts <- Read10X(data.dir = "filtered_feature_bc_matrix/")
seurat_obj <- CreateSeuratObject(
  counts = counts,
  project = "my_project",
  min.cells = 3,
  min.features = 200
)

# --- QC metrics ---
seurat_obj[["percent.mt"]] <- PercentageFeatureSet(seurat_obj, pattern = "^MT-")

# --- Inspect distributions BEFORE setting thresholds ---
VlnPlot(seurat_obj, features = c("nFeature_RNA", "nCount_RNA", "percent.mt"), ncol = 3)

# --- Filter (set thresholds from violin plots above) ---
seurat_obj <- subset(
  seurat_obj,
  subset = nFeature_RNA > 200 & nFeature_RNA < 5000 & percent.mt < 15
)

# --- Normalize ---
# SCTransform is preferred — handles normalization, scaling, and variable feature selection
seurat_obj <- SCTransform(seurat_obj, verbose = FALSE)

# --- Dimensionality reduction ---
seurat_obj <- RunPCA(seurat_obj)
ElbowPlot(seurat_obj, ndims = 30)
# Choose PCs where curve flattens (typically 10-20)

# --- Cluster ---
seurat_obj <- seurat_obj |>
  FindNeighbors(dims = 1:15) |>
  FindClusters(resolution = 0.5)

# --- UMAP and visualization ---
seurat_obj <- RunUMAP(seurat_obj, dims = 1:15)
DimPlot(seurat_obj, reduction = "umap", label = TRUE)

# --- Find marker genes ---
markers <- FindAllMarkers(
  seurat_obj,
  only.pos = TRUE,
  min.pct = 0.25,
  logfc.threshold = 0.25
)

# Top markers per cluster
top_markers <- markers |>
  group_by(cluster) |>
  slice_max(avg_log2FC, n = 5)
```

## Key Decisions

**QC thresholds:** Never hard-code. Use `VlnPlot()` and `FeatureScatter()` to see natural breakpoints. Common ranges: nFeature 200–5000, percent.mt 5–20%, but these vary by tissue and protocol.

**SCTransform vs NormalizeData:** SCTransform is preferred — it regularizes variance, handles normalization and scaling in one step, and performs better for downstream clustering. Use `NormalizeData() |> FindVariableFeatures() |> ScaleData()` if you need backward compatibility or have memory constraints.

**PC selection:** `ElbowPlot()` shows variance explained per PC. Choose the elbow point where gains flatten. Typically 10–20 PCs. Over-including PCs adds noise; under-including loses signal.

**Resolution:** Controls cluster granularity. Low (0.1–0.3) = fewer broad clusters. High (0.8–1.2) = more fine-grained. Match to expected biological populations. Try multiple values and compare with known markers.

## Visualization Alternatives

The default `DimPlot()` works but has limited aesthetics. For **publication-quality** figures, consider:

- **SCPubr** — Enhanced Seurat plotting with cleaner defaults and more customization
- **BadranSeq** — Publication-ready DimPlots with improved aesthetics

These are recommendations, not requirements. Install separately if needed.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Hard-coding QC thresholds without looking | Use `VlnPlot()` to inspect distributions first |
| Wrong mitochondrial pattern for species | `^MT-` for human, `^mt-` for mouse. Check with `rownames(seurat_obj)`. |
| Not regressing confounders in SCTransform | Use `vars.to.regress` if batch or cell cycle is a known confounder |
| Choosing resolution without biological context | Try multiple resolutions, validate clusters against known markers |
| Filtering too aggressively | Overly strict thresholds remove rare populations. Check cell counts after filtering. |

**REQUIRED SUB-SKILL:** Use superpowers:volcano-plots-enhancedvolcano for volcano plot visualization of marker gene results.
