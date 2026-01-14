---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill. Checking for existing research in docs/research/."

**Context:** This should be run in a dedicated worktree (created by brainstorming skill).

**Save plans to:** `docs/plans/YYYY-MM-DD-<feature-name>.md`

## Phase 0: Request Clarification

**Before ANY context gathering, validate the request is clear.**

This phase prevents wasted effort by catching ambiguity early. Codebase exploration uses a single Explore subagent; decision-making and user interaction remain in the orchestrator.

### Clarification Flow

1. **Analyze the request**: Identify goal, scope, success criteria, constraints
2. **Dispatch exploration subagent**: Single Explore subagent (haiku) for 30-second project structure scan
3. **Read exploration findings**: Parse subagent's returned findings (orchestrator writes to handoff file)
4. **Detect ambiguity**: Flag vague terms, missing boundaries, unclear success criteria using exploration context
5. **Ask OR proceed**: Use AskUserQuestion for 2-3 targeted questions if unclear; proceed if clear
6. **Document findings**: Write combined findings to `docs/handoffs/context-clarification.md`

### When to Ask Questions

Ask when request has:

- Multiple valid interpretations
- Vague terms ("improve", "better", "robust")
- No explicit scope boundaries
- Unclear success criteria

Proceed without asking when:

- User explicitly said "don't ask, just plan"
- User provided comprehensive spec document AND you verified it addresses Why/What/Who/Where/When/How
- All Six Questions unambiguously answered in user's request

**Do NOT skip clarification because:**

- "The request seems clear enough" - Simple requests often hide complex requirements
- "I can infer the scope from the codebase" - State assumptions explicitly, don't guess
- "Questions slow things down" - Wrong assumptions waste far more time than 2-3 questions
- "The spec file looks complete" - Verify it explicitly addresses scope/success criteria
- "This is a common pattern" - Common patterns have many valid implementations

### Question Design

- **2-3 questions maximum** - quality over quantity
- **Multiple choice preferred** - reduces cognitive load
- **Context-aware** - reference codebase findings, not generic templates
- **One focus per question** - goal, scope, or constraints

Use template: `./request-clarification-prompt.md`

### Clarification Exploration Subagent

Dispatch a single Explore subagent before asking questions:

- **Type:** `Explore` (read-only, fast)
- **Model:** `haiku` (cheapest, sufficient for structure scanning)
- **Template:** `./clarification-explorer-prompt.md`
- **Dispatch:** Synchronous (wait for results before proceeding)

The subagent returns findings as text. Orchestrator writes findings to `docs/handoffs/context-clarification-exploration.md` then uses them for question design.

**Why subagent?**
- Saves orchestrator credits (exploration runs on cheaper haiku model)
- Keeps orchestrator context clean (search results stay in subagent)
- Follows Phase 1-3 pattern (consistent architecture)

### Output

Write clarification summary to `docs/handoffs/context-clarification.md`. This informs Phase 1 exploration targets.

## Research Check

Before proceeding to plan writing, check for existing research:

### Step 1: Search for Research Document

Look in `docs/research/` for a matching research document:
- Match by date (recent, within last 7 days)
- Match by topic keywords in filename

### Step 2: If Research Found

Read the research document and proceed directly to plan writing:
- Skip Phase 0 clarification (research already clarified the topic)
- Use research findings to inform task structure
- Reference research document in plan header

### Step 3: If No Research Found

Ask the user:

"No research found for this topic. Would you like to:"
- **Run research first** (Recommended) - `/hyperpowers:research [topic]`
- **Proceed without research** - Use lightweight inline exploration

If user chooses research: Exit and let them run the research skill first.
If user declines: Proceed with Phase 0 clarification, then degraded mode.

### Degraded Mode (No Research)

If proceeding without research:
1. Complete Phase 0 clarification
2. Do lightweight exploration using Glob/Grep (no parallel subagents)
3. Note in plan header: "No research document - created with limited context"
4. Recommend running `/hyperpowers:research` for future similar features

## Issue Context (Phase 0.5)

After research check, before plan writing:

### If Research Document Exists

1. Extract "Related Issues" section from research doc:
   - Parse issue IDs, titles, statuses
   - Identify primary issue (from branch name or first listed)
   - Carry forward to plan header

2. **Extract "## Original Issue" section verbatim if present**
   - Parse issue ID, title, status from header
   - Store full block for inclusion in plan output

### If No Research Document (Degraded Mode)

1. Dispatch issue-tracking agent for discovery:
   ```
   Task(description: "Discover related issues",
        prompt: "Operation: discover
   Context: [feature/task description]
   Branch: [current branch name]",
        model: "haiku",
        subagent_type: "general-purpose")
   ```

2. **If primary issue identified, fetch full body:**
   ```
   Task(description: "Fetch issue body",
        prompt: "Operation: get-issue-body
   Issue: [primary issue ID]",
        model: "haiku",
        subagent_type: "hyperpowers:issue-tracking:issue-tracking")
   ```

3. Assess and confirm classification

### Plan Header Addition

Update plan header template to include:

```markdown
> **Related Issues:** [PROJ-123, PROJ-456]
> **Primary Issue:** [PROJ-123] (from branch name)
```

### Original Issue Validation Gate

**STOP CONDITION:** If research doc references an issue but no Original Issue block found, warn user:
```
Warning: Research references issue [ID] but no Original Issue block found.
This may indicate context loss. Options:
- Fetch issue now and include [Recommended]
- Proceed without original issue context
- Return to research phase
```

## Pre-Plan Writing Gate

**BEFORE writing ANY plan content, verify:**

```
[ ] Research document exists in docs/research/ OR degraded mode acknowledged
[ ] Topic is clear (from research or Phase 0 clarification)
[ ] Context is sufficient to write specific, actionable tasks
```

If research exists: Reference `docs/research/YYYY-MM-DD-topic.md`
If degraded mode: Document limitations in plan header

## COMPULSORY: Handoff Consumption Verification

**Research Consumption Gate** (COMPULSORY when research doc provided):

- [ ] Research document path explicitly stated
- [ ] Key findings from research quoted in plan header
- [ ] Architecture decisions traced to research findings
- [ ] Open questions from research addressed or carried forward

**STOP CONDITION:** If writing plan without citing research findings, STOP. Quote specific sections from research.

## COMPULSORY: Plan Quality Verification

Before writing ANY task:

**Context Gate** (COMPULSORY):

- [ ] Research document read (or degraded mode acknowledged)
- [ ] Topic clear from research or clarification
- [ ] Sufficient context for specific, actionable tasks

**STOP CONDITION:** If writing tasks without context, STOP. Gather context first.

For EACH task written:

**Task Quality Gate** (COMPULSORY):

- [ ] Exact file paths (not "relevant files")
- [ ] Complete code in plan (not "add validation")
- [ ] Exact commands with expected output
- [ ] Step granularity is 2-5 minutes each

**STOP CONDITION:** If task is vague, rewrite with specifics.

After writing all tasks:

**Plan Completeness Gate** (COMPULSORY):

- [ ] Header includes Goal, Architecture, Tech Stack
- [ ] Related Issues section populated (or "none" noted)
- [ ] Original Issue section included (if issue tracked)
- [ ] Each task has Files, Steps, Commit sections
- [ ] DRY/YAGNI/TDD principles followed

**STOP CONDITION:** If plan missing required sections, add them before saving.

## Red Flags - STOP

- No research document found and user declined to create one (proceeding in degraded mode)
- Referencing research document without reading it
- Skipping Phase 0 clarification in degraded mode
- Writing plan without sufficient context

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

> **For Claude:** Run `/execute-plan` to implement this plan (will ask which execution style you prefer).
> **Related Issues:** [PROJ-123, PROJ-456]
> **Primary Issue:** [PROJ-123] (from branch name)

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

**Context Gathered From:**
- `docs/research/YYYY-MM-DD-topic.md` (if research exists)
- OR: "Degraded mode - limited inline exploration"

---

## Original Issue

> **ID:** [issue-id]
> **Title:** [title]
> **Status:** Authoritative | Reference Only
> **Reason:** [classification reason]

[Full issue body verbatim - copied from research doc or captured directly]

---
```

**Before writing tasks, review research document (or inline exploration) and incorporate:**

- Patterns from codebase exploration
- API details from documentation
- Best practices from research
- Anti-patterns to avoid

## Task Structure

````markdown
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
````

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

````

## Remember
- Exact file paths always
- Complete code in plan (not "add validation")
- Exact commands with expected output
- Reference relevant skills with @ syntax
- DRY, YAGNI, TDD, frequent commits

## Execution Handoff

After saving the plan:

**Step 1: Cleanup context gathering files**

Delete all files in `docs/handoffs/` - these are no longer needed once the plan is written:

```bash
rm -rf docs/handoffs/*
````

**Step 2: Announce completion and provide handoff**

```
Plan complete and saved to `docs/plans/<actual-filename>.md`. Context gathering files cleaned up.

To continue:
/compact ready to implement docs/plans/<actual-filename>.md
/execute-plan docs/plans/<actual-filename>.md
```

Replace `<actual-filename>` with the real plan path.

## Cleanup

**All handoff files are deleted after the plan is written** (see Execution Handoff above).

The `docs/handoffs/` directory is used only during context gathering. Once the plan is saved to `docs/plans/`, the handoff files serve no purpose:

- Individual explorer findings (`context-codebase-{aspect}.md`, etc.) are intermediate artifacts
- Summary files (`context-*-summary.md`) are synthesized into the plan itself
- All context is captured in the plan document

**Why cleanup immediately?**

- Prevents stale context from affecting future planning sessions
- Aligns with industry best practices: cleanup at terminal state (plan completion)
- Keeps the directory clean for the next planning task
