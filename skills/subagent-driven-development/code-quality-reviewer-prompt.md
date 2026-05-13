# Code Quality Reviewer Prompt Template

Use this template when dispatching a code quality reviewer subagent.

**Purpose:** Verify implementation is well-built (clean, tested, maintainable)

**Only dispatch after spec compliance review passes.**

```
Task tool (general-purpose):
  Use template at requesting-code-review/code-reviewer.md

  DESCRIPTION: [task summary, from implementer's report]
  PLAN_OR_REQUIREMENTS: Task N from [plan-file]
  BASE_SHA: [commit before task]
  HEAD_SHA: [current commit]
```

**In addition to standard code quality concerns, the reviewer should check:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Is the implementation following the file structure from the plan?
- Did this implementation create new files that are already large, or significantly grow existing files? (Don't flag pre-existing file sizes — focus on what this change contributed.)

## Per-Task Output Override

The standard `code-reviewer.md` template returns Strengths, a full Critical/Important/Minor breakdown, Recommendations, and an Assessment paragraph. For per-task review inside subagent-driven-development, that's more than the controller needs and bloats the fix loop. Append this override to the dispatched prompt:

```
For this review, override the standard Output Format. Reply with only:

**Verdict:** Approved | Needs fixes

**Issues:** (omit this section entirely if Approved)
- `path/file.py:LINE` — Critical|Important — what's wrong — how to fix

Skip Strengths, Recommendations, and any preamble or assessment paragraph.
Drop Minor issues — they're not blocking and the controller will not act
on them. One issue per line; the controller passes the list verbatim to
the implementer as the fix prompt.
```

## Re-Review After a Fix

When dispatching this reviewer for a second time on the same task (after the implementer fixed issues from a prior pass), do **not** re-run the full quality review. Dispatch a focused re-review instead:

```
Task tool (general-purpose):
  description: "Confirm fixes for Task N quality issues"
  prompt: |
    You previously reviewed Task N and reported these issues:

    [PASTE the Issues list from your prior review verbatim]

    The implementer has pushed a fix. Confirm whether each listed issue
    is now resolved. Read only the diff:

    ```bash
    git diff [SHA-before-fix]..HEAD
    ```

    Do not re-evaluate unchanged code. Do not surface new issues unless
    they are regressions introduced by this fix.

    **Verdict:** Approved | Needs fixes

    **Issues:** (omit entirely if Approved)
    - `path/file.py:LINE` — unresolved|regressed — what's still wrong
```
