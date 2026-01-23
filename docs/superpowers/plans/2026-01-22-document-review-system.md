# Document Review System Implementation Plan

> **For Claude:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan.

**Goal:** Add spec and plan document review loops to the brainstorming and writing-plans skills.

**Architecture:** Create reviewer prompt templates in each skill directory. Modify skill files to add review loops after document creation. Use Task tool with general-purpose subagent for reviewer dispatch.

**Tech Stack:** Markdown skill files, subagent dispatch via Task tool

**Spec:** docs/superpowers/specs/2026-01-22-document-review-system-design.md

---

## Chunk 1: Spec Document Reviewer

This chunk adds the spec document reviewer to the brainstorming skill.

- [ ] ### Task 1: Create Spec Document Reviewer Prompt Template

**Files:**
- Create: `skills/brainstorming/spec-document-reviewer-prompt.md`

- [ ] **Step 1:** Create the reviewer prompt template file

```markdown
# Spec Document Reviewer Prompt Template

Use this template when dispatching a spec document reviewer subagent.

**Purpose:** Verify the spec is complete, consistent, and ready for implementation planning.

**Dispatch after:** Spec document is written to docs/superpowers/specs/

```
Task tool (general-purpose):
  description: "Review spec document"
  prompt: |
    You are a spec document reviewer. Verify this spec is complete and ready for planning.

    **Spec to review:** [SPEC_FILE_PATH]

    ## What to Check

    | Category | What to Look For |
    |----------|------------------|
    | Completeness | TODOs, placeholders, "TBD", incomplete sections |
    | Coverage | Missing error handling, edge cases, integration points |
    | Consistency | Internal contradictions, conflicting requirements |
    | Clarity | Ambiguous requirements |
    | YAGNI | Unrequested features, over-engineering |

    ## CRITICAL

    Look especially hard for:
    - Any TODO markers or placeholder text
    - Sections saying "to be defined later" or "will spec when X is done"
    - Sections noticeably less detailed than others

    ## Output Format

    ## Spec Review

    **Status:** ✅ Approved | ❌ Issues Found

    **Issues (if any):**
    - [Section X]: [specific issue] - [why it matters]

    **Recommendations (advisory):**
    - [suggestions that don't block approval]
```

**Reviewer returns:** Status, Issues (if any), Recommendations
```

- [ ] **Step 2:** Verify the file was created correctly

Run: `cat skills/brainstorming/spec-document-reviewer-prompt.md | head -20`
Expected: Shows the header and purpose section

- [ ] **Step 3:** Commit

```bash
git add skills/brainstorming/spec-document-reviewer-prompt.md
git commit -m "feat: add spec document reviewer prompt template"
```

---

- [ ] ### Task 2: Add Review Loop to Brainstorming Skill

**Files:**
- Modify: `skills/brainstorming/SKILL.md`

- [ ] **Step 1:** Read the current brainstorming skill

Run: `cat skills/brainstorming/SKILL.md`

- [ ] **Step 2:** Add the review loop section after "After the Design"

Find the "After the Design" section and add a new "Spec Review Loop" section after documentation but before implementation:

```markdown
**Spec Review Loop:**
After writing the spec document:
1. Dispatch spec-document-reviewer subagent (see spec-document-reviewer-prompt.md)
2. If ❌ Issues Found:
   - Fix the issues in the spec document
   - Re-dispatch reviewer
   - Repeat until ✅ Approved
3. If ✅ Approved: proceed to implementation setup

**Review loop guidance:**
- Same agent that wrote the spec fixes it (preserves context)
- If loop exceeds 5 iterations, surface to human for guidance
- Reviewers are advisory - explain disagreements if you believe feedback is incorrect
```

- [ ] **Step 3:** Verify the changes

Run: `grep -A 15 "Spec Review Loop" skills/brainstorming/SKILL.md`
Expected: Shows the new review loop section

- [ ] **Step 4:** Commit

```bash
git add skills/brainstorming/SKILL.md
git commit -m "feat: add spec review loop to brainstorming skill"
```

---

## Chunk 2: Plan Document Reviewer

This chunk adds the plan document reviewer to the writing-plans skill.

- [ ] ### Task 3: Create Plan Document Reviewer Prompt Template

**Files:**
- Create: `skills/writing-plans/plan-document-reviewer-prompt.md`

- [ ] **Step 1:** Create the reviewer prompt template file

```markdown
# Plan Document Reviewer Prompt Template

Use this template when dispatching a plan document reviewer subagent.

**Purpose:** Verify the plan chunk is complete, matches the spec, and has proper task decomposition.

**Dispatch after:** Each plan chunk is written

```
Task tool (general-purpose):
  description: "Review plan chunk N"
  prompt: |
    You are a plan document reviewer. Verify this plan chunk is complete and ready for implementation.

    **Plan chunk to review:** [PLAN_FILE_PATH] - Chunk N only
    **Spec for reference:** [SPEC_FILE_PATH]

    ## What to Check

    | Category | What to Look For |
    |----------|------------------|
    | Completeness | TODOs, placeholders, incomplete tasks, missing steps |
    | Spec Alignment | Chunk covers relevant spec requirements, no scope creep |
    | Task Decomposition | Tasks atomic, clear boundaries, steps actionable |
    | Task Syntax | Checkbox syntax (`- [ ]`) on tasks and steps |
    | Chunk Size | Each chunk under 1000 lines |

    ## CRITICAL

    Look especially hard for:
    - Any TODO markers or placeholder text
    - Steps that say "similar to X" without actual content
    - Incomplete task definitions
    - Missing verification steps or expected outputs

    ## Output Format

    ## Plan Review - Chunk N

    **Status:** ✅ Approved | ❌ Issues Found

    **Issues (if any):**
    - [Task X, Step Y]: [specific issue] - [why it matters]

    **Recommendations (advisory):**
    - [suggestions that don't block approval]
```

**Reviewer returns:** Status, Issues (if any), Recommendations
```

- [ ] **Step 2:** Verify the file was created

Run: `cat skills/writing-plans/plan-document-reviewer-prompt.md | head -20`
Expected: Shows the header and purpose section

- [ ] **Step 3:** Commit

```bash
git add skills/writing-plans/plan-document-reviewer-prompt.md
git commit -m "feat: add plan document reviewer prompt template"
```

---

- [ ] ### Task 4: Add Review Loop to Writing-Plans Skill

**Files:**
- Modify: `skills/writing-plans/SKILL.md`

- [ ] **Step 1:** Read current skill file

Run: `cat skills/writing-plans/SKILL.md`

- [ ] **Step 2:** Add chunk-by-chunk review section

Add before the "Execution Handoff" section:

```markdown
## Plan Review Loop

After completing each chunk of the plan:

1. Dispatch plan-document-reviewer subagent for the current chunk
   - Provide: chunk content, path to spec document
2. If ❌ Issues Found:
   - Fix the issues in the chunk
   - Re-dispatch reviewer for that chunk
   - Repeat until ✅ Approved
3. If ✅ Approved: proceed to next chunk (or execution handoff if last chunk)

**Chunk boundaries:** Use `## Chunk N: <name>` headings to delimit chunks. Each chunk should be ≤1000 lines and logically self-contained.
```

- [ ] **Step 3:** Update task syntax examples to use checkboxes

Change the Task Structure section to show checkbox syntax:

```markdown
- [ ] ### Task N: [Component Name]

- [ ] **Step 1:** Write the failing test
  - File: `tests/path/test.py`
  ...
```

- [ ] **Step 4:** Verify the review loop section was added

Run: `grep -A 15 "Plan Review Loop" skills/writing-plans/SKILL.md`
Expected: Shows the new review loop section

- [ ] **Step 5:** Verify the task syntax examples were updated

Run: `grep -A 5 "Task N:" skills/writing-plans/SKILL.md`
Expected: Shows checkbox syntax `- [ ] ### Task N:`

- [ ] **Step 6:** Commit

```bash
git add skills/writing-plans/SKILL.md
git commit -m "feat: add plan review loop and checkbox syntax to writing-plans skill"
```

---

## Chunk 3: Update Plan Document Header

This chunk updates the plan document header template to reference the new checkbox syntax requirements.

- [ ] ### Task 5: Update Plan Header Template in Writing-Plans Skill

**Files:**
- Modify: `skills/writing-plans/SKILL.md`

- [ ] **Step 1:** Read current plan header template

Run: `grep -A 20 "Plan Document Header" skills/writing-plans/SKILL.md`

- [ ] **Step 2:** Update the header template to reference checkbox syntax

The plan header should note that tasks and steps use checkbox syntax. Update the header comment:

```markdown
> **For Claude:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Tasks and steps use checkbox (`- [ ]`) syntax for tracking.
```

- [ ] **Step 3:** Verify the change

Run: `grep -A 5 "For Claude:" skills/writing-plans/SKILL.md`
Expected: Shows updated header with checkbox syntax mention

- [ ] **Step 4:** Commit

```bash
git add skills/writing-plans/SKILL.md
git commit -m "docs: update plan header to reference checkbox syntax"
```
