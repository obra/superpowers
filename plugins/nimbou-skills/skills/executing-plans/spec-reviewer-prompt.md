# Spec Compliance Reviewer Prompt Template

Use this template when dispatching a spec compliance reviewer subagent **after the controller agent itself has executed a task** under `nimbou-skills:executing-plans`.

**Purpose:** Verify the controller built what the task spec requested — nothing more, nothing less — by inspecting the actual diff, not by trusting the controller's own claim of done.

**Note on `⚠️ Deferred`:** This template adds a third reporting bucket on top of the standard `✅` / `❌` outputs. Use `⚠️ Deferred` for items that fall outside the task spec but are reasonable to leave for later (e.g., a pre-existing inconsistency the controller chose not to touch, a refactor the spec did not call for, a comment-level cleanup). These items are not blockers; they feed the post-execution `<plan>.followups.md` artifact produced by `executing-plans` Step 3.

```
Task tool (general-purpose):
  description: "Review spec compliance for Task N (controller-executed)"
  prompt: |
    You are reviewing whether a task implementation matches its specification.

    The work was performed by the controller agent itself (no implementer subagent).
    The controller has just claimed this task is done. Do not trust that claim.

    ## What Was Requested

    [FULL TEXT of task requirements from the plan — paste verbatim]

    ## What the Controller Claims Was Changed

    [Controller's short report — files touched, behavior changed, tests run]

    ## Diff Under Review

    [Output of `git diff` (or per-file diff) scoped to this task only — paste verbatim or provide the exact command and SHAs the reviewer must run]

    ## CRITICAL: Do Not Trust the Report

    The controller may have moved fast, skipped a requirement, or added unrequested
    work. You MUST verify everything independently against the diff.

    **DO NOT:**
    - Take the controller's word for what was implemented
    - Trust claims about completeness
    - Accept the controller's interpretation of requirements

    **DO:**
    - Read the actual diff line by line
    - Compare it to the task spec line by line
    - Check for missing pieces the controller claimed to implement
    - Look for extra changes the controller did not mention or that were not requested
    - Open touched files at `file:line` to confirm context, not just the diff hunk

    ## Your Job

    Categorize every divergence between spec and diff into exactly one bucket:

    **Missing requirements:**
    - Requirements that were requested but not implemented
    - Stubs that the controller claimed were complete
    - Tests/verifications the spec required but the diff lacks

    **Extra / unneeded work:**
    - Changes outside the task spec that block correctness or scope
    - Over-engineered abstractions, unrequested flags, dead branches
    - Files touched that the spec did not mention and which alter behavior

    **Misunderstandings:**
    - Right area, wrong solution
    - Spec interpreted in a way that does not match its intent
    - Behavior implemented but with a different contract than requested

    **Deferred (non-blocking):**
    - Out-of-scope nits the controller correctly avoided but that are worth recording
    - Pre-existing issues nearby that the spec did not require fixing
    - Reviewer-recommended follow-ups that should not block the wave but should
      surface in `<plan>.followups.md`

    Verify by reading the diff and the touched files, not by trusting the report.

    ## Report Format

    Pick one primary status:

    - `✅ Spec compliant` — diff matches the spec exactly. No Missing, no Extra, no Misunderstanding.
    - `❌ Issues found:` — at least one Missing / Extra / Misunderstanding. List each with `file:line` references and a one-line rationale.

    Then, **regardless of the primary status**, you may append:

    - `⚠️ Deferred (non-blocking):` — bullet list of items the controller agent should record in the post-execution follow-ups artifact. Each bullet: `<short description> — file:line — suggested next step`. Omit the section entirely if there is nothing to defer.

    Be specific. Vague findings ("looks off", "could be cleaner") are not actionable
    and must be either concretized or dropped.
```
