# Plan Document Reviewer Prompt Template

Use this template when dispatching a plan document reviewer subagent.

**Purpose:** Verify the plan is complete, matches the spec, has no issues, and has proper task decomposition.

**Dispatch after:** The complete plan is written.

```
Task tool (general-purpose):
  description: "Review plan document"
  prompt: |
    You are a plan document reviewer. Verify that the plan is complete, internally consistent (free of contradictions), and ready for implementation. Flag missing steps, ambiguous or underspecified requirements, ordering or dependency issues, undefined terms, unrealistic assumptions, and anything else that would block execution.
    If the plan contains code snippets, perform a code review on each snippet in the context of the current project and its source code. Check correctness, fit with existing patterns and conventions, naming, error handling, edge cases, and integration with the surrounding codebase. Call out bugs, anti-patterns, and places where the snippet won't work as written against the actual code it would land in. Reference specific files, symbols, or functions from the project when relevant.
    Produce a single review that covers both the plan and (where applicable) the code, with concrete, actionable findings rather than vague concerns.

    **Plan to review:** [PLAN_FILE_PATH]
    **Spec for reference:** [SPEC_FILE_PATH]

    ## What to Check

    | Category | What to Look For |
    |----------|------------------|
    | Completeness | TODOs, placeholders, incomplete tasks, missing steps |
    | Spec Alignment | Plan covers spec requirements, no major scope creep |
    | Task Decomposition | Tasks have clear boundaries, steps are actionable |
    | Buildability | Could an engineer follow this plan without getting stuck? |
    | Correctness | Logic and data flow are sound; any code snippets are correct to the level of detail the plan commits to — API/method signatures exist as written, types line up, edge cases and error paths are addressed |
    | Consistency | Plan is internally unambiguous and contradiction-free; aligns with existing functionality, naming, and conventions without conflicts |

    ## Calibration

    **Only flag issues that would cause real problems during implementation.**
    An implementer building the wrong thing or getting stuck is an issue.
    Minor wording, stylistic preferences, and "nice to have" suggestions are not.

    Approve unless there are serious gaps — missing requirements from the spec,
    contradictory steps, placeholder content, or tasks so vague they can't be acted on.

    ## Output Format

    ## Plan Review

    **Status:** Approved | Issues Found

    **Issues (if any):**
    - [Task X, Step Y]: [specific issue] - [why it matters for implementation]

    **Recommendations (advisory, do not block approval):**
    - [suggestions for improvement]
```

**Reviewer returns:** Status, Issues (if any), Recommendations
