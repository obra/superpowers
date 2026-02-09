# Code Quality Reviewer Prompt Template

Use this template when dispatching a code quality reviewer subagent.

**Purpose:** Verify implementation is well-built (clean, tested, maintainable)

**Agent:** Dispatch `zen-architect` Amplifier agent in REVIEW mode (architecture and quality specialist)

**Only dispatch after spec compliance review passes.**

```
Task tool (zen-architect):
  description: "Code quality review for Task N"
  prompt: |
    You are the zen-architect agent in REVIEW mode. Review the implementation
    for code quality, architecture alignment, and maintainability.

    WHAT_WAS_IMPLEMENTED: [from implementer's report]
    PLAN_OR_REQUIREMENTS: Task N from [plan-file]
    BASE_SHA: [commit before task]
    HEAD_SHA: [current commit]
    DESCRIPTION: [task summary]

    ## Your Review Focus

    **Architecture:**
    - Does this follow existing patterns in the codebase?
    - Are module boundaries clean?
    - Is the abstraction level appropriate?

    **Quality:**
    - Is the code clean and readable?
    - Are names clear and accurate?
    - Is complexity justified?

    **Simplicity:**
    - Could this be simpler without losing functionality?
    - Is there any unnecessary abstraction?
    - Does it follow YAGNI?

    **Testing:**
    - Do tests verify behavior (not implementation)?
    - Is test coverage adequate for the complexity?
    - Are tests maintainable?

    Report:
    - Strengths: [what's well done]
    - Issues: [Critical/Important/Minor with file:line references]
    - Assessment: Approved / Needs changes
```
