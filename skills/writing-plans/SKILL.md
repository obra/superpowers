---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
semantic_tags: [role:architect]
recommended_model: pro
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Before planning:** Recall existing project decisions and patterns to avoid contradicting established architecture:
- `node ${CLAUDE_PLUGIN_ROOT}/../commands/recall.js knowledge_base.decisions`
- `node ${CLAUDE_PLUGIN_ROOT}/../commands/recall.js knowledge_base.patterns`

**Context:** This should be run in a dedicated worktree (created by brainstorming skill).

**Save plans to:** `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`
- (User preferences for plan location override this default)

## Scope Check

If the spec covers multiple independent subsystems, it should have been broken into sub-project specs during brainstorming. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Amplifier Agent Assignment

Each task gets an `Agent:` field specifying which Amplifier agent will handle it during execution. Read `${CLAUDE_PLUGIN_ROOT}/AMPLIFIER-AGENTS.md` for the full mapping.

**Auto-assign by scanning the task description:**
- Implementation tasks (build, create, add) → `modular-builder`
- Test tasks (test, coverage, verify) → `test-coverage`
- Fix/debug tasks (fix, debug, error) → `bug-hunter`
- Security tasks (auth, secrets, permissions) → `security-guardian`
- API tasks (endpoint, contract, route) → `api-contract-designer`
- Database tasks (schema, migration, query) → `database-architect`
- UI tasks (component, frontend, visual) → `component-designer`
- Integration tasks (API, MCP, external) → `integration-specialist`
- Performance tasks (optimize, bottleneck) → `performance-optimizer`

When in doubt, use `modular-builder` for building and `bug-hunter` for fixing.

**Review tasks use dedicated agents:**
- Spec compliance review → `test-coverage`
- Code quality review → `zen-architect` (REVIEW mode)
- Security review → `security-guardian`
- Final cleanup → `post-task-cleanup`

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

> **For Claude:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Each task specifies its Agent — dispatch that Amplifier agent as the subagent for implementation. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---
```

## Context-Efficient Plan Generation

For plans with 5+ tasks, delegate the heavy generation work to a subagent to protect the main context window:

```
Task(subagent_type="general-purpose", model="sonnet", description="Generate implementation plan for [feature]", prompt="
  You are writing an implementation plan. Follow these instructions EXACTLY.

  ## Spec Document
  Read the spec at: [spec file path]

  ## Agent Mapping
  Read the agent mapping at: ${CLAUDE_PLUGIN_ROOT}/AMPLIFIER-AGENTS.md

  ## Plan Template
  [paste the full plan document header template and task structure template from this skill]

  ## Requirements
  1. Create a task for each change in the spec's 'Files Changed' section
  2. Assign Agent: field to each task based on the agent mapping
  3. Include exact file paths for all Create/Modify/Test entries
  4. Write complete code for each step (not placeholders)
  5. Include TDD steps: write failing test, verify failure, implement, verify pass, commit
  6. Add review tasks where the spec's Agent Allocation specifies reviewers
  7. Write the plan to: [output path]
  8. Commit: git add <file> && git commit -m 'docs: add <feature> implementation plan'
  9. Return: file path, git commit hash, task count, and a 200-word summary of what each task covers
")
```

For plans with <5 tasks, generate in-context as before (the overhead is acceptable).

After receiving the subagent's summary, present it to the user: "Plan complete with N tasks. [summary]. Ready to execute?"

## Task Structure

```markdown
### Task N: [Component Name]

**Agent:** [agent-name from AMPLIFIER-AGENTS.md]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

- [ ] **Step 1: Write the failing test**

` ` `python
def test_specific_behavior():
    result = function(input)
    assert result == expected
` ` `

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write minimal implementation**

` ` `python
def function(input):
    return expected
` ` `

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit**

` ` `bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
` ` `
```

## Review Tasks

Include explicit review tasks in the plan for security-sensitive or complex implementations:

```markdown
### Task N+1: Security Review

**Agent:** security-guardian

**Scope:** Review Tasks 1-N for OWASP Top 10, secret detection, auth patterns
**Output:** Security findings with file:line references
**Action:** If issues found, create fix tasks and re-review
```

## Remember
- Exact file paths always
- Complete code in plan (not "add validation")
- Exact commands with expected output
- Reference relevant skills with @ syntax
- DRY, YAGNI, TDD, frequent commits
- Every task has an Agent: field

## Plan Review Loop

After completing each chunk of the plan:

1. Dispatch plan-document-reviewer subagent (see plan-document-reviewer-prompt.md) for the current chunk
   - Provide: chunk content, path to spec document
2. If ❌ Issues Found:
   - Fix the issues in the chunk
   - Re-dispatch reviewer for that chunk
   - Repeat until ✅ Approved
3. If ✅ Approved: proceed to next chunk (or execution handoff if last chunk)

**Chunk boundaries:** Use `## Chunk N: <name>` headings to delimit chunks. Each chunk should be ≤1000 lines and logically self-contained.

**Review loop guidance:**
- Same agent that wrote the plan fixes it (preserves context)
- If loop exceeds 5 iterations, surface to human for guidance
- Reviewers are advisory - explain disagreements if you believe feedback is incorrect

## Execution Handoff

After saving the plan:

**"Plan complete and saved to `docs/superpowers/plans/<filename>.md`. Ready to execute?"**

**Execution path depends on harness capabilities:**

**If harness has subagents (Claude Code, etc.):**
- **REQUIRED:** Use superpowers:subagent-driven-development
- Do NOT offer a choice - subagent-driven is the standard approach
- Fresh subagent per task + two-stage review

**If harness does NOT have subagents:**
- Execute plan in current session using superpowers:executing-plans
- Batch execution with checkpoints for review
