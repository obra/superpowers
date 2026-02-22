# Harness Contribution Execution Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Land one low-friction upstream harness contribution in `obra/superpowers` and launch a standalone harness plugin with a compatibility profile, so impact compounds even if upstream cadence is slow.

**Architecture:** Execute in two tracks. Track A ships a narrow, mergeable upstream slice tied to issue `#455`. Track B builds the independent plugin with a `superpowers-compatible` profile using the same contract language (determinism, JSON artifacts, failure taxonomy).

**Tech Stack:** Markdown skills/docs, shell test harness, GitHub CLI (`gh`), optional Go CLI for plugin checks.

---

### Task 1: Create Upstream Issue Alignment Brief

**Files:**
- Create: `docs/plans/2026-02-22-issue-455-harness-proposal.md`
- Test: `docs/plans/2026-02-22-issue-455-harness-proposal.md`

**Step 1: Write proposal brief with acceptance criteria**

```md
# Issue #455 Proposal: Deterministic End-to-End Validation Skill

## Problem
Current workflows often stop at unit/integration confidence, not user-path validation.

## Proposed minimal upstream scope
1. Add `skills/end-to-end-validation/SKILL.md`
2. Add deterministic command contract + JSON artifact expectations
3. Add a lightweight smoke check script for skill structure

## Non-goals
- No cross-provider framework rewrite
- No strict global enforcement on all workflows

## Acceptance criteria
- Skill exists and is discoverable
- Smoke check passes locally
- README references new skill
```

**Step 2: Verify file exists and has key sections**

Run: `rg -n "Problem|Proposed minimal upstream scope|Acceptance criteria" docs/plans/2026-02-22-issue-455-harness-proposal.md`
Expected: 3+ matching lines

**Step 3: Post to issue #455**

Run: `gh issue comment 455 -R obra/superpowers --body-file docs/plans/2026-02-22-issue-455-harness-proposal.md`
Expected: comment URL printed

**Step 4: Commit**

```bash
git add docs/plans/2026-02-22-issue-455-harness-proposal.md
git commit -m "docs: add issue #455 harness proposal brief"
```

### Task 2: Add Minimal `end-to-end-validation` Skill (Upstream Slice)

**Files:**
- Create: `skills/end-to-end-validation/SKILL.md`
- Modify: `README.md`
- Test: `skills/end-to-end-validation/SKILL.md`

**Step 1: Write failing check command (skill missing)**

Run: `test -f skills/end-to-end-validation/SKILL.md && echo "unexpected exists" || echo "missing as expected"`
Expected: `missing as expected`

**Step 2: Add skill with deterministic contract and failure taxonomy**

```md
---
name: end-to-end-validation
description: Validate user-visible behavior with deterministic commands and evidence artifacts before final completion.
---

# End-to-End Validation

## Trigger
Use before claiming a feature works for real user flows.

## Required command contract
1. Identify one canonical e2e command.
2. Run command with deterministic env vars.
3. Save output artifact JSON.
4. Report pass/fail with evidence.

## Failure taxonomy
- CONFIG_ERROR
- ENV_ERROR
- CHECK_FAIL
- NON_DETERMINISM
- INTERNAL_ERROR
```

**Step 3: Add skill to README skills list**

Add one bullet under Skills Library:

```md
- **end-to-end-validation** - Validate real user-path behavior with deterministic evidence
```

**Step 4: Verify skill discovery text is present**

Run: `rg -n "end-to-end-validation" skills/end-to-end-validation/SKILL.md README.md`
Expected: matches in both files

**Step 5: Commit**

```bash
git add skills/end-to-end-validation/SKILL.md README.md
git commit -m "feat: add end-to-end-validation skill for deterministic user-path checks"
```

### Task 3: Add Lightweight Smoke Check for New Skill

**Files:**
- Create: `tests/skills/test-end-to-end-validation-skill.sh`
- Modify: `tests/README.md`
- Test: `tests/skills/test-end-to-end-validation-skill.sh`

**Step 1: Write failing test scaffold**

```bash
#!/usr/bin/env bash
set -euo pipefail

SKILL_FILE="skills/end-to-end-validation/SKILL.md"

test -f "$SKILL_FILE"
rg -q '^name: end-to-end-validation$' "$SKILL_FILE"
rg -q 'Failure taxonomy' "$SKILL_FILE"
```

**Step 2: Run test and verify pass**

Run: `bash tests/skills/test-end-to-end-validation-skill.sh`
Expected: exit code `0` with no output

**Step 3: Document the smoke test command**

Add to `tests/README.md`:

```md
## Skill Smoke Checks
- `bash tests/skills/test-end-to-end-validation-skill.sh`
```

**Step 4: Commit**

```bash
git add tests/skills/test-end-to-end-validation-skill.sh tests/README.md
git commit -m "test: add smoke check for end-to-end-validation skill"
```

### Task 4: Open Focused Upstream PR

**Files:**
- Create: `docs/plans/2026-02-22-pr-body-end-to-end-validation.md`
- Test: `docs/plans/2026-02-22-pr-body-end-to-end-validation.md`

**Step 1: Draft PR body**

```md
## What
Add `end-to-end-validation` skill + minimal smoke check.

## Why
Addresses issue #455: workflow gap for real user-path validation.

## How
- New skill file with deterministic command contract
- README skills list update
- Shell smoke check for skill structure

## Non-goals
- No framework-wide behavior change

## Verification
- `bash tests/skills/test-end-to-end-validation-skill.sh`
```

**Step 2: Push branch and create PR**

Run:
```bash
git push -u origin <branch>
gh pr create -R obra/superpowers \
  --title "feat: add end-to-end-validation skill" \
  --body-file docs/plans/2026-02-22-pr-body-end-to-end-validation.md
```
Expected: PR URL printed

**Step 3: Track checks and feedback loop**

Run:
```bash
gh pr checks <pr-number> -R obra/superpowers
gh pr view <pr-number> -R obra/superpowers --comments
```
Expected: checks/status summary + reviewer comments

### Task 5: Bootstrap Standalone Plugin Repository

**Files:**
- Create: `~/github/harness-engineering-plugin/README.md`
- Create: `~/github/harness-engineering-plugin/.harness-engineering.json`
- Create: `~/github/harness-engineering-plugin/schemas/smoke-output.schema.json`
- Test: `~/github/harness-engineering-plugin/README.md`

**Step 1: Initialize repo and baseline docs**

Run:
```bash
cd ~/github
git clone https://github.com/gh-xj/harness-engineering-plugin.git || mkdir -p harness-engineering-plugin
cd harness-engineering-plugin
git init
```
Expected: git repo initialized

**Step 2: Add compatibility profile config**

```json
{
  "profiles": {
    "superpowers-compatible": {
      "canonical_command": "task ci",
      "artifact_path": "artifacts/harness/smoke.json",
      "strictness": "minimal"
    }
  }
}
```

**Step 3: Add smoke output schema**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["run_id", "status", "checks"],
  "properties": {
    "run_id": {"type": "string"},
    "status": {"type": "string", "enum": ["pass", "fail"]},
    "checks": {"type": "array", "items": {"type": "object"}}
  }
}
```

**Step 4: Commit**

```bash
git add README.md .harness-engineering.json schemas/smoke-output.schema.json
git commit -m "feat: bootstrap harness plugin with superpowers-compatible profile"
```

### Task 6: Implement Plugin CLI Smoke Validator

**Files:**
- Create: `~/github/harness-engineering-plugin/cmd/harness-check/main.go`
- Create: `~/github/harness-engineering-plugin/internal/check/check.go`
- Create: `~/github/harness-engineering-plugin/internal/check/check_test.go`
- Test: `~/github/harness-engineering-plugin/internal/check/check_test.go`

**Step 1: Write failing test for missing required fields**

```go
func TestValidateSmokeOutput_MissingStatus(t *testing.T) {
    payload := []byte(`{"run_id":"abc","checks":[]}`)
    err := ValidateSmokeOutput(payload)
    if err == nil {
        t.Fatal("expected error for missing status")
    }
}
```

**Step 2: Run test to verify fail state first (red)**

Run: `go test ./internal/check -run TestValidateSmokeOutput_MissingStatus -v`
Expected: FAIL before implementation

**Step 3: Implement minimal validator (green)**

```go
func ValidateSmokeOutput(payload []byte) error {
    var raw map[string]any
    if err := json.Unmarshal(payload, &raw); err != nil {
        return err
    }
    for _, key := range []string{"run_id", "status", "checks"} {
        if _, ok := raw[key]; !ok {
            return fmt.Errorf("missing required field: %s", key)
        }
    }
    return nil
}
```

**Step 4: Re-run tests**

Run: `go test ./internal/check -v`
Expected: PASS

**Step 5: Commit**

```bash
git add cmd/harness-check/main.go internal/check/check.go internal/check/check_test.go
git commit -m "feat: add smoke artifact validator"
```

### Task 7: Publish Plugin and Cross-Link with Upstream

**Files:**
- Modify: `~/github/harness-engineering-plugin/README.md`
- Modify: `docs/plans/2026-02-22-pr-body-end-to-end-validation.md`
- Test: `~/github/harness-engineering-plugin/README.md`

**Step 1: Add cross-link section in plugin README**

```md
## Upstream Baseline
For minimal in-repo adoption, see `obra/superpowers` skill: `end-to-end-validation`.
Use this plugin for stricter contracts, richer diagnostics, and schema-governed artifacts.
```

**Step 2: Add “advanced mode” link in upstream PR discussion**

Run: `gh pr comment <pr-number> -R obra/superpowers --body "Advanced profile/plugin reference: <plugin-url>"`
Expected: comment posted

**Step 3: Commit plugin README update**

```bash
git -C ~/github/harness-engineering-plugin add README.md
git -C ~/github/harness-engineering-plugin commit -m "docs: add upstream baseline and advanced mode positioning"
```

### Task 8: 90-Day Metrics Checkpoint Setup

**Files:**
- Create: `docs/plans/2026-02-22-harness-impact-metrics.md`
- Test: `docs/plans/2026-02-22-harness-impact-metrics.md`

**Step 1: Add metric table**

```md
# Harness Impact Metrics

| Metric | Target | Current | Source |
|---|---:|---:|---|
| Upstream merged PRs | 1 | 0 | `gh pr list -R obra/superpowers --author @me --state merged` |
| Plugin active repos/users | 3 | 0 | Manual onboarding log |
| Cross-links upstream<->plugin | 2 | 0 | PR/README URLs |
```

**Step 2: Verify command snippets are runnable**

Run: `rg -n "gh pr list|Plugin active repos|Cross-links" docs/plans/2026-02-22-harness-impact-metrics.md`
Expected: 3+ matches

**Step 3: Commit**

```bash
git add docs/plans/2026-02-22-harness-impact-metrics.md
git commit -m "docs: add harness impact metrics tracker"
```
