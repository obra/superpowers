# Finishing Workflow Enhancements

**Date:** 2026-01-11
**Author:** Retrospective analysis from calendar-prep-mvp Todoist implementation
**Skills Affected:** `finishing-a-development-branch`, `documenting-completed-implementation`

## Problem Statement

During a real-world feature merge (Todoist output Lambda implementation), several workflow gaps were identified that made the process less smooth than it could be:

1. **Uncommitted changes blocked checkout** - no pre-flight check
2. **Test failures were ambiguous** - no clear guidance on unit vs integration tests
3. **Code review was skipped** - no prompt for major features
4. **Documentation redundancy** - README already documented feature, but skill didn't check
5. **`verification-before-completion` skill wasn't invoked** - even though it exists and applies

## Proposed Solutions

### 1. Enhancement: `finishing-a-development-branch`

Add these improvements:

#### Step 0: Pre-flight Check (NEW)

```markdown
### Step 0: Pre-flight Check

**Before starting, verify clean state:**

```bash
git status --short
```

**If uncommitted changes exist:**

```
You have uncommitted changes. What would you like to do?

1. Commit them now (recommended)
2. Stash them
3. Cancel and let me handle manually

Which option?
```

**Option 1 selected:**
```bash
git add -A
git commit -m "work in progress: preparing to finish branch"
```

**Option 2 selected:**
```bash
git stash push -m "WIP before finishing branch"
```

**Option 3 selected:** Stop and report to user.

**Only proceed if working directory is clean.**
```

#### Step 2: Enhanced Test Verification

```markdown
### Step 2: Verify Tests

**Run the project's test suite:**

```bash
npm test  # or cargo test, go test, pytest, etc.
```

**Interpret results:**

| Test Type | Failure Behavior | Action |
|-----------|------------------|--------|
| **Unit tests** | Must pass | Block merge, show failures |
| **Integration tests** | May require env setup | Check if `.env` exists |
| **E2E tests** | Often skipped in CI | Optional for merge |

**If tests fail with env errors** (e.g., "No .env file found"):

```
Integration tests require configuration but unit tests passed.

This is common for features that need:
- API credentials
- Database connections
- AWS credentials

✅ Core business logic tests: PASSED
⚠️  Integration tests: SKIPPED (missing .env)

Proceed with merge? (y/n)
```

**If core unit tests fail:**

```
❌ Tests failing (N failures). Must fix before completing:

[Show failures]

Cannot proceed with merge/PR until tests pass.
```

Stop. Don't proceed to next steps.
```

#### Step 2.5: Invoke verification-before-completion (NEW)

```markdown
### Step 2.5: Pre-Merge Verification

**REQUIRED: Invoke verification skill before presenting options**

```
Skill tool: verification-before-completion
```

This runs systematic checks:
- Test suite execution and verification
- Lint/type checking (if configured)
- Documentation completeness
- No uncommitted changes (redundant with Step 0, but defensive)

**Only proceed if verification passes.**
```

#### Step 3.5: Code Review Gate (NEW)

```markdown
### Step 3.5: Code Review Decision (For Major Features)

**Check if this is a major feature:**

Indicators:
- Plan file exists in `docs/plans/`
- Multiple files changed (>10)
- New system component added
- Breaking changes or API modifications

**If major feature, offer code review:**

```
This looks like a major feature. Consider code review before merging.

Options:
1. Request code review now (recommended)
2. Skip code review and proceed to merge
3. I'll handle review separately

Which option?
```

**Option 1:** Invoke `requesting-code-review` skill, then return to finish flow
**Option 2/3:** Proceed to Step 4 (Present merge options)
```

#### Step 4: Enhanced Merge Options

```markdown
### Step 4: Present Options

Present exactly these options:

```
Implementation complete. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```
```

#### Step 5: Option 1 Enhancement - Push to Remote

```markdown
#### Option 1: Merge Locally

```bash
git checkout <base-branch>
git pull  # If remote exists
git merge <feature-branch>

# Verify tests on merged result
<test command>

# If tests pass
git branch -d <feature-branch>
```

**Then check for remote:**

```bash
git remote -v
```

**If remote exists, offer to push:**

```
Branch merged successfully to <base-branch>.

Remote detected: <remote-url>

Push to remote? (y/n)
```

**If yes:**
```bash
git push origin <base-branch>
```

**Then:** Cleanup worktree (Step 6)
```

### 2. Enhancement: `documenting-completed-implementation`

Add smart README check:

#### Step 3: Update README.md (ENHANCED)

```markdown
### Step 3: Update README.md

**First, check if README already documents this feature:**

```bash
# Extract feature name from plan file (e.g., "Todoist" from "implement-todoist-output-lambda")
FEATURE_NAME=$(basename "$PLAN_FILE" | sed 's/implement-//' | sed 's/-output.*//' | sed 's/-lambda//')

# Check if comprehensive documentation exists
grep -i "$FEATURE_NAME" README.md | wc -l
```

**Decision tree:**

| Lines Found | Documentation State | Action |
|-------------|---------------------|--------|
| 0 | Missing | Add documentation |
| 1-5 | Minimal mention | Enhance with examples |
| 10+ | Comprehensive | Skip (note: "README already documents X") |

**If comprehensive documentation exists:**

```
✅ README.md already has comprehensive <feature> documentation (20+ lines found).

Skipping README update.
```

**If missing or minimal:**

Add user-facing documentation per existing guidance.
```

### 3. New Skill Proposal: `pre-merge-verification`

**Purpose:** Systematic verification before any merge/PR

**When to use:** Called by `finishing-a-development-branch` at Step 2.5

**What it does:**

```markdown
---
name: pre-merge-verification
description: Systematic verification before merge - runs tests, checks lint, verifies docs
---

## Pre-Merge Verification Checklist

### 1. Working Directory Clean

```bash
git status --short
```

**Must be empty.** If not, error and stop.

### 2. Core Tests Pass

```bash
# Determine test command from package.json, Cargo.toml, go.mod, etc.
npm test  # or appropriate command
```

**Parse output:**
- Unit tests: Must pass (exit 0)
- Integration tests: Optional (may fail due to .env)
- E2E tests: Optional

**Report:**
```
✅ Unit tests: PASSED (24/24)
⚠️  Integration tests: SKIPPED (requires .env setup)
```

### 3. Lint/Type Check (Optional)

**If configured:**
```bash
npm run lint      # ESLint, Clippy, golangci-lint
npm run typecheck # TypeScript, mypy
```

**If fails:** Report but don't block (configurable per-project)

### 4. Documentation Completeness

**Check README mentions the feature:**
```bash
grep -i "<feature-name>" README.md
```

**If not found:** Warn but don't block

### 5. Generate Report

```
🔍 Pre-Merge Verification Report

Working Directory: ✅ Clean
Unit Tests: ✅ PASSED (24/24)
Integration Tests: ⚠️  SKIPPED (env required)
Lint: ✅ PASSED
Type Check: ✅ PASSED
Documentation: ✅ Found in README

✅ READY FOR MERGE
```

**Return:** Pass/fail + report

```

## Real-World Evidence

**Source:** calendar-prep-mvp Todoist implementation (2026-01-10)

**What happened:**
1. ❌ Uncommitted changes blocked `git checkout master` mid-flow
2. ⚠️ Lambda tests failed with "No .env found" but core tests passed - ambiguous if merge-ready
3. ❌ `verification-before-completion` skill exists but wasn't invoked
4. ⚠️ README already had comprehensive Todoist docs, but skill attempted to update it
5. ⚠️ No code review prompt for a major feature (complete Todoist integration)
6. ℹ️ After merge to master, no push to remote (may be intentional, but worth asking)

**With proposed enhancements:**
- ✅ Step 0 would catch uncommitted changes immediately
- ✅ Step 2 would clarify "unit tests pass, integration tests skipped = OK to merge"
- ✅ Step 2.5 would invoke verification automatically
- ✅ Step 3 (in documenting skill) would detect existing README docs and skip
- ✅ Step 3.5 would offer code review for major feature
- ✅ Step 5 would prompt to push to remote

## Backward Compatibility

All enhancements are **additive**:
- Existing workflows continue to work
- New steps provide better UX but don't break old behavior
- Skills remain composable

## Implementation Priority

**High Priority:**
1. Step 0: Pre-flight check (prevents mid-flow errors)
2. Step 2: Enhanced test verification (reduces confusion)
3. Step 2.5: Auto-invoke verification-before-completion (existing skill, just wire it up)

**Medium Priority:**
4. Step 3.5: Code review gate (valuable for teams)
5. Enhanced README check in `documenting-completed-implementation`

**Low Priority:**
6. New `pre-merge-verification` skill (nice-to-have, but can be done with existing tools)

## Questions for Maintainers

1. **Test strategy:** Should we support a `.claude/test-config.json` to specify which tests are required vs optional?

   ```json
   {
     "tests": {
       "required": ["npm run test:unit"],
       "optional": ["npm run test:integration"],
       "before_merge": true
     }
   }
   ```

2. **Code review:** Should code review be:
   - Always prompted for major features (auto-detect)
   - Configured per-project
   - Skipped by default (opt-in via flag)

3. **Remote push:** After local merge, should we:
   - Always prompt to push (if remote exists)
   - Never prompt (user handles it)
   - Configurable per-project

## Related Skills

- ✅ `verification-before-completion` - exists, just needs wiring
- ✅ `requesting-code-review` - exists, add as optional gate
- ✅ `finishing-a-development-branch` - enhance per proposal
- ✅ `documenting-completed-implementation` - add README smart check

---

**Recommendation:** Implement high-priority enhancements first. They're low-risk, high-value improvements based on real-world usage.