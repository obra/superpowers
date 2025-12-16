---
name: writing-plans
description: Use when design is complete and you need detailed implementation tasks - creates comprehensive plans with exact file paths, complete code examples, and verification steps. CRITICAL - invokes wrapper script that forces file writing - "create a plan" means invoke wrapper and write file, NOT describe in chat. SCOPE - this skill ONLY writes plans, never executes them. Mechanically enforced via lock file (attempting bypass = error).
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**FIRST ACTION (mandatory):** Invoke wrapper script - DO NOT describe plan in chat first:

```bash
python3 ~/.claude/scripts/writing-plans/write_plan.py \
  --working-dir <working-directory> \
  --plan-name <descriptive-name>
```

**Mechanical enforcement:** Wrapper creates lock file enabling Write tool for implementation plans. Attempting to write without invoking wrapper will fail.

**Production incident:** 2025-12-13 - Agent skipped wrapper despite warnings. File never registered with file-track. Now mechanically enforced via lock file pattern.

**DO NOT before invoking wrapper:**
- Describe plan content in chat
- "Show" the plan structure
- Output plan deliverables/tasks
- List what the plan will contain

**"Create a plan" = invoke wrapper script immediately. Nothing else.**

**Execution Mode:** This skill has an executable wrapper that FORCES file writing.

**How it works:**
1. You invoke the wrapper script: `~/.claude/scripts/writing-plans/write_plan.py`
2. The wrapper prints directives: "USE WRITE TOOL to create file at X"
3. You MUST follow the directives - no describing, only executing
4. The wrapper guides you through post-write workflow

**Context:** This should be run in a dedicated worktree (created by brainstorming skill).

**Save plans to:**
- **In plan mode:** Write to `~/.claude/plans/<plan-name>.md` (staging area, as specified by plan mode system prompt)
- **In regular mode:** Write to `<working-directory>/<target-dir>/<plan-name>.md`
  - Default: `<working-directory>/llm/implementation-plans/<plan-name>.md`
  - Configurable via `--target-dir` parameter

**Note:** The target directory structure is workflow-specific. The default assumes an `llm/` directory pattern, but this can be customized for projects with different conventions.

**Note:** After writing, the file will be renamed to `YYMMDDXX-<slug>.md` format by the rename script (where YYMMDD is year/month/day, XX is auto-sequenced). If written to staging area, it must be copied to the working directory's target directory before rename.

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---
```

**IMPORTANT:** The "For Claude" instruction above is FOR THE EXECUTOR (future session using executing-plans), NOT for writing-plans. When you write this header, you are creating instructions for a future Claude - not instructions for yourself.

## File Requirements

**Every plan file MUST include these elements:**

1. **First line:** `<!-- jot:md-rename -->` (required for rename script detection)

2. **YAML frontmatter** (required for metadata and indexing):
   ```yaml
   ---
   title: Clear, descriptive title
   date: YYYY-MM-DD  # Current date
   type: implementation-plan
   status: draft      # Or: active, completed, archived
   tags: [relevant, tags, here]
   project: PROJECT-KEY  # Optional: e.g., NPCP-2495
   phase: ep001          # Optional: project phase
   ---
   ```

3. **H1 heading:** Feature name

4. **Header section:** Goal, Architecture, Tech Stack (as shown above)

**If a Jira ticket is referenced** (e.g., NPCP-1234), it will be included at the beginning of the final filename: `YYMMDDXX-NPCP-1234-<slug>.md`

## Path Requirements

- ✅ **ALWAYS use absolute paths**: `<working-directory>/<target-dir>/file.md`
- ❌ **NEVER use relative paths**: `llm/implementation-plans/file.md`
- **Default target directory**: `llm/implementation-plans/` (can be overridden with `--target-dir`)
- **Git repository awareness**: Files are tracked relative to repository root, handling nested git repos correctly

The working directory is shown as "Working directory" in the environment context at the start of each conversation.

**Workflow flexibility:** While the default assumes an `llm/` subdirectory pattern, the scripts now support any directory structure within a git repository. Use `--target-dir` to specify custom locations (e.g., `docs/plans/`, `planning/implementation/`).

**Nested git repositories:** If llm/ is its own git repository (has llm/.git), the tooling automatically finds the parent repository to ensure correct path tracking.

## Repository Detection

The writing-plans scripts automatically detect the git repository root and handle nested git repositories:

**Nested llm/ repositories:** If your llm/ directory is its own git repository (common pattern for keeping ephemeral docs separate), the scripts automatically skip past it to find the parent repository. This ensures file paths are tracked relative to the main project repository, not the nested llm/ repo.

**Example:**
- Working in `/Users/name/project/.claude/llm/plans/`
- llm/ has its own `.git` directory (nested repo)
- Scripts find parent `/Users/name/project/.claude/` (main repo)
- Paths reported as `llm/plans/file.md` (relative to main repo)

**Custom usage:**
```bash
python3 ~/.claude/scripts/writing-plans/write_plan.py \
    --working-dir /path/to/repo \
    --plan-name my-feature \
    --target-dir docs/architecture
```

This flexibility allows the writing-plans skill to work with different project organizational conventions while maintaining backward compatibility with existing "llm/" workflows.

## Enforcement Mechanism

**Lock file pattern:**
1. Wrapper creates `.writing-plans-active` in working directory
2. Lock file contains authorized file path
3. Write tool can only create plan if lock exists (future: full integration)
4. Rename script removes lock after complete workflow

**Current enforcement layers:**
- Lock file created by wrapper (implemented)
- Git pre-commit hook catches format violations (implemented)
- Future: Write tool gating for complete prevention

**Manual check (optional):**
```bash
python3 ~/.claude/scripts/writing-plans/check_lock.py \
  <working-dir> <file-path>
```

## Task Structure

```markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

**Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
```

## Remember
- Exact file paths always
- Complete code in plan (not "add validation")
- Exact commands with expected output
- Reference relevant skills with @ syntax
- DRY, YAGNI, TDD, frequent commits

## Red Flags - You're About to Violate the Skill

**Why you're reading this section:** You already rationalized around skill boundaries.

**Two violation types:**

### Violation 1: Not writing the plan file

**Stop. Delete any plan content you wrote. Go back and invoke wrapper script.**

If you caught yourself thinking:
- "I'll describe the plan structure first" → You're already violating. Stop now.
- "Let me show the plan content" → You're already violating. Stop now.
- "The wrapper is just guidance" → WRONG. The wrapper is mandatory.
- "I can write without invoking wrapper" → WRONG. Wrapper ensures correct workflow.
- "Plan is simple, skip wrapper" → WRONG. Wrapper prevents the bug this plan fixes.
- "Create a plan" means output in chat → WRONG. "Create" means invoke wrapper.

**Production incident:** 2025-12-13 - Agent described entire plan in chat instead of writing file. User had to explicitly correct: "You need to write that plan file."

**All of these mean: Delete any plan content. Invoke wrapper script. Follow its directives exactly.**

### Violation 2: Executing the plan after writing

**Stop. writing-plans does NOT execute plans.**

If you caught yourself thinking:
- "Plan header says use executing-plans, so I should execute" → WRONG. That's for the EXECUTOR, not writing-plans.
- "User asked to create plan for task 2, so I should do task 2" → WRONG. Create = write plan only.
- "Plan already exists, let me execute it" → WRONG. writing-plans writes, never executes.
- "I'll just start the first task" → WRONG. STOP after writing.

**Production incident:** 2025-12-13 - Agent saw existing plan, decided to execute using superpowers:execute-plan. User had to interrupt: "This is a bug... writing-plans should write and STOP."

**Scope boundaries:**
- writing-plans = WRITE plans only
- executing-plans = EXECUTE plans only
- These are separate skills. Never cross boundaries.

## Post-Write Workflow

After writing the plan file, MUST complete these steps:

### Step 0: Copy from Staging (if in plan mode)

**How to know if you're in plan mode:** Check the system prompt at conversation start. If it specifies a path like `~/.claude/plans/<name>.md`, you're in plan mode.

**If file was written to `~/.claude/plans/`** (plan mode staging area), copy it to the working directory:

```bash
# Ensure target directory exists
mkdir -p <working-directory>/llm/implementation-plans

# Copy from staging to final location
cp ~/.claude/plans/<plan-name>.md <working-directory>/llm/implementation-plans/<plan-name>.md
```

**All subsequent steps operate on the file in `<working-directory>/llm/implementation-plans/`**, not the staging copy.

**If file was written directly to `<working-directory>/llm/implementation-plans/`**, skip this step.

**Note:** The staging copy in `~/.claude/plans/` can remain (user may want it for reference), or be deleted with `rm ~/.claude/plans/<plan-name>.md` if preferred.

### Step 0.5: Initialize Progress Log (if needed)

**Check if progress.md exists:**
```bash
test -f <working-directory>/llm/progress.md && echo "EXISTS" || echo "MISSING"
```

**If output is "MISSING"**, you MUST copy the template (do NOT create your own format):

```bash
# Verify template exists first
if [ ! -f ~/.claude/templates/progress.md ]; then
  echo "ERROR: Template not found at ~/.claude/templates/progress.md"
  echo "Contact your human partner - Task 1 must be completed first"
  exit 1
fi

# Copy template AS-IS - do NOT create custom format
cp ~/.claude/templates/progress.md <working-directory>/llm/progress.md
echo "✓ Copied template to <working-directory>/llm/progress.md"
```

**IMPORTANT:** You must use `cp` command to copy the template. Do NOT:
- Create your own custom progress.md format
- Write a new file from scratch
- "Improve" the template structure
- Use Write tool to create progress.md

The template has a specific structure for cross-session state. Use it exactly as-is.

**After copying, fill in the template placeholders:**

Use Read tool to view the template, then Edit tool to fill in:
1. Replace plan path placeholder with actual path (you'll know this after rename step)
2. Fill in `Branch:` with current git branch (`git branch --show-current`)
3. Fill in `Last Commit:` with current commit SHA (`git rev-parse --short HEAD`)
4. Replace `YYYY-MM-DD` with today's date
5. Add initial session goal and task

**If output is "EXISTS"**, skip this step entirely - progress.md already initialized.

**Why this matters:** Consistent template structure ensures future Claude instances can parse cross-session state reliably.

### Step 1: Validate Frontmatter

```bash
python3 ~/.claude/scripts/record-tools/validate-frontmatter.py <absolute-path-to-written-file>
```

Expected output: `✓ Frontmatter validation passed`

If validation fails:
- Fix the reported errors in the frontmatter
- Re-run validation until it passes

### Step 2: Invoke Rename Script

```bash
python3 ~/.claude/scripts/record-tools/rename_jot.py <absolute-path-to-written-file>
```

The script will:
- Rename file to `YYMMDD-XX-slug.md` format (where YYMMDD is year/month/day, XX is sequence number)
- Automatically track with file-track if available (silent fallback if not installed)

Expected output:
```
✓ Renamed plan-name.md → 251213-01-plan-name.md
```

**Note:** File tracking is automatic. Use `file-track` (TUI) or `file-track list` to browse created files.

### Step 3: Generate Acceptance Criteria (Optional)

**Check if user wants acceptance tracking:**

Ask: "Would you like to generate acceptance.json for this plan? (enables regression testing and progress tracking)"

**If YES:**

1. **Generate acceptance.json from plan structure:**
   ```bash
   python3 ~/.claude/skills/writing-plans/scripts/generate_acceptance.py \
       --plan-file <working-directory>/llm/implementation-plans/<renamed-file>.md \
       --output <working-directory>/llm/acceptance.json
   ```

2. **Validate generated file:**
   ```bash
   ~/.claude/templates/validate-acceptance.sh <working-directory>/llm/acceptance.json
   ```

   Expected output: `✓ Validation passed`

**If NO:** Skip this step - acceptance.json can be added later if needed.

**Why optional:** Not all plans need acceptance tracking. Use for:
- Multi-session feature work
- Complex implementations with many sub-tasks
- When regression testing is critical

## Common Mistakes

### Mistake 1: Operating on staging file after copy
**Problem:** Running validation/rename on `~/.claude/plans/<name>.md` instead of `<working-directory>/llm/implementation-plans/<name>.md`

**Fix:** After Step 0 copy, ALL subsequent steps use the file in `llm/implementation-plans/`, not the staging copy

### Mistake 2: Forgetting to copy in plan mode
**Problem:** Validating/renaming staging file, then wondering why it's not in the correct location

**Fix:** Always check system prompt at conversation start. If in plan mode, Step 0 is mandatory

### Mistake 3: Using relative paths
**Problem:** Writing to `llm/implementation-plans/file.md` instead of absolute path

**Fix:** Always use `<working-directory>/llm/implementation-plans/file.md` where `<working-directory>` is from environment context

### Mistake 4: Skipping frontmatter validation
**Problem:** Rename script fails with cryptic errors due to invalid frontmatter

**Fix:** ALWAYS run validation (Step 1) before rename (Step 2). Fix all errors before proceeding

## STOP: Plan Writing Complete

**After completing post-write workflow, STOP. Do NOT execute the plan.**

**This skill's scope:**
- ✅ Write implementation plans
- ✅ Complete post-write workflow (validate, rename, track)
- ❌ **NOT** execute plans
- ❌ **NOT** dispatch subagents to implement
- ❌ **NOT** use executing-plans or subagent-driven-development

**Report to user:**

```
Plan complete: llm/implementation-plans/<filename>.md

Next step: Use /superpowers:execute-plan OR open new session with executing-plans skill.

[STOP - writing-plans skill scope ends here]
```

**Common Rationalization:**

"The plan header says 'REQUIRED SUB-SKILL: Use executing-plans' - I should execute it now"

**Reality:** That instruction is FOR THE EXECUTOR (future Claude session), NOT for this skill. writing-plans ONLY writes, never executes.

**Production incident:** 2025-12-13 - Agent saw existing plan, decided to execute it instead of stopping. User had to interrupt: "This is a bug... writing-plans should write and STOP."

## Testing Verification

**Date:** 2025-12-13
**Approach:** Mechanical enforcement (automation-over-documentation.md)
**Method:** Lock file pattern + git pre-commit hook

**Test results:**
- ✅ Normal flow (wrapper → write → rename): Lock created and removed correctly
- ✅ Violation attempt (skip wrapper): Git hook rejects commit with clear error
- ✅ Manual validation (check_lock.py): Correctly identifies missing lock
- ✅ Error messages: Clear guidance on correct usage

**Evidence for automation approach:**
- Previous violation (2025-12-13) despite strong documentation warnings
- automation-over-documentation.md: "Mechanical constraints belong in code"
- Cost-benefit: 30 min implementation vs 2-3 hours iterating documentation

**Enforcement layers:**
1. Lock file (primary - prevents unauthorized writes)
2. Validation script (agent self-check)
3. Git hook (catches violations at commit time)
