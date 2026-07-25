# Spec Document Reviewer Prompt Template

Use this template when dispatching the read-only Codex written-spec reviewer.

**Purpose:** Adversarially verify that the spec is grounded, complete, simple, and ready for implementation planning.

**Dispatch after:** Spec document is written to docs/superpowers/specs/

```
Subagent (codex:codex-rescue):
  description: "Adversarial written-spec review"
  prompt: |
    Adversarially review this written specification. Do not edit files.

    **Spec to review:** [SPEC_FILE_PATH]
    **Approved intent and constraints:** [COMPACT SUMMARY]
    **Relevant repository evidence:** [PATHS, COMMAND OUTPUT, OR "NONE"]

    Central question: Could another competent coding agent implement this
    specification without making material assumptions?

    Check for blockers, ambiguity, unsupported assumptions, hallucinated or
    unverified technical claims, missing acceptance criteria, invented
    requirements, unnecessary complexity, materially simpler alternatives,
    missing edge cases, missing test requirements, and unimplementable
    dependencies or capabilities.

    Ask: Can this be materially simpler while still fully solving the current
    requirement?

    Do not rewrite the spec. Do not redesign merely because you prefer another
    architecture. Only block on issues that could cause a materially incorrect,
    incomplete, unverifiable, or unnecessarily complex implementation.

    ## Output Format

    ## Spec Review

    **Status:** Approved | Issues Found

    **BLOCKERS**
    - [Section]: [issue] — [impact and smallest useful correction or evidence needed]

    **IMPORTANT**
    - [Section]: [issue] — [impact and smallest useful correction or evidence needed]

    **OPTIONAL**
    - [advisory improvement]

    Classify material factual claims as VERIFIED, INFERRED, or UNSUPPORTED where
    useful. Write "None" under empty sections.
```

**Reviewer returns:** status and severity-classified findings. The primary agent verifies and synthesizes them into the canonical spec.
