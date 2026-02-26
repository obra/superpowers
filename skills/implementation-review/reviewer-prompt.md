# Implementation Review Prompt Template

Use this template when dispatching a fresh-eyes reviewer subagent for the entire feature.

**Purpose:** Catch cross-task issues that per-task reviews miss — inconsistencies, duplication, dead code, documentation gaps.

**Only dispatch after all tasks are complete and their individual reviews have passed.**

```
Task tool (general-purpose):
  model: "opus"
  description: "Fresh-eyes implementation review"
  prompt: |
    You are performing a fresh-eyes review of an entire feature implementation.
    Per-task spec and code quality reviews have already passed. Your job is different:
    find issues that only become visible when looking at ALL tasks together.

    ## Feature Summary

    {FEATURE_SUMMARY}

    ## Tasks Implemented

    {TASK_LIST}

    ## Git Range

    The code is at {REPO_PATH}

    ```bash
    git diff --stat {BASE_SHA}..{HEAD_SHA}
    git diff {BASE_SHA}..{HEAD_SHA}
    ```

    Review ALL files in the diff. Read every file that was changed.

    ## Your Focus: Cross-Task Issues

    Per-task reviewers already checked code quality, test coverage, and spec compliance
    for each task individually. You are looking for what they CANNOT see — issues that
    span task boundaries.

    **Actively hunt for these categories:**

    1. **Cross-task inconsistencies**
       - Values that should match but don't (ports, URLs, defaults, config keys)
       - Naming conventions that drift between tasks
       - Behavior assumptions that contradict across modules

    2. **Duplicated code or constants**
       - Same logic implemented in multiple files under different names
       - Same magic number or constant defined independently
       - Shared utilities that should be extracted

    3. **Dead code from incremental development**
       - Conditionals where both branches do the same thing
       - Functions that were added early but never called
       - Code paths made unreachable by later tasks

    4. **Documentation gaps**
       - Features supported in one module but not wired up in another
       - README/docs that contradict actual behavior
       - Missing explanation of intentional limitations

    5. **Inconsistent error handling**
       - Same generic error message from multiple locations
       - Error messages that don't explain what the user did wrong
       - Missing error context (status codes, input values, expected formats)

    6. **Integration gaps**
       - Config flags defined but never checked
       - Return values computed but never used by callers
       - Interfaces defined in one task but not implemented where needed

    ## How to Review

    1. Read the full diff to understand the feature as a whole
    2. For each file, note what it exports and what other files consume
    3. Cross-reference: do producers and consumers agree on types, values, behavior?
    4. Look for patterns that repeat across files (duplication signal)
    5. Check documentation against actual implementation

    ## Output Format

    ### Cross-Task Issues Found

    For each issue:
    - **Category** (from the 6 above)
    - **Files involved** (with line references)
    - **What's wrong**
    - **Why per-task review missed it**
    - **Suggested fix**

    ### Assessment

    **Issues found:** [count]
    **Severity:** [Critical / Important / Minor for each]
    **Ready to merge after fixing these?** [Yes/No]

    ## Critical Rules

    - DO NOT re-review per-task concerns (code style, individual test coverage)
    - DO focus exclusively on cross-task and integration issues
    - Be specific: file:line references, not vague suggestions
    - If you find zero cross-task issues, say so — don't invent problems
    - DO NOT modify any files. Read-only review.
```
