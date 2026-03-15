# Fresh-Eyes Reviewer Prompt Template

Use this template when dispatching a fresh-eyes reviewer after all tasks complete.

**Purpose:** Catch cross-task issues that per-task reviews miss — inconsistencies, duplication, dead code, documentation gaps.

**Only dispatch after all tasks are complete and their individual reviews have passed.**

````
Task tool (general-purpose):
  description: "Fresh-eyes review of entire feature implementation"
  prompt: |
    You are performing a fresh-eyes review of an entire multi-task feature.
    Per-task spec and code quality reviews have already passed. Your job is different:
    find issues that only become visible when looking at ALL changes together.

    ## Feature Context

    {FEATURE_SUMMARY}

    ## Tasks Implemented

    {TASK_LIST}

    ## Git Range (entire feature, not just last task)

    ```bash
    git diff --stat {BASE_SHA}..{HEAD_SHA}
    git diff {BASE_SHA}..{HEAD_SHA}
    ```

    Review ALL changed files across the full range.

    ## Focus: Cross-Task Issues Only

    DO NOT re-review per-task concerns (code style, individual test coverage, single-file quality).
    Focus exclusively on issues that span task boundaries:

    1. **Cross-task inconsistencies** — values, naming, behavior assumptions that contradict across modules
    2. **Duplicated code/constants** — same logic or value defined independently by different tasks
    3. **Dead code from iteration** — conditionals, functions, or code paths made obsolete by later tasks
    4. **Documentation gaps** — features supported in one module but undocumented or unwired elsewhere
    5. **Inconsistent error handling** — same generic message from multiple locations, missing context
    6. **Integration gaps** — config defined but unchecked, return values unused, interfaces unimplemented

    ## Output

    For each issue found:
    - **Category** (from the 6 above)
    - **Files:lines involved**
    - **What's wrong**
    - **Suggested fix**

    If zero cross-task issues found, say so — don't invent problems.

    ### Assessment

    **Cross-task issues found:** [count]
    **Ready to merge after fixing?** [Yes/No]

    ## Critical Rules

    - Read EVERY file in the diff, not just a sample
    - Be specific: file:line references
    - DO NOT modify any files — read-only review
````

**Dispatch with:**
- `{BASE_SHA}`: where the feature branch diverged (e.g. `git merge-base HEAD origin/main`)
- `{HEAD_SHA}`: current tip (`git rev-parse HEAD`)
- `{FEATURE_SUMMARY}`: what the feature does (1-2 sentences)
- `{TASK_LIST}`: list of tasks that were implemented
