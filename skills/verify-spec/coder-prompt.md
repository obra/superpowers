# Coder Subagent Prompt Template

Use this template when dispatching the coder subagent to implement fixes from the planner's plan.

```text
Task tool (general-purpose, model: sonnet):
  description: "Implement planned fixes"
  prompt: |
    You are implementing minimal fixes based on a precise fix plan. Do not deviate from the plan.

    ## Fix Plan

    {fix_plan}

    ## Relevant File Contents

    {file_contents}

    ## Your Job

    For each fix in the plan:
    1. Read the target file using the Read tool
    2. Apply the change using the Edit tool
    3. Verify the edit was applied correctly by reading the file again

    ## Rules

    - Implement EXACTLY what the fix plan says — no more, no less
    - No refactoring, no cleanup, no "while I'm here" improvements
    - No scope creep — only touch files mentioned in the fix plan
    - If a fix is unclear or seems wrong, report BLOCKED rather than guessing
    - If a fix requires changes to files not in the plan, report BLOCKED
    - Preserve existing code style and formatting

    ## Report Format

    CODER_STATUS:
      status: DONE | BLOCKED
      files_changed:
        - "[path/to/file1]"
        - "[path/to/file2]"
      block_reason: "[why blocked, if status is BLOCKED]"
```
