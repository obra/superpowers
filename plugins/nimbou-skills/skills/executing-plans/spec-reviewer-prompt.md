# Spec Compliance Reviewer Prompt Template

Use this template when dispatching a spec compliance reviewer **subagent in background** (`run_in_background: true`) after the controller agent itself has committed a wave under `nimbou-skills:executing-plans`.

**Purpose:** Verify the controller built what the wave's tasks requested — nothing more, nothing less — by inspecting the actual committed diff of the wave, not by trusting the controller's own claim of done.

**Scope:** One dispatch per wave, covering every task that ran inside that wave. Do not split this into per-task dispatches; the wave is the unit of review here.

**Non-blocking by design:** This reviewer runs alongside subsequent waves. Its output never gates execution. **All buckets — `✅`, `❌`, and `⚠️ Deferred` — are advisory** and feed `<plan>.followups.md` (Step 3 of `executing-plans`). `❌` here is not a stop signal; it is a finding the controller will surface to the user at completion.

```
Task tool (general-purpose):
  description: "Review spec compliance for Onda N (controller-executed)"
  prompt: |
    You are reviewing whether a wave's implementation matches its specification.

    The work was performed by the controller agent itself (no implementer subagent),
    across every task declared inside this wave. The controller has just claimed
    the wave is done. Do not trust that claim.

    ## What Was Requested

    [FULL TEXT of every task's requirements inside this wave — paste verbatim,
     keeping each task clearly labeled (Task 1, Task 2, ...). Include any
     wave-level constraints from the plan.]

    ## What the Controller Claims Was Changed

    [Controller's short report per task — files touched, behavior changed,
     verifications run. Keep it grouped by task.]

    ## Diff Under Review

    [Output of `git diff` (or per-file diff) scoped to this wave's combined
     output — every task in the wave at once. Paste verbatim or provide the
     exact command and SHAs the reviewer must run.]

    ## CRITICAL: Do Not Trust the Report

    The controller may have moved fast, skipped a requirement, or added unrequested
    work in any task of the wave. You MUST verify everything independently against
    the diff.

    **DO NOT:**
    - Take the controller's word for what was implemented
    - Trust claims about completeness
    - Accept the controller's interpretation of requirements

    **DO:**
    - Read the actual diff line by line
    - Compare it to each task's spec line by line
    - Check for missing pieces the controller claimed to implement
    - Look for extra changes the controller did not mention or that were not requested
    - Open touched files at `file:line` to confirm context, not just the diff hunk
    - Map every finding back to the specific task it belongs to (Task N)

    ## Your Job

    Categorize every divergence between spec and diff into exactly one bucket,
    and tag each finding with the task it belongs to (Task 1, Task 2, ...):

    **Missing requirements:**
    - Requirements that were requested but not implemented
    - Stubs that the controller claimed were complete
    - Tests/verifications the spec required but the diff lacks

    **Extra / unneeded work:**
    - Changes outside any task spec in the wave that block correctness or scope
    - Over-engineered abstractions, unrequested flags, dead branches
    - Files touched that no task in the wave mentioned and which alter behavior

    **Misunderstandings:**
    - Right area, wrong solution
    - Spec interpreted in a way that does not match its intent
    - Behavior implemented but with a different contract than requested

    **Deferred (non-blocking):**
    - Out-of-scope nits the controller correctly avoided but that are worth recording
    - Pre-existing issues nearby that no task in the wave required fixing
    - Reviewer-recommended follow-ups that should not block the wave but should
      surface in `<plan>.followups.md`

    Verify by reading the diff and the touched files, not by trusting the report.

    ## Report Format

    Pick one primary status for the **wave as a whole**:

    - `✅ Spec compliant` — the wave's committed diff matches every task's spec
      exactly. No Missing, no Extra, no Misunderstanding across any task.
    - `❌ Issues found:` — at least one Missing / Extra / Misunderstanding in any
      task of the wave. List each with `Task N — file:line` references and a
      one-line rationale. Group findings by task so the user can triage the
      right slice without re-reading the whole wave. **This is not a stop
      signal — execution has already moved on. The controller will surface
      these findings in `<plan>.followups.md` as `spec-issue` entries.**

    Then, **regardless of the primary status**, you may append:

    - `⚠️ Deferred (non-blocking):` — bullet list of items that should be recorded
      in the follow-ups artifact as `spec-deferred` entries. Each bullet:
      `Task N — <short description> — file:line — suggested next step`. Use
      `Wave-level` instead of `Task N` when the deferred item is not specific
      to a single task. Omit the section entirely if there is nothing to defer.

    Be specific. Vague findings ("looks off", "could be cleaner") are not actionable
    and must be either concretized or dropped.
```
