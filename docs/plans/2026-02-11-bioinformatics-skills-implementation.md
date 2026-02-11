# Bioinformatics Skills Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add three bioinformatics skills (bulk-rnaseq-deseq2, scrna-seq-seurat, volcano-plots-enhancedvolcano) with subagent tests to the Superpowers repository.

**Architecture:** Three self-contained SKILL.md files in `skills/`, each with YAML frontmatter following Superpowers conventions. Tests in `tests/bioinformatics/` use existing `test-helpers.sh` framework. Skills cross-reference via `REQUIRED SUB-SKILL` pattern.

**Tech Stack:** Bash (tests), Markdown/YAML (skills). R code examples use tidyverse style with native `|>` pipe. DESeq2, Seurat, EnhancedVolcano, SCPubr, BadranSeq.

**Design doc:** `docs/plans/2026-02-11-bioinformatics-skills-design.md`

---

### Task 1: Create test directory and test script for bulk-rnaseq-deseq2

**Files:**
- Create: `tests/bioinformatics/test-bulk-rnaseq-deseq2.sh`

**Step 1: Write the test script**

```bash
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
```

**Step 2: Make it executable**

Run: `chmod +x tests/bioinformatics/test-bulk-rnaseq-deseq2.sh`

**Step 3: Commit test (RED phase)**

```bash
git add tests/bioinformatics/test-bulk-rnaseq-deseq2.sh
git commit -m "test: add bulk-rnaseq-deseq2 skill test (RED phase)"
```

---

### Task 2: Write bulk-rnaseq-deseq2 SKILL.md

**Files:**
- Create: `skills/bulk-rnaseq-deseq2/SKILL.md`

**Step 1: Write the skill**

```markdown
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
```

**Step 2: Commit skill (GREEN phase)**

```bash
git add skills/bulk-rnaseq-deseq2/SKILL.md
git commit -m "feat: add bulk-rnaseq-deseq2 skill"
```

---

### Task 3: Run bulk-rnaseq-deseq2 tests and verify

**Step 1: Run test script**

Run: `./tests/bioinformatics/test-bulk-rnaseq-deseq2.sh`
Expected: All 7 tests PASS

**Step 2: If any test fails, refactor the SKILL.md**

Adjust wording in `skills/bulk-rnaseq-deseq2/SKILL.md` to address failures. Re-run until all pass.

**Step 3: Commit any refactoring**

```bash
git add skills/bulk-rnaseq-deseq2/SKILL.md
git commit -m "refactor: tighten bulk-rnaseq-deseq2 skill from test feedback"
```

---

### Task 4: Write test script for scrna-seq-seurat

**Files:**
- Create: `tests/bioinformatics/test-scrna-seq-seurat.sh`

**Step 1: Write the test script**

```bash
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
```

**Step 2: Make it executable**

Run: `chmod +x tests/bioinformatics/test-scrna-seq-seurat.sh`

**Step 3: Commit test (RED phase)**

```bash
git add tests/bioinformatics/test-scrna-seq-seurat.sh
git commit -m "test: add scrna-seq-seurat skill test (RED phase)"
```

---

### Task 5: Write scrna-seq-seurat SKILL.md

**Files:**
- Create: `skills/scrna-seq-seurat/SKILL.md`

**Step 1: Write the skill**

```markdown
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
```

**Step 2: Commit skill (GREEN phase)**

```bash
git add skills/scrna-seq-seurat/SKILL.md
git commit -m "feat: add scrna-seq-seurat skill"
```

---

### Task 6: Run scrna-seq-seurat tests and verify

**Step 1: Run test script**

Run: `./tests/bioinformatics/test-scrna-seq-seurat.sh`
Expected: All 8 tests PASS

**Step 2: If any test fails, refactor the SKILL.md**

Adjust wording in `skills/scrna-seq-seurat/SKILL.md` to address failures. Re-run until all pass.

**Step 3: Commit any refactoring**

```bash
git add skills/scrna-seq-seurat/SKILL.md
git commit -m "refactor: tighten scrna-seq-seurat skill from test feedback"
```

---

### Task 7: Write test script for volcano-plots-enhancedvolcano

**Files:**
- Create: `tests/bioinformatics/test-volcano-plots-enhancedvolcano.sh`

**Step 1: Write the test script**

```bash
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
```

**Step 2: Make it executable**

Run: `chmod +x tests/bioinformatics/test-volcano-plots-enhancedvolcano.sh`

**Step 3: Commit test (RED phase)**

```bash
git add tests/bioinformatics/test-volcano-plots-enhancedvolcano.sh
git commit -m "test: add volcano-plots-enhancedvolcano skill test (RED phase)"
```

---

### Task 8: Write volcano-plots-enhancedvolcano SKILL.md

**Files:**
- Create: `skills/volcano-plots-enhancedvolcano/SKILL.md`

**Step 1: Write the skill**

```markdown
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
```

**Step 2: Commit skill (GREEN phase)**

```bash
git add skills/volcano-plots-enhancedvolcano/SKILL.md
git commit -m "feat: add volcano-plots-enhancedvolcano skill"
```

---

### Task 9: Run volcano-plots-enhancedvolcano tests and verify

**Step 1: Run test script**

Run: `./tests/bioinformatics/test-volcano-plots-enhancedvolcano.sh`
Expected: All 6 tests PASS

**Step 2: If any test fails, refactor the SKILL.md**

Adjust wording in `skills/volcano-plots-enhancedvolcano/SKILL.md` to address failures. Re-run until all pass.

**Step 3: Commit any refactoring**

```bash
git add skills/volcano-plots-enhancedvolcano/SKILL.md
git commit -m "refactor: tighten volcano-plots-enhancedvolcano skill from test feedback"
```

---

### Task 10: Final integration verification

**Step 1: Run all bioinformatics tests together**

Run:
```bash
for test in tests/bioinformatics/test-*.sh; do
  echo "Running $test..."
  bash "$test" || exit 1
done
```

Expected: All 21 tests PASS across 3 test scripts.

**Step 2: Verify skill discovery**

Run: `claude -p "List all available bioinformatics skills from superpowers." 30`
Expected: Output mentions all three skills by name.

**Step 3: Verify cross-references work**

Run: `claude -p "I have DESeq2 results and want to make a volcano plot. Which superpowers skills should I use?" 30`
Expected: Mentions both `bulk-rnaseq-deseq2` and `volcano-plots-enhancedvolcano`.

**Step 4: Final commit**

```bash
git status
git log --oneline bioinformatics-skills ^main
```

Verify clean branch with all expected commits.
