# Implementer Subagent Prompt Template

Use this template when dispatching an implementer subagent.

```
Task tool (general-purpose):
  description: "Implement Task N: [task name]"
  prompt: |
    You are implementing Task N: [task name]

    ## Original Issue Context

    [If plan has Original Issue block, include it here:]

    > **ID:** [issue-id]
    > **Title:** [title]
    > **Status:** [Authoritative | Reference Only]

    [Issue body - abbreviated if very long, full if reasonable length]

    ---

    [If Authoritative, add:]
    **Requirement:** Verify your implementation satisfies the acceptance criteria in the Original Issue above.

    [If Reference Only, add:]
    **Note:** The Original Issue above is for context only. Follow the task spec below, not the issue directly.

    ---

    ## Task Description

    [FULL TEXT of task from plan - paste it here, don't make subagent read file]

    ## Context

    [Curated by orchestrator - include only what's relevant:]
    - Working directory: [path]
    - Key files: [list paths subagent will touch]
    - Pattern to follow: See [example file] for similar implementation
    - Dependency: Task 2 created [X], build on that
    - Constraint: [any architectural decisions that apply]

    ## Before You Begin

    If you have questions about:
    - The requirements or acceptance criteria
    - The approach or implementation strategy
    - Dependencies or assumptions
    - Anything unclear in the task description

    **Ask them now.** Raise any concerns before starting work.

    ## Your Job

    Once you're clear on requirements:
    1. Implement exactly what the task specifies
    2. Write tests (following TDD if task says to)
    3. Verify implementation works
    4. Commit your work
    5. Self-review (see below)
    6. Write handoff file (see below)
    7. Report back

    Work from: [directory]

    **While you work:** If you encounter something unexpected or unclear, **ask questions**.
    It's always OK to pause and clarify. Don't guess or make assumptions.

    ## Before Reporting Back: Self-Review

    Review your work with fresh eyes. Ask yourself:

    **Completeness:**
    - Did I fully implement everything in the spec?
    - Did I miss any requirements?
    - Are there edge cases I didn't handle?

    **Quality:**
    - Is this my best work?
    - Are names clear and accurate (match what things do, not how they work)?
    - Is the code clean and maintainable?

    **Discipline:**
    - Did I avoid overbuilding (YAGNI)?
    - Did I only build what was requested?
    - Did I follow existing patterns in the codebase?

    **Testing:**
    - Do tests actually verify behavior (not just mock behavior)?
    - Did I follow TDD if required?
    - Are tests comprehensive?

    **Original Issue Alignment:** (if Authoritative)
    - Did I address the acceptance criteria from the Original Issue?
    - Are there requirements in the issue I might have missed?

    If you find issues during self-review, fix them now before reporting.

    ## Write Handoff File

    After self-review, write your implementation report to `docs/handoffs/task-N-impl.md`:

    ```markdown
    # Task N Implementation Report

    ## What I Built
    [Your summary of what you implemented]

    ## Files Changed
    - path/to/file1.ts (what changed)
    - path/to/file2.test.ts (what changed)

    ## Test Results
    [e.g., "5/5 passing" or test output summary]

    ## Self-Review Notes
    - [Any decisions you made, tradeoffs considered, or concerns]
    - [Things reviewers should pay attention to]
    ```

    This handoff file will be read by reviewers, so include:
    - What you built and why you made key decisions
    - Concrete test results (not just "tests pass")
    - Any concerns or areas that need extra review attention

    ## Fixing Review Issues

    When you are re-invoked to fix issues found by a reviewer, append a `## Fixes Applied` section to your handoff file.

    **For each fix, use this format:**

    ```markdown
    ## Fixes Applied

    ### Fix 1: [Short title of what you fixed]
    - **Why:** [One sentence explaining why this matters - not just "reviewer said so"]
    - **Before:**
      ```[lang]
      [The code as it was - show enough context to understand the change]
      ```
    - **After:**
      ```[lang]
      [The code after your fix - same scope as Before]
      ```

    ### Fix 2: [Next fix title]
    ...
    ```

    **Guidelines:**
    - "Why" should explain the actual problem, not just repeat the reviewer's words
    - Show 2-5 lines of context in snippets - enough to understand, not entire functions
    - For additions (no "before"), show the surrounding code that now includes the addition
    - Each fix gets its own entry, even if they're in the same file

    ## Report Format

    When done, report:
    - Handoff file written to: docs/handoffs/task-N-impl.md
    - Commit SHA
    - Any blockers or questions for orchestrator
```
