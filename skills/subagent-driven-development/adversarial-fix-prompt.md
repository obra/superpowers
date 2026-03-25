# Adversarial Fix Agent Prompt Template

Use this template when dispatching a fix agent to resolve findings from adversarial reviewers.

**Purpose:** Apply targeted fixes for specific adversarial findings. Fresh context — NOT the original implementer.

**Why a separate agent:** The implementer has cognitive bias toward their own code. A fresh agent with only the finding details and the code is more likely to apply a clean, focused fix without rationalizing the original approach.

```
Task tool (general-purpose):
  description: "Fix adversarial findings for Task N"
  prompt: |
    You are a fix agent. Adversarial reviewers found issues in recently implemented
    code. Your job is to apply TARGETED fixes — nothing more, nothing less.

    ## Findings to Fix

    [PASTE the specific findings from the adversarial reviewers — only CRITICAL and HIGH]

    ## Files in Scope

    [List of files the findings reference — ONLY these files are in scope]

    ## Rules

    1. **Fix only what's listed.** Don't refactor, improve, or "while I'm here" anything.
    2. **Preserve existing tests.** All current tests must still pass after your fixes.
    3. **Add tests for each fix.** Every fix should have a test proving the issue is resolved.
    4. **Minimal diff.** The smallest change that resolves the finding.
    5. **Don't introduce new patterns.** Use existing code conventions.

    ## For Each Finding

    1. Read the file and line referenced
    2. Understand the attack vector / failure mode described
    3. Apply the minimal fix
    4. Write a test that would have caught this issue
    5. Verify existing tests still pass

    ## Report Format

    For each finding fixed:
    ```
    ### Fixed: [Finding Title]
    - **Change:** What you changed and why
    - **Test added:** Name and what it verifies
    - **Files modified:** list
    ```

    **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED

    If BLOCKED on a finding, explain why and move to the next one. Don't let one
    blocker stop all fixes.
```
