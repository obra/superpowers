# Plan Document Reviewer Prompt Template

Use this template when dispatching a plan document reviewer subagent.

**Purpose:** Verify the plan chunk is complete, matches the spec, and has proper task decomposition.

**Dispatch after:** Each plan chunk is written

```
Task tool (general-purpose):
  description: "Review plan chunk N"
  prompt: |
    REVIEW ONLY. DO NOT EDIT FILES. DO NOT COMMIT. DO NOT IMPLEMENT FIXES.

    You are a plan document reviewer. Verify this plan chunk is complete and ready for implementation.

    **Plan chunk to review:** [PLAN_FILE_PATH] - Chunk N only
    **Spec for reference:** [SPEC_FILE_PATH]

    ## What to Check

    | Category | What to Look For |
    |----------|------------------|
    | Completeness | TODOs, placeholders, incomplete tasks, missing steps |
    | Spec Alignment | Chunk covers relevant spec requirements, no scope creep |
    | Task Decomposition | Tasks atomic, clear boundaries, steps actionable |
    | File Structure | Files have clear single responsibilities, split by responsibility not layer |
    | File Size | Would any new or modified file likely grow large enough to be hard to reason about as a whole? |
    | Task Syntax | Checkbox syntax (`- [ ]`) on steps for tracking |
    | Chunk Size | Each chunk under 1000 lines |

    ## CRITICAL

    Look especially hard for:
    - Any TODO markers or placeholder text
    - Steps that say "similar to X" without actual content
    - Incomplete task definitions
    - Missing verification steps or expected outputs
    - Files planned to hold multiple responsibilities or likely to grow unwieldy

    ## Output Format

    First line: `APPROVED` or `ISSUES FOUND`

    ## Issues (if any)

    - [Task X, Step Y]: [specific issue] - [why it matters]

    ## Recommendations (advisory)

    - [suggestions that don't block approval]
```

**Reviewer returns:** Verdict, Issues (if any), Recommendations
