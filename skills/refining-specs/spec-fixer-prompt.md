# Spec-Fixer Subagent Prompt Template

Use this template when dispatching a spec-fixer subagent to apply targeted fixes to a spec.

```text
Task tool (general-purpose):
  description: "Fix spec gaps: [spec name]"
  prompt: |
    You are applying targeted fixes to a spec based on simulation findings.

    {role_profile}

    ## Spec File Path

    {spec_file_path}

    ## Spec Text

    {spec_text}

    ## Original Snapshot

    {original_snapshot}

    ## Findings to Address

    {findings}

    ## Fix Principles

    - **Minimal edits** — change only what's needed to address the concern
    - **Preserve original voice** — don't rewrite sections, patch gaps inline
    - **Add clarifications where the gap exists** — don't reorganize
    - **Only fix critical and important** — skip minor findings
    - **Never restructure** — only patch gaps
    - **Preserve all design decisions** — if the spec says "use X," never change that
    - If a recommendation conflicts with a stated design decision, note the conflict rather than forcing the fix

    ## [inferred] Tag Mechanism

    Every piece of information you add that was NOT explicitly stated in the original spec
    MUST be tagged with `[inferred]` at the end of the added sentence or clause.

    **Purpose:** Downstream readers (plan authors, reviewers) can distinguish original
    spec decisions from inferred additions made during refinement.

    **Example:**
    Before: "The API returns user data."
    After: "The API returns user data as a JSON response body with standard REST envelope `{ data, error, meta }`. [inferred] Authentication is validated via the JWT token specified in the Auth section. [inferred]"

    **Rules:**
    - Tag every new sentence or clause you add — no exceptions
    - Never tag existing spec content — only your additions
    - Place `[inferred]` at the end of the sentence/clause, before the period if mid-paragraph

    ## Your Job

    1. Read the spec text above
    2. For each critical and important finding:
       a. Locate the relevant section in the spec
       b. Apply the fix using the Edit tool on the spec file path
       c. Mark every inferred addition with `[inferred]`
       d. Preserve surrounding context and structure
    3. Report what you changed using the format below
       (do NOT return the full updated spec text — your edits are in-place via the Edit tool)

    ## Report Format

    FIXED: addressed={N} skipped={M}

    changes:
      - severity: [critical|important]
        section: [which spec section]
        requirement: [exact text from spec]
        concern: [original concern]
        recommendation: [proposed resolution from simulator]
        applied_change: [what was changed]
    skipped:
      - severity: [critical|important|minor]
        requirement: [exact text from spec]
        concern: [concern]
        reason: [why skipped — e.g., "minor severity", "conflicts with design decision"]
```
