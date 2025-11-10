# Superpowers Skills Index

## Quick Decision Guide

**I'm implementing a feature or fixing a bug** → `core/test-driven-development.md`

**I encountered a bug or test failure** → `core/systematic-debugging.md`

**I'm designing a new feature** → `core/brainstorming.md`

**I'm starting work** → `core/using-superpowers.md` (read this first!)

**I have flaky async tests** → `testing/condition-based-waiting.md`

**I want to write better tests** → `testing/testing-anti-patterns.md`

**Bug is deep in call stack** → `debugging/root-cause-tracing.md`

**I'm about to claim work is done** → `debugging/verification-before-completion.md`

**I need multiple validation layers** → `debugging/defense-in-depth.md`

**I need to create an implementation plan** → `collaboration/writing-plans.md`

**I have a plan to execute** → `collaboration/executing-plans.md`

**I want to submit code for review** → `collaboration/requesting-code-review.md`

**I received code review feedback** → `collaboration/receiving-code-review.md`

**I need to work on multiple features** → `collaboration/using-git-worktrees.md`

**I'm ready to merge/PR** → `collaboration/finishing-a-development-branch.md`

**I want to create a new skill** → `meta/writing-skills.md`

**I want to contribute a skill back** → `meta/sharing-skills.md`

---

## Core Skills (Start Here)

### using-superpowers.md
**When:** Starting any conversation - establishes mandatory workflows

**What:** Mandatory protocol for finding and using skills. If a skill exists for your task, using it is REQUIRED, not optional.

**Key Points:**
- Check for relevant skills BEFORE responding
- Announce which skill you're using
- Follow skills exactly
- Track checklists explicitly

---

### test-driven-development.md
**When:** Implementing any feature or bugfix, before writing implementation code

**What:** RED-GREEN-REFACTOR cycle. Write test first, watch it fail, write minimal code to pass.

**Key Points:**
- NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
- Must watch test fail to prove it tests the right thing
- Write code before test? Delete it. Start over.

**Word Count:** ~1,478 words

---

### systematic-debugging.md
**When:** Encountering any bug, test failure, or unexpected behavior

**What:** 4-phase framework (Root Cause → Pattern → Hypothesis → Implementation) that ensures understanding before attempting solutions.

**Key Points:**
- NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
- Must complete each phase before proceeding
- If 3+ fixes failed, question the architecture

**Word Count:** ~1,508 words

---

### brainstorming.md
**When:** Creating or developing new features, before writing code

**What:** Socratic design refinement through collaborative questioning, alternative exploration, and incremental validation.

**Key Points:**
- One question at a time
- Explore 2-3 approaches with trade-offs
- Present design in 200-300 word sections
- YAGNI ruthlessly

**Word Count:** ~370 words

---

## Testing Skills

### condition-based-waiting.md
**When:** Tests have race conditions, timing dependencies, or pass/fail inconsistently

**What:** Replace arbitrary timeouts with condition polling for reliable async tests.

**Includes:** TypeScript example helpers (condition-based-waiting-example.ts)

---

### testing-anti-patterns.md
**When:** Writing tests or debugging test issues

**What:** Common testing mistakes and how to avoid them.

**Word Count:** ~1,253 words

---

## Debugging Skills

### root-cause-tracing.md
**When:** Error is deep in call stack or bad value originates elsewhere

**What:** Backward tracing technique to find the source of bad data or incorrect state.

---

### verification-before-completion.md
**When:** About to claim work is complete

**What:** Checklist to verify work is actually done before marking complete.

---

### defense-in-depth.md
**When:** Need multiple validation layers

**What:** Add validation at multiple system layers, not just one.

---

## Collaboration Skills

### writing-plans.md
**When:** Design is complete and need detailed implementation tasks

**What:** Create comprehensive implementation plans with exact file paths, complete code examples, and verification steps.

**Key Points:**
- Bite-sized tasks (2-5 minutes each)
- Exact file paths always
- Complete code in plan
- DRY, YAGNI, TDD, frequent commits

---

### executing-plans.md
**When:** Have a complete implementation plan to execute

**What:** Load plan, review critically, execute tasks in batches, report for review between batches.

**Key Points:**
- Default: First 3 tasks per batch
- Follow steps exactly
- Stop when blocked, don't guess

---

### requesting-code-review.md
**When:** Code is complete and ready for review

**What:** Pre-review checklist ensuring code is truly ready.

---

### receiving-code-review.md
**When:** Received code review feedback

**What:** How to respond to feedback systematically.

---

### using-git-worktrees.md
**When:** Need to work on multiple features simultaneously

**What:** Create isolated workspaces for parallel development.

---

### finishing-a-development-branch.md
**When:** Development complete and ready to merge or create PR

**What:** Merge/PR decision workflow.

---

### subagent-driven-development.md
**When:** Want fast iteration with quality gates (Note: Desktop has limited subagent support)

**What:** Dispatch fresh subagent per task with code review between tasks.

---

### dispatching-parallel-agents.md
**When:** Need concurrent workflows (Note: Desktop has limited parallel support)

**What:** Coordinate multiple agents working simultaneously.

---

## Meta Skills

### writing-skills.md
**When:** Creating new skills or editing existing skills

**What:** TDD applied to process documentation. Test with pressure scenarios before writing.

**Word Count:** ~2,934 words

---

### sharing-skills.md
**When:** Want to contribute skills back to community

**What:** Fork, branch, validate, submit PR workflow.

---

### testing-skills-with-subagents.md
**When:** Validating skill quality before deployment

**What:** Pressure testing techniques for bulletproofing skills.

**Word Count:** ~1,939 words

---

## Skill Statistics

- **Total Skills:** 20
- **Total Content:** ~15,000 words
- **Core Skills:** 4 (highest priority)
- **Testing Skills:** 2
- **Debugging Skills:** 3
- **Collaboration Skills:** 8
- **Meta Skills:** 3

---

## How to Use This Index

1. **Symptom-based lookup:** Use the Quick Decision Guide at top
2. **Category browsing:** Browse by category for related skills
3. **Full reading:** Read skill descriptions to understand when to use
4. **Cross-references:** Skills reference each other - follow the links

## Important Notes

- Skills are **mandatory**, not optional. If a skill exists for your task, you must use it.
- Always announce which skill you're using: "I'm using [skill-name] to [action]"
- Track checklist items explicitly in responses (no automatic tracking in Desktop)
- Skills may reference other skills - follow those references
