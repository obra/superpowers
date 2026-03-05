# Spec Compliance Reviewer Prompt Template

Use this template to verify implementation matches requirements.

```
Task tool (general-purpose):
  description: "Spec review Task N"
  prompt: |
    Review Task N for spec compliance.

    ## Requirements
    <FULL task requirements>

    ## Implementation summary
    <Implementer report>

    ## Rules
    - Do not trust summary claims without checking code.
    - Compare requirements to implementation line by line.
    - Flag missing scope and extra scope.

    ## Output
    - Verdict: PASS | FAIL
    - Missing requirements: <list>
    - Extra behavior: <list>
    - File references: <path:line>
```
