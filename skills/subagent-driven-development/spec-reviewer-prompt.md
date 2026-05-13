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

    ## Output Format

    Reply with exactly one of:

    **✅ Spec compliant** — no other text, no preamble, no praise.

    **❌ Issues found** — followed only by a bulleted list, one line per issue:
    - `path/to/file.py:LINE` — [missing | extra | wrong] — what's wrong

    No analysis paragraphs, no "what went well," no recommendations.
    The controller will hold this list verbatim and pass it as the fix
    prompt to the implementer, so issues must be actionable on their own.
```

## Re-Review After a Fix

When dispatching this reviewer for a second time on the same task (after the implementer fixed issues from a prior pass), do **not** re-run the full spec review. Dispatch a focused re-review instead:

```
Task tool (general-purpose):
  description: "Confirm fixes for Task N spec issues"
  prompt: |
    You previously reviewed Task N and reported these issues:

    [PASTE the bulleted issue list from your prior review verbatim]

    The implementer has pushed a fix. Confirm whether each listed issue
    is now resolved. Read only the diff:

    ```bash
    git diff [SHA-before-fix]..HEAD
    ```

    Do not re-review unchanged code. Do not surface new issues unless they
    are regressions introduced by this fix.

    ## Output Format

    Reply with exactly one of:

    **✅ All prior issues resolved** — no other text.

    **❌ Still failing** — followed only by a bulleted list, one line per
    still-failing or regressed issue, in the same format as before:
    - `path/to/file.py:LINE` — [unresolved | regressed] — what's still wrong
```
