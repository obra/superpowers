# Bioinformatics Skills for Superpowers

**Date:** 2026-02-11
**Status:** Approved
**Branch:** `bioinformatics-skills`

## Summary

Three new skills providing reference and technique guidance for common bioinformatics workflows: bulk RNA-seq DE with DESeq2, single-cell RNA-seq with Seurat, and volcano plot visualization with EnhancedVolcano. Contributed upstream via PR.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Skill types | Reference + Technique (hybrid) | Pipelines have both mechanical steps and judgment calls |
| Organization | 3 skills, flat namespace, shared volcano skill | Follows Superpowers conventions; volcano cross-referenced by both |
| DESeq2 scope | Counts matrix onward | YAGNI — alignment and enrichment are separate skills |
| Seurat scope | Standard single-sample workflow | Integration and pseudo-bulk are separate skills |
| EnhancedVolcano scope | Core usage + common customizations | Package docs cover exotic parameters |
| R code style | Tidyverse-flavored, native `|>` pipe | Modern R, no magrittr `%>%` |
| Testing | Subagent pressure tests per skill | Matches project TDD-for-documentation methodology |
| CLAUDE.md | Added to .gitignore | Must not ship with upstream PR |

## Skill 1: `bulk-rnaseq-deseq2`

**Frontmatter:**
```yaml
name: bulk-rnaseq-deseq2
description: Use when performing bulk RNA-seq differential expression analysis, working with count matrices, or setting up DESeq2 pipelines
```

**Pipeline (Quick Reference):**

| Step | Function | Judgment Call |
|------|----------|---------------|
| Load | `DESeqDataSetFromMatrix()` | Design formula choice |
| Pre-filter | `keep <- rowSums(counts(dds)) >= 10` | Threshold 5-10; filter before `DESeq()` |
| Run | `DESeq()` | Never call internal steps manually |
| Transform | `vst()` or `rlog()` | VST default; rlog for small datasets (n < 20) |
| QC | `plotPCA(vsd)` | Outlier detection, batch effects |
| Results | `results(contrast=...)` | Contrast specification |
| Shrinkage (optional) | `lfcShrink(type="apeglm")` | Recommended for ranking/visualization |
| Export | `as_tibble(rownames="gene")` | Preserves gene IDs as column |

**Technique content covers:**
- Design formula choice for multi-factor experiments
- Pre-filtering rationale (speed + multiple testing burden)
- VST vs rlog decision (dataset size)
- Reading PCA plots for outliers and batch effects
- Contrast specification for pairwise and interaction terms
- When shrinkage helps (ranking genes, volcano plots) vs when it's unnecessary

**Common Mistakes:**
- Passing normalized/TPM counts instead of raw counts
- Forgetting VST/rlog before PCA
- Misspecified contrasts
- Ignoring PCA outliers
- Losing gene names on export (use `rownames=` argument)

**Cross-reference:** `REQUIRED SUB-SKILL: Use superpowers:volcano-plots-enhancedvolcano for visualization`

## Skill 2: `scrna-seq-seurat`

**Frontmatter:**
```yaml
name: scrna-seq-seurat
description: Use when performing single-cell RNA-seq analysis, clustering, QC filtering, or working with Seurat objects
```

**Pipeline (Quick Reference):**

| Step | Function | Judgment Call |
|------|----------|---------------|
| Load | `Read10X()` / `CreateSeuratObject()` | min.cells, min.features cutoffs |
| QC metrics | `PercentageFeatureSet(pattern="^MT-")` | Species-specific pattern (MT- vs mt-) |
| Filter | `subset()` on nFeature, nCount, percent.mt | Thresholds from violin/scatter plots |
| Normalize | `SCTransform()` or `NormalizeData()` | SCTransform preferred for most cases |
| Dim reduction | `RunPCA()` | Number of PCs (ElbowPlot) |
| Cluster | `FindNeighbors() |> FindClusters()` | Resolution parameter (0.1-1.2) |
| Visualize | `RunUMAP() |> DimPlot()` | Consider SCPubr or BadranSeq for publication aesthetics |
| Markers | `FindAllMarkers()` / `FindMarkers()` | test.use, min.pct, logfc.threshold |

**Technique content covers:**
- Reading QC violin plots to choose thresholds (not blind defaults)
- ElbowPlot interpretation for PC selection
- Resolution parameter tuning (under- vs over-clustering)
- SCTransform vs log-normalize tradeoffs
- Visualization alternatives: SCPubr and BadranSeq recommended for publication-quality DimPlots

**Common Mistakes:**
- Filtering too aggressively (losing rare populations)
- Wrong mitochondrial gene pattern for species
- Not regressing confounders in SCTransform
- Choosing resolution without biological context

**Cross-reference:** `REQUIRED SUB-SKILL: Use superpowers:volcano-plots-enhancedvolcano for visualization`

## Skill 3: `volcano-plots-enhancedvolcano`

**Frontmatter:**
```yaml
name: volcano-plots-enhancedvolcano
description: Use when creating volcano plots from differential expression results, visualizing DE genes, or using the EnhancedVolcano package
```

**Column Mapping (Key Technique):**

| DE Source | gene column | log2FC column | p-value column |
|-----------|-------------|---------------|----------------|
| DESeq2 `results()` | rownames (convert first) | `log2FoldChange` | `padj` |
| Seurat `FindMarkers()` | rownames (convert first) | `avg_log2FC` | `p_val_adj` |

**Core usage:** Minimal `EnhancedVolcano()` call with correct column mappings for each source.

**Common customizations:**
- `pCutoff` / `FCcutoff` — adjusting significance lines
- `selectLab` — labeling specific genes of interest
- `pointSize` / `labSize` — scaling for publication
- `col` — custom color vector for the four quadrants
- `drawConnectors` — cleaner label placement

**Common Mistakes:**
- Passing raw p-values instead of adjusted
- Forgetting to convert rownames to column before passing to `lab`
- Using wrong column name for Seurat vs DESeq2 output

**Standalone:** This skill works independently for any DE results source.

## Testing Strategy

Each skill gets a shell test script in `tests/bioinformatics/` using the existing `test-helpers.sh` framework.

**Per-skill test cycle (RED-GREEN-REFACTOR):**

1. **RED:** Prompt subagent to perform analysis without skill → document baseline failures
2. **GREEN:** Same prompt with skill loaded → assert key workflow steps present
3. **REFACTOR:** Tighten assertions for any loopholes found

**Example assertions:**
- `bulk-rnaseq-deseq2`: Assert pre-filtering appears before `DESeq()`, VST/rlog before PCA, `rownames=` in export
- `scrna-seq-seurat`: Assert QC filtering with `PercentageFeatureSet`, `ElbowPlot` mention, resolution discussion
- `volcano-plots-enhancedvolcano`: Assert correct column names for DESeq2 vs Seurat source, rownames conversion

## File Changes

**Added:**
```
skills/bulk-rnaseq-deseq2/SKILL.md
skills/scrna-seq-seurat/SKILL.md
skills/volcano-plots-enhancedvolcano/SKILL.md
tests/bioinformatics/test-bulk-rnaseq-deseq2.sh
tests/bioinformatics/test-scrna-seq-seurat.sh
tests/bioinformatics/test-volcano-plots-enhancedvolcano.sh
```

**Modified:**
```
.gitignore              # Add CLAUDE.md
```

## Out of Scope (YAGNI)

- Pathway/enrichment analysis (clusterProfiler, fgsea)
- Multi-sample integration (Harmony, CCA, RPCA)
- Pseudo-bulk DE analysis
- Alignment/quantification (STAR, Salmon)
- Spatial transcriptomics
