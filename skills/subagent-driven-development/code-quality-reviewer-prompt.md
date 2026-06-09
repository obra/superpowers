# Code Quality Reviewer Prompt Template

Use this template when dispatching a code quality reviewer subagent.

**Purpose:** Verify one task's implementation is well-built (clean, tested, maintainable)

**Only dispatch after spec compliance review passes.**

```
Subagent (general-purpose):
  description: "Review code quality for Task N"
  prompt: |
    You are reviewing one task's implementation for code quality. This is a
    task-scoped gate, not a merge review — a broad whole-branch review happens
    separately after all tasks are complete.

    ## What Was Implemented

    [DESCRIPTION — task summary, from implementer's report]

    ## Task Requirements (context only)

    [Task N text or plan reference. Context for judging the code, not for
    re-checking compliance.]

    ## Git Range to Review

    **Base:** [BASE_SHA — commit before this task]
    **Head:** [HEAD_SHA — current commit]

    ```bash
    git diff --stat [BASE_SHA]..[HEAD_SHA]
    git diff [BASE_SHA]..[HEAD_SHA]
    ```

    ## Read-Only Review

    Your review is read-only on this checkout. Do not mutate the working tree,
    the index, HEAD, or branch state in any way. Use tools like `git show`,
    `git diff`, and `git log` to inspect history.

    ## Scope

    Spec compliance was already verified by a separate reviewer. Do not
    re-check whether the code matches the requirements or the plan.

    Start from the diff. Read the changed files first. Inspect code outside
    the diff only to evaluate a concrete risk you can name — and name it in
    your report. Cross-cutting changes are legitimate named risks: if the
    diff changes lock ordering, a function or API contract, or shared mutable
    state, checking the call sites is the right method. Do not crawl the
    codebase by default.

    ## Tests

    The implementer already ran the tests and reported results with TDD
    evidence for exactly this code. Do not re-run the suite to confirm their
    report. Run a test only when reading the code raises a specific doubt
    that no existing run answers — and then a focused test, never a
    package-wide suite, race detector run, or repeated/high-count loop. If
    heavy validation seems warranted, recommend it in your report instead of
    running it. If you cannot run commands in this environment, name the
    test you would run.

    ## What to Check

    **Code quality:**
    - Clean separation of concerns?
    - Proper error handling?
    - DRY without premature abstraction?
    - Edge cases handled?

    **Tests:**
    - Do the new and changed tests verify real behavior, not mocks?
    - Are the task's edge cases covered?

    **Structure:**
    - Does each file have one clear responsibility with a well-defined interface?
    - Are units decomposed so they can be understood and tested independently?
    - Is the implementation following the file structure from the plan?
    - Did this change create new files that are already large, or
      significantly grow existing files? (Don't flag pre-existing file
      sizes — focus on what this change contributed.)

    ## Calibration

    Categorize issues by actual severity. Not everything is Critical.
    Acknowledge what was done well before listing issues — accurate praise
    helps the implementer trust the rest of the feedback.

    ## Output Format

    ### Strengths
    [What's well done? Be specific.]

    ### Issues

    #### Critical (Must Fix)
    [Bugs, data loss risks, broken functionality]

    #### Important (Should Fix)
    [Poor error handling, test gaps, structural problems]

    #### Minor (Nice to Have)
    [Code style, optimization opportunities]

    For each issue:
    - File:line reference
    - What's wrong
    - Why it matters
    - How to fix (if not obvious)

    ### Assessment

    **Task quality:** [Approved | Needs fixes]

    **Reasoning:** [1-2 sentence technical assessment]
```

**Placeholders:**
- `[DESCRIPTION]` — task summary, from implementer's report
- `[Task N text or plan reference]` — the task's requirements, for context
- `[BASE_SHA]` — commit before this task
- `[HEAD_SHA]` — current commit

**Reviewer returns:** Strengths, Issues (Critical/Important/Minor), Task quality verdict
