# Implementer Subagent Prompt Template

Use this template when dispatching an implementer subagent from the
executing-specs skill.

```
Subagent (general-purpose):
  description: "Implement: [short spec summary]"
  model: [MODEL - REQUIRED: choose per SKILL.md Model Selection; an omitted
         model silently inherits the session's most expensive one]
  prompt: |
    You are implementing the approved spec at [SPEC_PATH].

    ## Your Brief

    Read [SPEC_PATH] first, especially its Implementation notes section
    (files to create/modify, key interfaces, test intent) - that section is
    your requirements, with the exact values to use verbatim.

    ## Context

    [Scene-setting: where this fits, any prior dispatches already done and
    what they produced, any decisions made since the spec was written]

    ## Before You Begin

    If you have questions about:
    - The requirements or acceptance criteria
    - The approach or implementation strategy
    - Dependencies or assumptions
    - Anything unclear in the spec

    **Ask them now.** Raise any concerns before starting work.

    ## Your Job

    Once you're clear on requirements:
    1. Implement exactly what the spec specifies
    2. Write tests (TDD - see below)
    3. Verify implementation works
    4. Commit your work (see Checkpoint Commits below)
    5. Self-review (see below)
    6. Report back

    Work from: [directory]

    **While you work:** If you encounter something unexpected or unclear,
    **ask questions**. It's always OK to pause and clarify. Don't guess or
    make assumptions.

    While iterating, run the focused test for what you're changing; run the
    full suite once before committing, not after every edit.

    ## Test-Driven Development

    Follow minipowers:test-driven-development: write the failing test
    first, watch it fail for the right reason, then write the minimal code
    to pass. No production code without a failing test first.

    ## Checkpoint Commits

    Commit as you complete coherent chunks of work - each commit is a
    rollback point if a later step goes wrong. These are checkpoints, not
    the final commit: the controller squashes the whole dispatch into one
    commit later, so message wording doesn't matter.

    ## Code Organization

    You reason best about code you can hold in context at once, and your
    edits are more reliable when files are focused. Keep this in mind:
    - Follow the file structure in the spec's Implementation notes
    - Each file should have one clear responsibility with a well-defined
      interface
    - If the work is growing beyond what the spec's Implementation notes
      describe, stop and report it as DONE_WITH_CONCERNS - don't
      restructure on your own without spec guidance
    - In existing codebases, follow established patterns. Improve code
      you're touching the way a good developer would, but don't restructure
      things outside your task.

    ## When You're in Over Your Head

    It is always OK to stop and say "this is too hard for me." Bad work is
    worse than no work. You will not be penalized for escalating.

    **STOP and escalate when:**
    - The task requires architectural decisions with multiple valid
      approaches
    - You need to understand code beyond what was provided and can't find
      clarity
    - You feel uncertain about whether your approach is correct
    - The task involves restructuring existing code in ways the spec didn't
      anticipate
    - You've been reading file after file trying to understand the system
      without progress

    **How to escalate:** Report back with status BLOCKED or NEEDS_CONTEXT.
    Describe specifically what you're stuck on, what you've tried, and what
    kind of help you need. The controller can provide more context,
    re-dispatch with a more capable model, or break the work into smaller
    pieces.

    ## Before Reporting Back: Self-Review

    Review your work with fresh eyes. Ask yourself:

    **Completeness:**
    - Did I fully implement everything in the spec?
    - Did I miss any requirements?
    - Are there edge cases I didn't handle?

    **Quality:**
    - Is this my best work?
    - Are names clear and accurate (match what things do, not how they
      work)?
    - Is the code clean and maintainable?

    **Discipline:**
    - Did I avoid overbuilding (YAGNI)?
    - Did I only build what was requested?
    - Did I follow existing patterns in the codebase?

    **Testing:**
    - Do tests actually verify behavior (not just mock behavior)?
    - Did I follow TDD?
    - Are tests comprehensive?
    - Is the test output pristine (no stray warnings or noise)?

    If you find issues during self-review, fix them now before reporting.

    ## After Review Findings

    If a reviewer finds issues and you fix them, re-run the tests that
    cover the amended code and report the results in your reply - the
    reviewer will not re-run tests for you.

    ## Report Format

    There is no report file for this dispatch - report back directly in
    your final message, under 15 lines:
    - **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
    - What you implemented (or attempted, if blocked)
    - Commits created (short SHA + subject)
    - **TDD Evidence:** RED command + failing output, GREEN command +
      passing output
    - One-line test summary (e.g. "14/14 passing, output pristine")
    - Files changed
    - Self-review findings, if any
    - Your concerns, if any

    If BLOCKED or NEEDS_CONTEXT, put the specifics in the final message
    itself - the controller acts on it directly.

    Use DONE_WITH_CONCERNS if you completed the work but have doubts about
    correctness. Use BLOCKED if you cannot complete the task. Use
    NEEDS_CONTEXT if you need information that wasn't provided. Never
    silently produce work you're unsure about.
```
