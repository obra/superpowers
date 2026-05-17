# Simplification / Code Quality Reviewer Prompt Template

Use this template when dispatching the post-spec-compliance quality reviewer.

**Purpose:** Verify implementation is well-built: reusable, clean, tested, maintainable, and efficient.

**Only dispatch after spec compliance review passes and verification is green.**

## Default: One Reviewer, Three Lenses

For normal task-sized changes, dispatch one reviewer and explicitly ask it to review the diff through all three simplification lenses: reuse, quality, and efficiency.

```
Task tool (general-purpose):
  Use template at requesting-code-review/code-reviewer.md

  DESCRIPTION: [task summary, from implementer's report]
  PLAN_OR_REQUIREMENTS: Task N from [plan-file]
  BASE_SHA: [commit before task]
  HEAD_SHA: [current commit]

  EXTRA REVIEW FOCUS:
  Run a simplification review through these lenses:
  1. Reuse: existing utilities/helpers/patterns that should replace new code; duplicated functionality; hand-rolled string/path/env/type-guard logic.
  2. Quality: redundant state; parameter sprawl; copy-paste variations; leaky abstractions; stringly-typed code where constants/unions exist; unnecessary wrappers; comments that explain WHAT or narrate the task instead of non-obvious WHY.
  3. Efficiency: redundant computation/I/O/API calls; missed safe concurrency; hot-path bloat; recurring no-op updates without change detection; TOCTOU existence checks; leaks/unbounded data; overly broad reads/loads.
```

**In addition to the simplification lenses, the reviewer should check:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Is the implementation following the file structure from the plan?
- Did this implementation create new files that are already large, or significantly grow existing files? (Don't flag pre-existing file sizes — focus on what this change contributed.)

## Escalation: Parallel Focused Reviewers

For large diffs, risky refactors, performance-sensitive work, or final pre-merge review, dispatch three read-only reviewers concurrently against the same git range:

1. **Reuse reviewer** — searches for existing utilities, helpers, and codebase patterns that should replace new code.
2. **Quality reviewer** — looks for redundant state, parameter sprawl, copy-paste, leaky abstractions, stringly typing, unnecessary wrappers, and low-value comments.
3. **Efficiency reviewer** — looks for avoidable work, missed concurrency, hot-path bloat, no-op updates, TOCTOU checks, leaks, and overly broad operations.

Aggregate findings after all three complete. Fix valid findings; note false positives briefly and move on.

**Reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment
