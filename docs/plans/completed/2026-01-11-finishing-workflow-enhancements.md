# Finishing Workflow Enhancements Implementation Plan

> **Status:** ✅ COMPLETED - 2026-01-11
>
> **Implementation:** All 4 enhancements implemented successfully: pre-flight check for uncommitted changes, enhanced test verification with user prompts, code review as explicit option, and smart README section detection.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance `finishing-a-development-branch` and `documenting-completed-implementation` skills based on real-world usage feedback to reduce workflow friction and prevent common errors.

**Architecture:** Add pre-flight checks, improve test failure handling, add code review as explicit option, and prevent redundant README updates through section detection.

**Tech Stack:** Bash scripting for git operations, markdown for skill documentation, grep for README detection.

---

## Task 1: Add Pre-flight Check to finishing-a-development-branch

**Files:**
- Modify: `skills/finishing-a-development-branch/SKILL.md`

**Step 1: Read the current skill content**

Read the entire `skills/finishing-a-development-branch/SKILL.md` to understand current structure.

**Step 2: Add Step 0 section before current Step 1**

Insert new Step 0 after the checklist but before the current Step 1:

```markdown
### Step 0: Pre-flight Check

**Verify clean working directory before starting:**

```bash
git status --short
```

**If output is empty:** Working directory is clean, proceed to Step 1.

**If uncommitted changes exist:** Present options to user:

```
⚠️  You have uncommitted changes:

[Show git status output]

What would you like to do?

1. Commit them now (recommended)
2. Stash them temporarily
3. Cancel - I'll handle this manually

Which option?
```

**Option 1 selected - Commit changes:**
```bash
git add -A
git commit -m "work in progress: preparing to finish branch"
```

**Option 2 selected - Stash changes:**
```bash
git stash push -m "WIP before finishing branch"
```

**Option 3 selected - Cancel:**
Stop the workflow. Report to user: "Please handle uncommitted changes, then run this skill again."

**Only proceed to Step 1 if working directory is clean.**
```

**Step 3: Update step numbers**

Renumber all subsequent steps:
- Old Step 1 → Step 1 (stays the same, about reading plan)
- Old Step 2 → Step 2 (verify tests)
- Old Step 3 → Step 3 (present options)
- Etc.

**Step 4: Verify markdown formatting**

Read the modified file to ensure:
- Proper heading hierarchy
- Code blocks are properly closed
- No formatting issues

**Step 5: Commit**

```bash
git add skills/finishing-a-development-branch/SKILL.md
git commit -m "feat: add pre-flight check to finishing workflow

Catches uncommitted changes before starting workflow to prevent
mid-flow failures during git checkout operations."
```

---

## Task 2: Enhance Test Verification in finishing-a-development-branch

**Files:**
- Modify: `skills/finishing-a-development-branch/SKILL.md`

**Step 1: Locate Step 2 (Verify Tests)**

Find the current Step 2 "Verify Tests" section in the skill.

**Step 2: Replace test verification section**

Replace the current Step 2 content with enhanced version:

```markdown
### Step 2: Verify Tests

**Run the project's test suite:**

Determine the test command from project structure:
- `package.json` → `npm test`
- `Cargo.toml` → `cargo test`
- `go.mod` → `go test ./...`
- `pytest.ini` or `setup.py` → `pytest`

```bash
[appropriate test command]
```

**Interpret test results:**

**If all tests pass:**
```
✅ All tests passed ([N] tests)

Proceeding to next step.
```

Continue to Step 3.

**If tests fail:**

Show the failure output, then prompt user:

```
❌ Tests failed ([N] failures)

[Show failure summary - first 20 lines of failures]

Are these failures due to:

1. Missing configuration (.env, credentials, database setup) - safe to merge
2. Actual bugs in the code - must fix before merging

Which applies?
```

**Option 1 selected (configuration issues):**
```
⚠️  Tests require environment setup but that's expected for this project.

Examples of config-dependent tests:
- Integration tests requiring API credentials
- Database tests requiring local DB
- AWS Lambda tests requiring credentials

✅ Proceeding with merge (configuration issues are acceptable)
```

Continue to Step 3.

**Option 2 selected (actual bugs):**
```
❌ Cannot proceed with merge until test failures are fixed.

Please fix the failing tests, then run this skill again.
```

Stop workflow. Do not proceed to next steps.
```

**Step 3: Verify the enhanced section**

Read the modified Step 2 to ensure:
- Clear decision tree for test failures
- Appropriate use of user prompts
- Proper formatting

**Step 4: Commit**

```bash
git add skills/finishing-a-development-branch/SKILL.md
git commit -m "feat: enhance test verification in finishing workflow

Adds user prompt to distinguish between configuration-related test
failures (safe to merge) and actual bugs (must fix). Prevents
confusion when integration tests fail due to missing .env files."
```

---

## Task 3: Add Code Review as Explicit Option

**Files:**
- Modify: `skills/finishing-a-development-branch/SKILL.md`

**Step 1: Locate Step 3 (Present Options)**

Find the current Step 3 where workflow options are presented to the user.

**Step 2: Add code review to options list**

Modify the options presentation to include code review as option 2:

```markdown
### Step 3: Present Completion Options

**Present exactly these options:**

```
✅ Implementation complete and tests verified.

What would you like to do?

1. Merge back to <base-branch> locally
2. Request code review before merging
3. Push and create a Pull Request
4. Keep the branch as-is (I'll handle it later)
5. Discard this work

Which option?
```
```

**Step 3: Add Option 2 handler section**

After the current Option 1 handler, add Option 2 handler:

```markdown
#### Option 2: Request Code Review

**Invoke code review skill:**

Use the `superpowers:requesting-code-review` skill to prepare code review request.

**After code review is complete:**

Return to this workflow and present options again:

```
Code review complete. What would you like to do now?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

Then follow the handler for the selected option (1, 3, 4, or 5 from original numbering).
```

**Step 4: Update option numbers in handlers**

Update the subsequent option handlers:
- Old Option 2 → Option 3 (Push and create PR)
- Old Option 3 → Option 4 (Keep branch as-is)
- Old Option 4 → Option 5 (Discard work)

**Step 5: Verify all option handlers updated**

Read through all option handlers to ensure numbers are consistent.

**Step 6: Commit**

```bash
git add skills/finishing-a-development-branch/SKILL.md
git commit -m "feat: add code review as explicit option in finishing workflow

Adds code review as option 2 in the completion workflow, allowing
users to explicitly request review before merging. This is an
opt-in choice rather than an auto-detected gate."
```

---

## Task 4: Add Smart README Check to documenting-completed-implementation

**Files:**
- Modify: `skills/documenting-completed-implementation/SKILL.md`

**Step 1: Read the current documenting skill**

Read `skills/documenting-completed-implementation/SKILL.md` to understand current Step 3 (Update README.md).

**Step 2: Enhance Step 3 with README section detection**

Replace the current Step 3 with enhanced version that checks for existing documentation:

```markdown
### Step 3: Update README.md

**First, check if README already documents this feature:**

Extract feature name from plan file:
```bash
# Get plan filename without path and extension
PLAN_FILE="docs/plans/YYYY-MM-DD-feature-name.md"
FEATURE_NAME=$(basename "$PLAN_FILE" .md | sed 's/^[0-9-]*-//' | sed 's/-/ /g')
```

**Check for dedicated section in README:**
```bash
# Look for section headers mentioning the feature
grep -i "^## .*${FEATURE_NAME}" README.md
grep -i "^### .*${FEATURE_NAME}" README.md
```

**Decision tree:**

| Section Found | Documentation State | Action |
|---------------|---------------------|--------|
| Yes (## or ###) | Comprehensive section exists | Skip update, note to user |
| No | Missing or only brief mentions | Add documentation |

**If section exists:**
```
✅ README.md already has a dedicated section for <feature>

Found section: [show matching header]

Skipping README update. Review the existing section to ensure it's current.
```

Proceed to Step 4.

**If no section found:**

Add user-facing documentation following these guidelines:

**What to document:**
- Feature purpose (what it does, why it exists)
- How to use it (examples, commands, configuration)
- Any setup required (environment variables, credentials)
- Related features or dependencies

**Where to add it:**
- Features section (if one exists)
- Before the "Development" or "Contributing" section
- At the end of user-facing content (before technical sections)

**Format:**
```markdown
## [Feature Name]

[Brief description of what this feature does]

### Usage

[Concrete examples showing how to use it]

### Configuration

[Any setup, environment variables, or options]
```

**Example for Todoist integration:**
```markdown
## Todoist Integration

The calendar prep system can output your schedule to Todoist, creating tasks for each event.

### Usage

Run the output Lambda:
```bash
npm run output:todoist
```

### Configuration

Set these environment variables in `.env`:
- `TODOIST_API_TOKEN` - Your Todoist API token
- `TODOIST_PROJECT_ID` - Target project ID (optional, defaults to Inbox)
```
```

**Step 3: Verify the enhanced section**

Read the modified Step 3 to ensure:
- Clear section detection logic
- Proper decision tree
- Good documentation examples

**Step 4: Commit**

```bash
git add skills/documenting-completed-implementation/SKILL.md
git commit -m "feat: add smart README check to documenting skill

Checks for existing dedicated sections in README before adding
documentation. Prevents redundant updates when comprehensive
docs already exist. Uses section header detection (## or ###)
rather than line counting."
```

---

## Task 5: Update Improvement Proposal Status

**Files:**
- Modify: `docs/improvement-proposals/2026-01-11-finishing-workflow-enhancements.md`

**Step 1: Add implementation status section**

At the top of the improvement proposal (after the header), add implementation status:

```markdown
## Implementation Status

**Date Implemented:** 2026-01-11

**Implemented:**
- ✅ Step 0: Pre-flight check for uncommitted changes
- ✅ Step 2: Enhanced test verification with user prompt
- ✅ Step 3.5: Code review as explicit option (not auto-gate)
- ✅ Step 3 (documenting): Smart README section detection

**Not Implemented (Rationale):**
- ❌ Step 2.5: Auto-invoke verification-before-completion (wrong tool for job - that skill is about claim verification, not pre-merge checks)
- ❌ Step 5: Remote push prompt (scope creep, decision fatigue)
- ❌ New pre-merge-verification skill (skill proliferation)

**Changes from Original Proposal:**
- Test verification uses user prompt instead of auto-categorizing unit vs integration tests (simpler, more reliable)
- README check uses section header detection instead of line counting (more accurate)
- Code review added as explicit option rather than auto-detected gate (preserves user agency)

---
```

**Step 2: Commit**

```bash
git add docs/improvement-proposals/2026-01-11-finishing-workflow-enhancements.md
git commit -m "docs: mark finishing workflow enhancements as implemented

Documents which enhancements were implemented and rationale
for changes from original proposal."
```

---

## Task 6: Test the Enhanced Workflows

**Files:**
- Manual testing using the enhanced skills

**Step 1: Test pre-flight check**

Create a test scenario:
```bash
# Create some uncommitted changes
echo "test" > test-file.txt
git status
```

**Step 2: Run finishing skill and verify pre-flight**

Expected behavior:
- Skill should detect uncommitted changes
- Present 3 options (commit/stash/cancel)
- Execute selected option correctly

**Step 3: Test enhanced test verification**

In a project with tests, run the finishing skill.

Expected behavior:
- If tests pass: proceed automatically
- If tests fail: prompt user for configuration vs bug decision
- Block merge if user indicates actual bugs

**Step 4: Test code review option**

Run finishing skill and verify:
- Code review appears as option 2
- Selecting it invokes requesting-code-review skill
- Returns to options after review complete

**Step 5: Test smart README check**

Run documenting skill on a feature that already has README section.

Expected behavior:
- Skill detects existing section
- Skips README update
- Reports which section was found

**Step 6: Document test results**

Note any issues or unexpected behavior for potential refinement.

---

## Verification Steps

After all tasks complete:

1. **Skill coherence:** Read both modified skills end-to-end to ensure flow makes sense
2. **Step numbering:** Verify all step numbers are sequential and referenced correctly
3. **Code blocks:** Ensure all bash/markdown code blocks are properly formatted
4. **Cross-references:** Check that skill references (e.g., to requesting-code-review) are correct
5. **User experience:** Walk through each new workflow mentally to catch any confusing language

---

## Success Criteria

- ✅ Pre-flight check catches uncommitted changes before workflow starts
- ✅ Test failures prompt clear user decision (config vs bug)
- ✅ Code review is available as explicit opt-in choice
- ✅ README check prevents redundant documentation when section exists
- ✅ All enhancements maintain skill minimalism (no excessive complexity)
- ✅ Skills remain under 500-600 words where possible

---

## Notes

**Philosophy alignment:**
- All enhancements are additive (no breaking changes)
- Maintains user agency (prompts for decisions, doesn't auto-decide)
- Fail-fast approach (pre-flight check)
- Simple implementations (grep for sections, user prompts vs auto-detection)

**Future considerations:**
- Could add `.claude/test-config.json` for project-specific test requirements
- Could add configuration for code review default behavior (team vs solo mode)
- Monitor usage to see if remote push prompt is actually needed