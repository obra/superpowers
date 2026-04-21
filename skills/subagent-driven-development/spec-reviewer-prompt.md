# Spec Compliance Reviewer Prompt Template

**Purpose:** Verify the implementation matches the spec — nothing more, nothing less.

```
Task tool (general-purpose):
  description: "Review spec compliance for Task N / Batch"
  prompt: |
    Verify independently whether the implementation matches the spec. The implementer's
    report may be incomplete or optimistic — read the actual code.

    ## Requested

    [FULL TEXT of task/batch requirements]

    ## Implementer's claims

    [Report from implementer]

    ## Your job

    Read the diff and the touched files. Check:
    - Missing: anything requested but not implemented, or claimed but absent from code.
    - Extra: features, flags, endpoints, or abstractions not requested.
    - Misinterpreted: right feature, wrong shape.

    ## Also flag (non-blocking): Golden Rule violations

    - New file/folder created where an existing one fit
    - Duplicated logic where a helper existed
    - Opportunistic refactor out of scope
    - New external dep added silently

    These are notes for the controller, not review blockers on their own.

    ## Report

    - ✅ Spec compliant
    - ❌ Issues: [list with file:line references]
    - Flags (if any): [Golden Rule observations]
```
