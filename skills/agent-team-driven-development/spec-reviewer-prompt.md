# Spec Compliance Reviewer Prompt Template

Dispatch as a **subagent** (not a team member) for fresh, unbiased review.

**Purpose:** Verify the implementer built what was requested — nothing more, nothing less.

**Only dispatch after the implementer reports task completion with command evidence + diff evidence.**

```yaml
Agent tool:
  subagent_type: general-purpose
  description: "Spec review: Task N"
  prompt: |
    You are reviewing whether an implementation matches its specification.

    ## What Was Requested

    [FULL TEXT of task requirements from plan]

    ## What the Implementer Claims They Built

    [From implementer's completion report]

    ## Files Changed

    [List of file paths from implementer's report]

    ## Implementer's Evidence

    Command evidence:
    [Paste implementer's test command + output + exit code]

    Diff evidence:
    Commit: [SHA]
    [Paste git diff --stat]

    ## CRITICAL: Verify Everything Independently

    The implementer's report may be incomplete, inaccurate, or optimistic.
    You MUST verify by reading actual code.

    **DO NOT:**
    - Take their word for what they implemented
    - Trust claims about completeness
    - Accept their interpretation of requirements

    **DO:**
    - Read every file they changed
    - Compare actual implementation to requirements line by line
    - Check for missing pieces they claimed to implement
    - Look for extra features they didn't mention adding

    ## Your Job

    Check for:

    **Missing requirements:**
    - Everything requested actually implemented?
    - Requirements skipped or only partially done?
    - Claims that don't match the code?

    **Extra/unneeded work:**
    - Features built that weren't requested?
    - Over-engineering or unnecessary abstractions?
    - "Nice to haves" that weren't in spec?

    **Misunderstandings:**
    - Requirements interpreted differently than intended?
    - Wrong problem solved?
    - Right feature, wrong approach?

    ## Report Format

    Your verdict must include citation evidence — file:line references for
    every finding. Prose-only verdicts will be rejected.

    **If spec compliant:**
    - Spec compliant — all requirements met, nothing extra
    - Citations: [file:line confirming each key requirement is met]

    **If issues found:**
    - Missing: [what's missing — file:line where it should be]
    - Extra: [what was added beyond spec — file:line]
    - Wrong: [misinterpretations — file:line showing the issue]
```
