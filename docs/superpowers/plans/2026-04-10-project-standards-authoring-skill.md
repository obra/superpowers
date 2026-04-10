# Project Standards Authoring Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new repository-level skill that generates project-grounded rules, checklists, conditional creation guides, and a global reuse inventory using evidence from code and docs.

**Architecture:** Add one new skill directory with a strict stage-gated workflow, plus one supporting template file and one focused integration-style validation script. Validate the skill with RED -> GREEN -> REFACTOR evidence and document results in `docs/testing.md`.

**Tech Stack:** Markdown skills (`SKILL.md`), bash test scripts, existing `tests/claude-code` validation tooling, git.

---

### Task 1: Add RED Baseline Validation Scenario

**Files:**
- Create: `tests/claude-code/test-project-standards-authoring.sh`
- Create: `tests/claude-code/prompts/project-standards-authoring-baseline.txt`
- Modify: `tests/claude-code/README.md`

- [ ] **Step 1: Write the failing baseline prompt**

Create `tests/claude-code/prompts/project-standards-authoring-baseline.txt`:

```text
You are in a repository that has mixed code and docs.

Task:
Create coding standards documents directly for all code types in one pass.

Important:
- Do not ask me to choose any classification scheme.
- Do not spend time on evidence retrieval.
- Keep it high-level and fast.
```

- [ ] **Step 2: Write the baseline test script that expects bad behavior without the new skill**

Create `tests/claude-code/test-project-standards-authoring.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROMPT_FILE="$SCRIPT_DIR/prompts/project-standards-authoring-baseline.txt"
OUT_DIR="$REPO_ROOT/docs/testing-reports/project-standards-authoring-red"
mkdir -p "$OUT_DIR"

OUTPUT_FILE="$OUT_DIR/claude-output.txt"

echo "Running RED baseline scenario (without explicit skill request)..."
cd "$REPO_ROOT"

PROMPT="$(cat "$PROMPT_FILE")"

timeout 1200 claude -p "$PROMPT" \
  --allowed-tools=all \
  --permission-mode bypassPermissions \
  2>&1 | tee "$OUTPUT_FILE"

echo "Checking baseline signals..."

# Expected baseline anti-patterns:
# 1) skipped classification-choice gate
# 2) generated standards without explicit standards retrieval framing
if rg -q "2-3|分类方案|classification" "$OUTPUT_FILE"; then
  echo "[INFO] classification language found"
else
  echo "[INFO] no explicit classification proposal found (expected baseline weakness)"
fi

if rg -q "standards-context-retrieval|Constraints Summary" "$OUTPUT_FILE"; then
  echo "[INFO] explicit retrieval pattern found"
else
  echo "[INFO] no explicit retrieval pattern found (expected baseline weakness)"
fi

echo "RED baseline run complete. Review output manually at:"
echo "  $OUTPUT_FILE"
```

- [ ] **Step 3: Run script syntax check**

Run: `bash -n tests/claude-code/test-project-standards-authoring.sh`  
Expected: command exits 0 with no output.

- [ ] **Step 4: Update test docs so engineers know how to run it**

Append to `tests/claude-code/README.md`:

```markdown
## Project Standards Authoring Validation

Run RED baseline capture:

```bash
cd tests/claude-code
./test-project-standards-authoring.sh
```

Artifacts are written to:

- `docs/testing-reports/project-standards-authoring-red/claude-output.txt`
```

- [ ] **Step 5: Commit Task 1**

```bash
git add tests/claude-code/test-project-standards-authoring.sh \
  tests/claude-code/prompts/project-standards-authoring-baseline.txt \
  tests/claude-code/README.md
git commit -m "test: add RED baseline scenario for project standards authoring skill"
```

### Task 2: Implement the New Skill With Stage Gates

**Files:**
- Create: `skills/project-standards-authoring/SKILL.md`
- Create: `skills/project-standards-authoring/templates.md`

- [ ] **Step 1: Write the failing expectation for skill discoverability**

Create a local checklist note (temporary in terminal, not committed) with expected must-haves:

```text
- frontmatter name/description valid
- starts with classification proposal gate
- requires human choice before artifact generation
- requires standards-context-retrieval per type
- defines output paths and formats
- defines fallback and red flags
```

Expected: before file creation, all items are unmet.

- [ ] **Step 2: Create `SKILL.md` with full workflow**

Create `skills/project-standards-authoring/SKILL.md`:

```markdown
---
name: project-standards-authoring
description: Use when creating project-specific coding standards from existing code and documentation, and you must produce auditable rules/checklists grounded in repository evidence.
---

# Project Standards Authoring

## Overview

Generate project-grounded standards assets by extracting constraints from code and docs first, then emitting rules/checklists/guides with traceable evidence.

Core principle: no standards artifact is valid unless it is tied to repository evidence and passes stage gates.

## Iron Law

```
NO STANDARDS DOCUMENT GENERATION BEFORE HUMAN CLASSIFICATION CHOICE
```

No exceptions:
- Do not skip the 2-3 classification proposals.
- Do not proceed if the human did not choose one scheme.
- Do not fabricate project policy when evidence is missing.

## Required Workflow

### 1) Scan context and propose 2-3 classification schemes

Default bias: functional-domain classification.

For each scheme, provide:
- Type names in `kebab-case`
- Definition per type
- Example file coverage
- Trade-offs

Then stop and ask the human to choose.

### 2) For each selected type, retrieve standards first

**REQUIRED SUB-SKILL:** Use superpowers:standards-context-retrieval

For each selected `${type}`:
- Retrieve constraints from project docs/code
- Produce explicit Constraints Summary
- Resolve conflicts by priority:
  1. User instruction
  2. Repository rules
  3. Process docs
  4. Nearby code conventions

### 3) Generate rules and checklist artifacts

For each selected `${type}` generate:
- `.cursor/rules/${type}.md`
- `docs/checklist/${type}.md`

Rules file must include:
- Scope
- Must
- Must Not
- Naming & Structure
- Verification
- Sources

Checklist file must include:
- Before Design
- During Implementation
- Before Commit
- Stop-Ship

### 4) Generate creation guide conditionally

If `${type}` includes multiple files or is complex, generate:
- `docs/guides/how-to-create-${type}.md`

The guide must focus on creation workflow, not duplicate the full rules file.

### 5) Generate global reuse inventory

Always generate:
- `docs/resources/reuse-inventory.md`

Required columns:
- Name
- Kind
- Location
- Reusable For
- When Not To Reuse

Also include a `Cross-Module Hotspots` section.

### 6) Run quality gates

Block completion if any fails:
- rule without evidence source
- must-rule without checklist mapping
- ambiguous/non-operational policy language
- missing explicit "No project-specific standard found" when applicable

### 7) Delivery summary

Return:
- chosen classification scheme
- generated file list
- coverage and gaps

## Output Templates

Use `templates.md` in this directory for canonical document skeletons.

## Rationalization Table

| Excuse | Reality |
|---|---|
| "This repo is small, one scheme is enough" | You must provide 2-3 schemes and require explicit human choice. |
| "I can infer standards from memory" | Memory is not evidence; retrieve sources first. |
| "Checklist can be generic" | Checklist must map to concrete must-rules. |
| "No docs exist, I'll invent best practices" | If missing, state no project standard found; do not fabricate policy. |

## Red Flags - Stop and Restart

- Started writing `.cursor/rules/*` before classification choice
- Generated rules with no `Sources` evidence
- Checklist items not traceable to `Must` rules
- Omitted reuse inventory or removed non-reuse boundaries
```

- [ ] **Step 3: Create canonical templates file**

Create `skills/project-standards-authoring/templates.md`:

```markdown
# Project Standards Authoring Templates

## Rules Template (`.cursor/rules/${type}.md`)

```markdown
# ${type} Rules

## Scope
- ...

## Must
- [R-001] ...

## Must Not
- [X-001] ...

## Naming & Structure
- ...

## Verification
- ...

## Sources
- `path/to/source-a`
- `path/to/source-b`
```

## Checklist Template (`docs/checklist/${type}.md`)

```markdown
# ${type} Checklist

## Before Design
- [ ] ...

## During Implementation
- [ ] ...

## Before Commit
- [ ] ...

## Stop-Ship
- [ ] ...
```

## Creation Guide Template (`docs/guides/how-to-create-${type}.md`)

```markdown
# How to Create ${type}

## When to Create This Type
- ...

## Minimum Module Skeleton
- ...

## Dependencies and Boundaries
- ...

## Common Failure Modes
- ...

## Minimum Verification Path
- ...
```

## Reuse Inventory Template (`docs/resources/reuse-inventory.md`)

```markdown
# Reuse Inventory

| Name | Kind | Location | Reusable For | When Not To Reuse |
|---|---|---|---|---|
| ... | ... | ... | ... | ... |

## Cross-Module Hotspots
- ...
```
```

- [ ] **Step 4: Run markdown sanity checks**

Run:
- `rg "^name: project-standards-authoring$" skills/project-standards-authoring/SKILL.md`
- `rg "REQUIRED SUB-SKILL: Use superpowers:standards-context-retrieval" skills/project-standards-authoring/SKILL.md`

Expected:
- Both commands print one matching line.

- [ ] **Step 5: Commit Task 2**

```bash
git add skills/project-standards-authoring/SKILL.md \
  skills/project-standards-authoring/templates.md
git commit -m "feat: add project-standards-authoring skill with staged workflow"
```

### Task 3: Add GREEN Validation Prompt and Script Path

**Files:**
- Create: `tests/claude-code/prompts/project-standards-authoring-green.txt`
- Modify: `tests/claude-code/test-project-standards-authoring.sh`

- [ ] **Step 1: Add GREEN prompt that explicitly invokes the skill**

Create `tests/claude-code/prompts/project-standards-authoring-green.txt`:

```text
Use superpowers:project-standards-authoring.

Task:
Design standards assets for this repository using the skill's required process.

Requirements:
- Start by proposing 2-3 classification schemes and wait for human choice.
- Use standards-context-retrieval per selected type.
- Generate path-specific artifact drafts and a global reuse inventory structure.
```

- [ ] **Step 2: Extend validation script to run GREEN mode**

Update `tests/claude-code/test-project-standards-authoring.sh` with mode support:

```bash
MODE="${1:-red}"
if [[ "$MODE" == "green" ]]; then
  PROMPT_FILE="$SCRIPT_DIR/prompts/project-standards-authoring-green.txt"
  OUT_DIR="$REPO_ROOT/docs/testing-reports/project-standards-authoring-green"
else
  PROMPT_FILE="$SCRIPT_DIR/prompts/project-standards-authoring-baseline.txt"
  OUT_DIR="$REPO_ROOT/docs/testing-reports/project-standards-authoring-red"
fi
```

Add expected GREEN checks after run:

```bash
if [[ "$MODE" == "green" ]]; then
  rg -q "2-3|分类方案|classification" "$OUTPUT_FILE"
  rg -q "standards-context-retrieval|Constraints Summary" "$OUTPUT_FILE"
  rg -q ".cursor/rules/|docs/checklist/|reuse-inventory" "$OUTPUT_FILE"
  echo "[PASS] GREEN signals detected"
fi
```

- [ ] **Step 3: Run shell syntax check again**

Run: `bash -n tests/claude-code/test-project-standards-authoring.sh`  
Expected: command exits 0.

- [ ] **Step 4: Commit Task 3**

```bash
git add tests/claude-code/prompts/project-standards-authoring-green.txt \
  tests/claude-code/test-project-standards-authoring.sh
git commit -m "test: add GREEN mode checks for project-standards-authoring"
```

### Task 4: Capture Evidence and Update Testing Documentation

**Files:**
- Modify: `docs/testing.md`
- Create: `docs/testing-reports/project-standards-authoring-red/report.md`
- Create: `docs/testing-reports/project-standards-authoring-green/report.md`

- [ ] **Step 1: Run RED baseline and save artifacts**

Run:

```bash
cd tests/claude-code
./test-project-standards-authoring.sh red
```

Expected:
- Script completes.
- `docs/testing-reports/project-standards-authoring-red/claude-output.txt` exists.

- [ ] **Step 2: Write RED report**

Create `docs/testing-reports/project-standards-authoring-red/report.md`:

```markdown
# Project Standards Authoring RED Report

## Scenario
- Baseline run without explicit skill invocation.

## Observations
- [ ] Missing or weak classification-choice gate
- [ ] Missing or weak standards retrieval framing
- [ ] Premature artifact generation tendencies

## Evidence
- `claude-output.txt` snippets recorded from this run.

## Conclusion
- Baseline behavior is insufficiently constrained for reliable standards authoring.
```

- [ ] **Step 3: Run GREEN validation and save artifacts**

Run:

```bash
cd tests/claude-code
./test-project-standards-authoring.sh green
```

Expected:
- Script prints `[PASS] GREEN signals detected`.
- `docs/testing-reports/project-standards-authoring-green/claude-output.txt` exists.

- [ ] **Step 4: Write GREEN report**

Create `docs/testing-reports/project-standards-authoring-green/report.md`:

```markdown
# Project Standards Authoring GREEN Report

## Scenario
- Run with explicit `superpowers:project-standards-authoring` invocation.

## Observations
- [ ] 2-3 classification proposals presented first
- [ ] Human-choice gate respected
- [ ] standards-context-retrieval referenced per type
- [ ] Artifact paths and reuse inventory represented

## Evidence
- `claude-output.txt` snippets recorded from this run.

## Conclusion
- Skill-guided behavior matches staged constraints and output expectations.
```

- [ ] **Step 5: Update `docs/testing.md` with validation section**

Append to `docs/testing.md`:

```markdown
## Skill Validation: project-standards-authoring

Validation followed RED -> GREEN:

- RED baseline artifact: `docs/testing-reports/project-standards-authoring-red/report.md`
- GREEN artifact: `docs/testing-reports/project-standards-authoring-green/report.md`

Key checks:
- Classification proposals (2-3) before generation
- Mandatory human selection gate
- Per-type standards retrieval via `standards-context-retrieval`
- Output path discipline for rules/checklist/guides/reuse inventory
```

- [ ] **Step 6: Commit Task 4**

```bash
git add docs/testing.md \
  docs/testing-reports/project-standards-authoring-red/report.md \
  docs/testing-reports/project-standards-authoring-green/report.md \
  docs/testing-reports/project-standards-authoring-red/claude-output.txt \
  docs/testing-reports/project-standards-authoring-green/claude-output.txt
git commit -m "docs: add RED/GREEN validation evidence for project-standards-authoring"
```

### Task 5: Final Compliance Sweep

**Files:**
- Modify: `skills/project-standards-authoring/SKILL.md` (if needed from REFACTOR)

- [ ] **Step 1: Run placeholder scan**

Run:

```bash
rg -n "TODO|TBD|implement later|fill in details" \
  skills/project-standards-authoring/SKILL.md \
  skills/project-standards-authoring/templates.md \
  docs/testing-reports/project-standards-authoring-red/report.md \
  docs/testing-reports/project-standards-authoring-green/report.md
```

Expected:
- No matches.

- [ ] **Step 2: Validate required workflow clauses exist**

Run:

```bash
rg -n "2-3|human|standards-context-retrieval|reuse-inventory|quality gates" \
  skills/project-standards-authoring/SKILL.md
```

Expected:
- All required concepts appear in the skill text.

- [ ] **Step 3: Run repo lint/tests relevant to changed area**

Run:

```bash
cd tests/claude-code
bash -n test-project-standards-authoring.sh
```

Expected:
- Exit code 0.

- [ ] **Step 4: Commit REFACTOR adjustments (if any)**

```bash
git add skills/project-standards-authoring/SKILL.md
git commit -m "refactor: tighten project-standards-authoring constraints from validation"
```

(If no changes were needed, skip this commit.)

---

## Implementation Notes

- Keep the new skill repository-generic; do not encode project-specific business domains in examples.
- Keep examples short to avoid unnecessary token bloat in always-loaded contexts.
- If validation output volume is too large, keep full raw output in report directories and summarize only key snippets in `report.md`.

## Rollback Plan

- If the skill causes noisy or low-signal behavior, revert:
  - `skills/project-standards-authoring/*`
  - related `tests/claude-code/*project-standards-authoring*`
  - related `docs/testing-reports/project-standards-authoring-*`
  - `docs/testing.md` section for this skill

## Done Criteria

- New skill exists with strict stage-gated workflow and explicit anti-pattern handling.
- Template file exists for all required artifact classes.
- RED and GREEN evidence captured and documented.
- Testing docs updated with reproducible commands and artifact links.
- No placeholder text remains in added artifacts.
