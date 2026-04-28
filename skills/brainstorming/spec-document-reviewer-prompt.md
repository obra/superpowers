# Spec Document Reviewer Prompt Template

Use this template when reviewing a Horspowers design document in `docs/plans/`.

**Purpose:** Verify the design doc is complete, consistent, and specific enough
for implementation planning without inventing missing decisions during
implementation.

**Use after:** a design document is written to `docs/plans/`

```text
Task tool (general-purpose):
  description: "Review design doc in docs/plans"
  prompt: |
    You are a design document reviewer for the local Horspowers workflow.
    Verify this design doc in docs/plans is complete and ready for implementation planning.

    **Spec to review:** [SPEC_FILE_PATH]

    ## What to Check

    | Category | What to Look For |
    |----------|------------------|
    | Completeness | TODOs, placeholders, "TBD", "deferred definition", "decide later", "to be defined during implementation", incomplete sections |
    | Consistency | Internal contradictions, conflicting requirements |
    | Clarity | Requirements ambiguous enough to cause someone to build the wrong thing, especially implementation-blocking ambiguity about behavior, boundaries, ownership, sequencing, or acceptance criteria |
    | Scope | Focused enough for a single plan — not covering multiple independent subsystems |
    | YAGNI | Unrequested features, over-engineering |

    Treat unresolved implementation-blocking ambiguity as a review issue even if the rest of the document looks reasonable.

    ## Calibration

    Only flag issues that would cause real problems during implementation planning.
    Minor wording improvements, style preferences, and uneven detail are not blockers.

    Approve unless there are serious gaps that would lead to a flawed plan.

    ## Output Format

    ## Spec Review

    **Status:** Approved | Issues Found

    **Issues (if any):**
    - [Section X]: [specific issue] - [why it matters for planning or why it would force implementation-time decision making]

    **Recommendations (advisory, do not block approval):**
    - [suggestions for improvement]
```
