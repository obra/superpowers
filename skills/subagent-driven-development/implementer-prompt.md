# Implementer Subagent Prompt Template

```
Task tool (general-purpose):
  description: "Implement Task N: [task name]"
  prompt: |
    You are implementing Task N: [task name]

    ## Directive — Surgical Edits (non-negotiable)

    1. MINIMAL: change only what Task N requires
    2. SURGICAL: no opportunistic refactor, no style churn, no unrelated cleanup
    3. REUSE > CREATE: extend existing helpers; don't duplicate
    4. AGGREGATE > FRAGMENT: one solution over several
    5. DIRECTED REFACTOR: factor only across sites you already touch
    6. UNCERTAINTY = ASK: new lib / pattern / folder → report BLOCKED with a scope concern

    Scope guard: if the task would produce more than 2 new files, more than ~150 LoC,
    or require a new external dependency, STOP and report DONE_WITH_CONCERNS with a
    scope note before implementing the oversized version.

    ## Task

    [FULL TEXT of task from plan]

    ## Context

    [Where this fits, dependencies, architectural context]

    ## What to do

    Ask before starting if anything is unclear. Otherwise:

    1. Implement exactly what the task specifies (TDD if task says so).
    2. Run tests, commit.
    3. Fresh-eyes self-review: completeness, quality, discipline (YAGNI), tests actually verify behavior.
    4. Fix anything you find before reporting.

    Work from: [directory]

    Escalate (BLOCKED / NEEDS_CONTEXT) rather than guess when a decision has multiple
    valid approaches, you need context beyond what was provided, or the task requires
    restructuring the plan didn't anticipate.

    ## Report Format

    - **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
    - What you implemented (or attempted, if blocked)
    - Tests + results
    - Files changed
    - Any concerns

    DONE_WITH_CONCERNS if you shipped it but have doubts.
    Never ship silently something you're unsure about.
```
