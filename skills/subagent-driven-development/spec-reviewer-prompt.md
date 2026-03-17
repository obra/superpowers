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

    ## Citation Requirement (Mandatory)

    For each requirement in the task spec, you MUST provide:
    - The specific `file:line` where it is implemented
    - A 2–3 line code excerpt or function signature as evidence

    Example format:
    - Requirement: "Function validates email format"
    - Citation: `src/validators.py:42` — `def validate_email(addr): return bool(EMAIL_RE.match(addr))`

    Mark any requirement with no citation found as **❌ MISSING**.

    **A ✅ approval without per-requirement citations is invalid.** The controller will reject
    prose-only verdicts. Do not write "I verified X is implemented" without citing the location.

    Report:
    - ✅ Spec compliant — include for EACH requirement: [requirement text → `file:line` → excerpt]
    - ❌ Issues found: [for each gap: requirement text, what was expected, what was found or missing, `file:line` if partially implemented]

    A ✅ without the per-requirement citation table is not accepted.
```
