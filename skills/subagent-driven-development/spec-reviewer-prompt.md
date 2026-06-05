# Spec Compliance Reviewer Prompt Template

Use this template when dispatching a spec compliance reviewer subagent.

**Purpose:** Verify implementer built what was requested (nothing more, nothing less)

```
Task tool (general-purpose):
  description: "Review spec compliance for Task N"
  prompt: |
    You are reviewing whether an implementation matches its specification.

    ## What Was Requested

    [FULL TEXT of task requirements]

    ## What Implementer Claims They Built

    [From implementer's report]

    ## CRITICAL: Do Not Trust the Report

    The implementer finished suspiciously quickly. Their report may be incomplete,
    inaccurate, or optimistic. You MUST verify everything independently.

    **DO NOT:**
    - Take their word for what they implemented
    - Trust their claims about completeness
    - Accept their interpretation of requirements

    **DO:**
    - Read the actual code they wrote
    - Compare actual implementation to requirements line by line
    - Check for missing pieces they claimed to implement
    - Look for extra features they didn't mention

    ## Your Job

    Read the implementation code and verify:

    **Missing requirements:**
    - Did they implement everything that was requested?
    - Are there requirements they skipped or missed?
    - Did they claim something works but didn't actually implement it?

    **Extra/unneeded work:**
    - Did they build things that weren't requested?
    - Did they over-engineer or add unnecessary features?
    - Did they add "nice to haves" that weren't in spec?

    **Misunderstandings:**
    - Did they interpret requirements differently than intended?
    - Did they solve the wrong problem?
    - Did they implement the right feature but wrong way?

    **Verify by reading code, not by trusting report.**

    ## Report Format

    Report a structured tail with these required fields:

    - **verdict:** `concur` (everything matches after code inspection) | `concerns` (issues
      found that should block proceeding) | `blocked` (cannot evaluate — explain why)
    - **findings:** array. Empty array `[]` if you have no concerns. Each finding is
      `{file, line, severity, message}` where severity is `info | warn | error`. A
      MISSING findings field is the silent-no-op signal — the controller will treat it
      as if you didn't actually review and will re-dispatch you. Always include this
      field, even if empty.
    - **evidence:** `{files_read: [...]}` — list the file paths you actually opened
      during this review. Empty array is acceptable (some reviews evaluate without
      reading specific files), but include the field.
    - **low_confidence:** `true` if you could not gather enough evidence to evaluate
      with confidence (e.g., reviewing a YAML config without an obvious primary file).
      `false` otherwise (default).

    **Critical:** Do NOT return `concur` without an explicit `findings: []` array. A
    missing findings field is the silent-no-op signal and will trigger a re-dispatch.
    Self-reports are advisory; the controller verifies your tail mechanically.
```
