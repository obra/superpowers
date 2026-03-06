# Implementer Subagent Prompt Template

Use this template for task implementation.

```
Task tool (general-purpose):
  description: "Implement Task N: <task name>"
  prompt: |
    Implement Task N: <task name>.

    ## Task
    <FULL task text from plan>

    ## Constraints
    <Only constraints relevant to this task>

    ## Required behavior
    1. Ask questions immediately if requirements are unclear.
    2. Implement only requested scope.
    3. Run task verification commands.
    4. Commit changes.
    5. Perform a self-review before reporting. If self-review finds fixable issues: fix them, re-run verification, then include findings in report.

    ## Report format
    - Implemented:
    - Verification run (commands + outcomes):
    - Commit SHA:
    - Files changed:
    - Self-review findings:
    - Open risks/questions:
```
