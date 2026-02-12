# RED-GREEN-REFACTOR Testing for Bioinformatics Skills

**Date:** 2026-02-11
**Status:** Approved
**Branch:** `bioinformatics-skills` (continuing)

## Summary

Properly execute the TDD cycle for the 3 bioinformatics skills by running baseline prompts (RED), existing tests (GREEN), and fixing any failures (REFACTOR).

## RED Phase — Baseline Capture

Run one generic pipeline prompt per skill via `claude -p` without referencing any skill name. Capture output and document what Claude gets wrong.

**Prompts:**
1. DESeq2: "Write me a complete R script for bulk RNA-seq differential expression analysis with DESeq2. Start from a counts matrix and sample metadata, go through QC, and export results."
2. Seurat: "Write me a complete R script for single-cell RNA-seq analysis with Seurat. Start from 10X Chromium output, go through QC, clustering, and find marker genes."
3. Volcano: "Write me R code to create a volcano plot with EnhancedVolcano from both DESeq2 results and Seurat FindMarkers output."

**Check against test assertions** for each response.

## GREEN Phase — Run Existing Tests

Run all 3 test scripts (21 tests total) with skills loaded via the superpowers plugin.

## REFACTOR Phase — Fix Failures

Per failure:
1. Read failure output
2. Diagnose: brittle test regex → widen pattern; unclear skill wording → tighten SKILL.md
3. Fix, re-run single test, confirm pass
4. Commit

Re-run full suite after all fixes to confirm no regressions.

## Documentation

Write RED-GREEN-REFACTOR summary comparing baseline vs skill-guided results. Include in PR description as evidence of value-add.
