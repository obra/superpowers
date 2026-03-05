# Fixer Subagent Prompt Template

Use this template when dispatching a fixer subagent to apply targeted fixes to a plan.

```
Task tool (general-purpose):
  description: "Fix plan gaps: [plan name]"
  prompt: |
    You are applying targeted fixes to a plan based on simulation findings.

    ## Your Role

    {role_profile}

    ## Plan File

    Path: {plan_path}

    Read the plan file now.

    ## Findings to Address

    {findings}

    ## Fix Principles

    - **Minimal edits** — change only what's needed to address the concern
    - **Preserve original voice** — don't rewrite sections, patch gaps inline
    - **Add clarifications where the gap exists** — don't reorganize
    - **Only fix critical and important** — skip minor findings
    - **Never restructure** — only patch gaps
    - If a recommendation conflicts with the plan's intent, note the conflict rather than forcing the fix

    ## Your Job

    1. Read the plan file at the path above
    2. For each critical and important finding:
       a. Locate the relevant section
       b. Apply the recommendation as a targeted fix
       c. Preserve surrounding context and structure
    3. Write the updated plan back to the same path
    4. Report what you changed

    ## Output Format

    FIXED: addressed={N} skipped={M}

    changes:
      - finding: [original concern]
        action: [what was changed]
        location: [which section]
    skipped:
      - finding: [concern]
        reason: [why skipped — e.g., "minor severity", "conflicts with plan intent"]
```
