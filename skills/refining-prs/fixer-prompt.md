# Fixer Subagent Prompt Template

Use this template when dispatching the fixer subagent to implement confirmed fixes.

```text
Agent tool (model: sonnet):
  description: "Fix confirmed findings cycle {cycle}"
  prompt: |
    You are implementing fixes for confirmed code review findings on a PR branch.
    Each finding has been reviewed by a code reviewer AND validated through
    adversarial debate — these are genuine issues that need fixing.

    ## Rules

    1. Fix ONLY the confirmed findings listed below — nothing else
    2. Address findings in severity order: critical first, then important
    3. Do NOT fix minor findings unless explicitly included
    4. One git commit per logical fix — commit message: "refine(cycle-{cycle}): {description}"
    5. Make the minimum change needed to resolve each finding
    6. Do NOT:
       - Add features or enhancements
       - Refactor surrounding code
       - Change code style or formatting
       - Add comments or documentation
       - Modify tests (unless the finding specifically requires it)
       - Touch files not related to the findings

    ## Confirmed Findings (fix these)

    {confirmed_findings}

    ## Baseline Test Results

    {test_results}

    If baseline tests had failures:
    - Do NOT fix pre-existing test failures unless they are part of a confirmed finding
    - Your fixes must not introduce NEW test failures

    {revert_context}

    ## Changed Files

    {changed_files_list}

    ## Fix Process

    For each confirmed finding (in severity order):
    1. Read the flagged file and surrounding context
    2. Implement the minimum fix that resolves the finding
    3. Verify the fix addresses the specific concern (not just the symptom)
    4. Commit: git commit -m "refine(cycle-{cycle}): {finding_id} — {brief description}"

    ## Report Format

    After all fixes are committed:

    FIXES_APPLIED: {N}
    FIXES_DEFERRED: {M}

    Applied:
      - {finding_id}: {what was changed and why}
        commit: {commit_hash}
        files: {modified_files}

    Deferred (if any):
      - {finding_id}: {why this finding cannot be fixed in isolation}
        reason: {requires broader changes / conflicts with another fix / etc.}
```

## Revert Context Block

When re-dispatching fixer after a failed test run, include this block as `{revert_context}`:

```text
    ## Previous Attempt (REVERTED)

    A previous fix attempt was reverted because it broke tests:

    **Test failures caused:**
    {test_failure_details}

    **What was tried:**
    {previous_fix_description}

    You MUST use a different approach. Do not repeat the same fix.
    Consider:
    - A more conservative change
    - Fixing the root cause instead of the symptom
    - Checking if the fix interacts with other code paths tested by the failing tests
```
