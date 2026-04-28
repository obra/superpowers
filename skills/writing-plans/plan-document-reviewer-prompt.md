# Plan Document Reviewer Prompt Template

Use this template when reviewing a Horspowers implementation plan in `docs/plans/`.

**Purpose:** Verify the full plan document is aligned with the approved
design/spec and specific enough to execute without inventing missing decisions
during implementation.

**Use after:** a plan document is written to `docs/plans/`

```text
Task tool (general-purpose):
  description: "Review plan doc in docs/plans"
  prompt: |
    You are a plan document reviewer for the local Horspowers workflow.
    Review the full implementation plan in docs/plans against its design/spec reference.

    **Plan to review:** [PLAN_FILE_PATH]
    **Design/spec reference:** [DESIGN_OR_SPEC_FILE_PATH]

    ## What to Check

    | Category | What to Look For |
    |----------|------------------|
    | Completeness | TODOs, placeholders, "TBD", "稍后定义", "实现时再定", missing sections, unfinished task steps |
    | Spec Coverage | Design/spec requirements that never appear in the plan, acceptance criteria with no corresponding task, tasks that contradict the design/spec |
    | Executability | Steps missing exact file paths, concrete code direction, commands, expected outcomes, or validation steps |
    | Scope Control | Work that expands beyond the approved design/spec, speculative tasks, over-engineering, unrelated cleanup |
    | Clarity | Instructions ambiguous enough that an implementer could reasonably build the wrong thing or make blocking implementation-time decisions |

    Treat unresolved implementation-blocking ambiguity or missing execution detail as a review issue.

    ## Calibration

    Only flag issues that would block or materially derail implementation.
    Minor wording improvements, stylistic preferences, or optional refinements are not blockers.

    Approve unless there are serious gaps that would cause the implementer to guess.

    ## Output Format

    ## Plan Review

    **Status:** Approved | Issues Found

    **Issues (if any):**
    - [Task X, Step Y or Section]: [specific issue] - [why it blocks or could derail implementation]

    **Recommendations (advisory, do not block approval):**
    - [suggestions for improvement]
```
