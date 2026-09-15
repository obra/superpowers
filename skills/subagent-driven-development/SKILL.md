---
name: subagent-driven-development
description: Use when executing an approved implementation plan with multiple tasks in the current session
---

# Direct-Execution Development

## Central Rule

> Superpowers improves the primary agent's engineering process. It does not automatically delegate work to other agents.

The primary agent already has the implementation plan, the repository context, the conversation context, the context from previous tasks, and the implementation decisions made so far. Delegating every task to a subagent forces that subagent to reconstruct all of this context from scratch, and creates unnecessary token and communication overhead for no engineering benefit.

**The primary Claude session should normally implement the work itself.** Subagents remain available, but delegation is optional and should only happen when it provides a concrete benefit. Superpowers should make the primary Claude agent better at engineering, not make Claude talk to more Claudes.

---

## Core Workflow

1. Read the entire approved implementation plan.
2. Critically review the plan before implementation (see Plan Review below).
3. Create an internal task checklist.
4. Execute tasks directly in the primary Claude session.
5. Run focused tests after each task.
6. Self-review each task against its requirements.
7. Fix problems immediately.
8. Re-test after fixes.
9. Continue to the next task.
10. Run the full relevant test suite after all tasks are complete.
11. Inspect the complete working tree.
12. Use `git status` and `git diff`.
13. Explicitly inspect untracked files.
14. Compare the implementation against the original plan and acceptance criteria.
15. Fix anything discovered.
16. Perform final verification.
17. Report what was implemented and tested.
18. Stop and return control to the user.

Do not automatically delegate every task to a subagent. Delegation is a deliberate, occasional choice, not a step in this loop.

---

## Plan Review

Before implementation, critically review the plan. Check for:

* contradictory requirements
* missing dependencies
* impossible assumptions
* ambiguous behaviour
* missing test coverage
* incorrect paths
* outdated architecture references
* unspecified dependencies
* conflicts with the existing codebase

If a problem can safely be resolved from the existing code and requirements, resolve it and continue.

If the plan is fundamentally broken, or requires an important decision that cannot reasonably be inferred, ask the user.

Do not spawn agents merely because the plan is unclear. Unclear plans are resolved by reading the codebase and asking the user, not by delegation.

---

## Task Structure

Tasks should be meaningful implementation units. A task should be:

* independently understandable
* independently testable where practical
* small enough to reason about
* large enough to represent meaningful progress

Do NOT define tasks around:

* commits
* reviewer-agent gates
* mandatory subagent handoffs

The purpose of task structure is efficient engineering progress, not ceremony.

---

## Testing

After each task, run the most relevant focused verification available. Possible verification includes:

* unit tests
* integration tests
* type checking
* linting
* builds
* targeted scripts
* application-specific validation

If verification fails:

1. Understand the failure.
2. Fix the implementation.
3. Run the test again.
4. Self-review again.
5. Continue only when the task is verified.

"The code looks correct" is never sufficient evidence. Verification means running something and observing the result, not re-reading the diff and feeling confident.

---

## Self-Review

Self-review is mandatory. It is **not** a separate reviewer agent — it is the primary agent deliberately reviewing its own completed task.

Check the following for every task:

### Requirements

* Every requirement was implemented.
* Nothing was omitted.
* No unrequested behaviour was introduced.

### Correctness

* The implementation works.
* Edge cases are handled.
* Errors are handled appropriately.
* Integration with existing code is correct.

### Scope

* Changes remain within the task.
* Unrelated files were not unnecessarily modified.
* Unnecessary complexity was not introduced.

### Tests

* Relevant tests pass.
* Additional tests are added when appropriate.
* Existing tests or assumptions have not been invalidated.

---

## Optional Subagents

Subagents remain available. **Subagents are a capability, not the default workflow.**

Use a subagent only when delegation provides a concrete benefit. Valid examples:

**Independent parallel work** — Two genuinely independent investigations or implementation areas can be performed simultaneously.

**Large isolated research** — A substantial investigation can be delegated when the primary agent does not need to maintain the entire investigation context.

**Specialist analysis** — A specialist can be useful where independent analysis materially improves confidence.

**Explicit user request** — If the user explicitly asks for another agent, follow that request.

Delegation should be flat:

```
Primary Agent
├── Optional specialist
├── Optional independent investigation
└── Optional parallel implementation
```

Avoid recursive delegation such as:

```
Primary Agent
└── Agent
    └── Agent
        └── Agent
```

Subagents should not recursively spawn additional agents unless another skill explicitly requires it.

---

## Git Safety (HARD REQUIREMENT)

Superpowers does not own Git history. The user owns:

* staging
* commits
* branch management
* merging
* rebasing
* pushing
* publication

**Do not automatically execute:**

* `git add`
* `git commit`
* `git commit --amend`
* `git reset`
* `git restore`
* `git checkout --`
* `git rebase`
* `git merge`
* `git cherry-pick`
* `git stash`
* `git push`
* `git branch -d`
* `git branch -D`

**Do not automatically:**

* stage files
* unstage files
* create commits
* amend commits
* rewrite history
* merge branches
* delete branches
* push
* discard user changes
* destructively clean the working tree

These operations require explicit user instruction for that specific operation, every time. Prior approval of one such operation does not imply approval for a repeated or similar operation later.

### Git Read-Only Operations

The following are allowed and encouraged when useful:

* `git status`
* `git diff`
* `git diff --stat`
* `git log`
* `git show`
* `git branch --show-current`
* `git merge-base`
* `git ls-files`

Use Git to inspect the state of the work, not to manage the user's history.

---

## Working Tree

The current working tree is the default implementation environment. Do NOT automatically:

* create a worktree
* create a branch
* require isolated workspace infrastructure

If the user explicitly requests isolation, the separate worktree skill may be used.

The normal workflow is:

```
Current working tree
      ↓
Implementation
      ↓
Testing
      ↓
Self-review
      ↓
Final verification
      ↓
User reviews changes
      ↓
User stages and commits
```

Respect existing user changes. Never discard pre-existing work.

Before modifying files, distinguish existing user changes from changes introduced during the current task. Do not overwrite, revert, or "clean up" unrelated user work.

---

## No Execution Ledger

Do not create or maintain a `.superpowers` execution ledger for ordinary plan execution. Do not create hidden execution state merely to allow the skill to resume itself.

The implementation plan, the repository state, and the conversation already provide the context required to execute and, if needed, resume this work.

---

## Final Verification

After all tasks are complete:

1. Run the full relevant test suite.
2. Inspect `git status`.
3. Inspect `git diff`.
4. Inspect untracked files explicitly.
5. Compare implementation against the original plan.
6. Check every task.
7. Check acceptance criteria.
8. Check for accidental unrelated changes.
9. Check for temporary debugging code.
10. Check for incorrect configuration.
11. Check for missing tests.
12. Check for generated files that should not exist.
13. Check whether documentation should have been updated.

If anything is wrong:

1. Fix it.
2. Re-run relevant tests.
3. Repeat final verification.

Do not declare completion merely because tests pass.

---

## Completion Standard

Require fresh evidence before claiming "done," "working," "tests pass," or "fully implemented." Re-reading code or recalling an earlier test run is not fresh evidence.

The intended completion sequence is:

```
Implementation
      ↓
Focused verification
      ↓
Self-review
      ↓
All tasks complete
      ↓
Full verification
      ↓
Working-tree inspection
      ↓
Plan and acceptance-criteria check
      ↓
Final verification
      ↓
Complete
```

---

## Hand-Off

When complete, report:

* what was implemented
* what was tested
* important implementation decisions
* remaining concerns
* current working-tree state

Then STOP.

Do NOT automatically:

* stage changes
* commit changes
* push changes
* merge changes
* create a pull request
* delete the branch
* delete a worktree
* discard changes
* invoke a finishing workflow that performs Git operations

The user decides what happens to the resulting working tree.

---

## Review Philosophy

**Old workflow:**

```
Primary Agent
      ↓
Implementer Agent
      ↓
Reviewer Agent
      ↓
Fixer Agent
      ↓
Reviewer Agent
      ↓
Next Task
```

**New workflow:**

```
Primary Agent
      ↓
Implement
      ↓
Test
      ↓
Self-review
      ↓
Fix
      ↓
Test
      ↓
Next Task
```

This change exists to avoid repeatedly reconstructing context across agents. Independent review remains available when it provides genuine value, but it is not mandatory ceremony.

---

## Final Summary

> Plan → Implement directly → Test → Self-review → Fix → Test → Continue → Final verification → Inspect working tree → Stop

> The primary agent owns implementation quality.

> The user owns Git history.
