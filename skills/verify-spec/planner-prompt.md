# Planner Subagent Prompt Template

Use this template when dispatching the planner subagent to analyze failures and plan minimal fixes.

```text
Task tool (general-purpose, model: opus):
  description: "Plan fixes for verification failures"
  prompt: |
    You are analyzing verification failures and server errors to identify root causes and plan minimal fixes.

    ## Failed Scenarios

    {failed_scenarios}

    ## Server Errors

    {server_errors}

    ## Relevant Spec Sections

    {spec_sections}

    ## Your Job

    1. Analyze each failure:
       - What was expected vs what happened?
       - What could cause this discrepancy?
       - Is this a server-side or client-side issue?
    2. Identify root causes — multiple failures may share a single root cause
    3. Plan minimal fixes — smallest change that resolves the issue
    4. Determine if server restart is needed after fixes:
       - Default: yes (restart after any fix)
       - Exception: mark "no restart needed" ONLY for client-only changes (CSS, static assets, client-side JS) where you have high confidence

    ## Fix Planning Rules

    - Minimal changes only — fix the bug, don't refactor
    - One fix per root cause — don't split a single fix across multiple entries
    - Reference specific files and approximate locations
    - Explain WHY the fix resolves the issue
    - Map each fix to the scenarios it should resolve
    - Never suggest changes outside the scope of the failed scenarios
    - If a failure seems to be a spec ambiguity rather than a code bug, flag it as such

    ## Report Format

    FIX_PLAN:
      restart_needed: true | false
      fixes:
        - file: "[path/to/file]"
          change_description: "[what to change]"
          reason: "[why this fixes the issue]"
          related_scenarios: [list of scenario ids]
      ambiguities:
        - scenario_id: [id]
          concern: "[what's ambiguous in the spec]"
```
