# RED-GREEN-REFACTOR Testing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Properly execute TDD for the 3 bioinformatics skills by running baseline captures (RED), existing tests (GREEN), and fixing failures (REFACTOR).

**Architecture:** Run `claude -p` headless prompts to capture baseline behavior without skills, then run the existing test scripts with skills loaded, then fix any failures found. Document the before/after comparison as evidence of skill value.

**Tech Stack:** Bash, Claude Code CLI (`claude -p`), existing test-helpers.sh framework.

---

### Task 1: RED — Capture DESeq2 baseline

**Step 1: Run the baseline prompt**

Run:
```bash
claude -p "Write me a complete R script for bulk RNA-seq differential expression analysis with DESeq2. Start from a counts matrix and sample metadata, go through QC, and export results. Use tidyverse style with native |> pipe."
```
Timeout: 60 seconds.

**Step 2: Save output and analyze**

Save the output to a temporary file. Check it against these criteria (the same things our tests assert):

| Criterion | What to look for |
|-----------|-----------------|
| Pre-filtering before DESeq() | Does it call `rowSums` filtering before `DESeq()`? |
| VST/rlog before PCA | Does it transform data before `plotPCA()`? |
| Export with tibble + rownames | Does it use `as_tibble(rownames = "gene")` or similar? |
| Shrinkage optional | Does it mark `lfcShrink()` as optional, or present it as required? |
| Raw counts warning | Does it mention DESeq2 needs raw/unnormalized counts? |
| Volcano cross-reference | Does it mention EnhancedVolcano? (Unlikely without skill) |

**Step 3: Document findings**

Record which criteria passed/failed in the baseline. This is the RED evidence.

---

### Task 2: RED — Capture Seurat baseline

**Step 1: Run the baseline prompt**

Run:
```bash
claude -p "Write me a complete R script for single-cell RNA-seq analysis with Seurat. Start from 10X Chromium output, go through QC, clustering, and find marker genes. Use tidyverse style with native |> pipe."
```
Timeout: 60 seconds.

**Step 2: Save output and analyze**

| Criterion | What to look for |
|-----------|-----------------|
| PercentageFeatureSet with MT pattern | Does it use `^MT-` or `^mt-`? |
| VlnPlot before filtering | Does it inspect distributions before setting thresholds? |
| ElbowPlot for PC selection | Does it use `ElbowPlot()` or similar? |
| Resolution discussion | Does it discuss the resolution parameter choice? |
| SCPubr/BadranSeq mention | Does it recommend these packages? (Very unlikely without skill) |
| SCTransform preference | Does it prefer SCTransform over NormalizeData? |
| Volcano cross-reference | Does it mention EnhancedVolcano? (Unlikely without skill) |

**Step 3: Document findings**

Record which criteria passed/failed.

---

### Task 3: RED — Capture EnhancedVolcano baseline

**Step 1: Run the baseline prompt**

Run:
```bash
claude -p "Write me R code to create a volcano plot with EnhancedVolcano from both DESeq2 results and Seurat FindMarkers output. Show the correct column names for each source. Use tidyverse style with native |> pipe."
```
Timeout: 60 seconds.

**Step 2: Save output and analyze**

| Criterion | What to look for |
|-----------|-----------------|
| DESeq2 columns: log2FoldChange, padj | Correct column names? |
| Seurat columns: avg_log2FC, p_val_adj | Correct column names? |
| Rownames conversion | Does it convert rownames to a column before plotting? |
| Adjusted p-value warning | Does it warn about raw vs adjusted? |
| Customization parameters | Does it show pCutoff, FCcutoff, selectLab, drawConnectors? |

**Step 3: Document findings**

Record which criteria passed/failed.

---

### Task 4: GREEN — Run bulk-rnaseq-deseq2 tests

**Step 1: Run the test script**

Run:
```bash
bash tests/bioinformatics/test-bulk-rnaseq-deseq2.sh
```
Timeout: 300 seconds (7 tests x ~30s each + overhead).

**Step 2: Record results**

For each of the 7 tests, record PASS or FAIL with the assertion output.

**Step 3: If all pass, move to Task 7. If any fail, note the failures for Task 7.**

---

### Task 5: GREEN — Run scrna-seq-seurat tests

**Step 1: Run the test script**

Run:
```bash
bash tests/bioinformatics/test-scrna-seq-seurat.sh
```
Timeout: 300 seconds (8 tests x ~30s each + overhead).

**Step 2: Record results**

For each of the 8 tests, record PASS or FAIL with the assertion output.

**Step 3: If all pass, move to Task 7. If any fail, note the failures for Task 7.**

---

### Task 6: GREEN — Run volcano-plots-enhancedvolcano tests

**Step 1: Run the test script**

Run:
```bash
bash tests/bioinformatics/test-volcano-plots-enhancedvolcano.sh
```
Timeout: 300 seconds (6 tests x ~30s each + overhead).

**Step 2: Record results**

For each of the 6 tests, record PASS or FAIL with the assertion output.

**Step 3: If all pass, move to Task 7. If any fail, note the failures for Task 7.**

---

### Task 7: REFACTOR — Fix any failures

**For each failure from Tasks 4-6:**

**Step 1: Diagnose the cause**

Read the failure output. Determine if:
- **Brittle test regex**: Claude said the right thing but the pattern didn't match (e.g., said "variance stabilizing transformation" but test only matches `vst\|VST\|rlog`)
- **Unclear skill wording**: Claude with the skill still gets it wrong because the SKILL.md doesn't emphasize the concept enough

**Step 2: Fix the appropriate file**

- Brittle regex → Modify: `tests/bioinformatics/test-*.sh` — widen the assertion pattern
- Unclear skill → Modify: `skills/*/SKILL.md` — tighten the wording

**Step 3: Re-run the single failing test**

Run:
```bash
bash tests/bioinformatics/test-<skill-name>.sh
```

Confirm the fix resolves the failure.

**Step 4: Commit the fix**

```bash
git add <changed-files>
git commit -m "refactor: fix <description of what was fixed>"
```

**Repeat Steps 1-4 for each failure.**

---

### Task 8: Regression check — Re-run all tests

**Step 1: Run all 3 test scripts**

Run:
```bash
for test in tests/bioinformatics/test-*.sh; do
  echo "Running $test..."
  bash "$test" || echo "FAILED: $test"
done
```
Timeout: 600 seconds.

Expected: All 21 tests PASS.

**Step 2: If any fail, go back to Task 7 for those failures.**

---

### Task 9: Document RED-GREEN-REFACTOR results

**Step 1: Create summary comparing baseline vs skill-guided**

Create a summary table for each skill showing:
- What Claude got wrong without the skill (RED)
- What Claude got right with the skill (GREEN)
- What was refactored (REFACTOR)

This will be used in the PR description.

**Step 2: Commit documentation**

```bash
git add -A
git commit -m "docs: add RED-GREEN-REFACTOR testing evidence"
```
