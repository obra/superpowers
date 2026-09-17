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
10. At meaningful milestones, perform a checkpoint review of the accumulated work (see Checkpoint Reviews below).
11. Run the full relevant test suite after all tasks are complete.
12. Inspect the complete working tree.
13. Use `git status` and `git diff`.
14. Explicitly inspect untracked files.
15. Compare the implementation against the original plan and acceptance criteria.
16. Fix anything discovered.
17. Perform final verification.
18. Report what was implemented and tested.
19. Stop and return control to the user.

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

After each task, run the most relevant focused verification available. Use `superpowers:verification-strategy` to decide what level and kind of verification is actually proportional to the change — a doc tweak and a refactor don't warrant the same evidence. Possible verification includes:

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

## Checkpoint Reviews

Self-review checks each task in isolation. A checkpoint review periodically checks the *accumulated* work — several completed tasks together — to catch architectural, integration, requirement, and scope problems before they compound. It is not a reviewer-agent gate and does not run after every task.

### When to checkpoint

Use engineering judgement. A checkpoint is normally appropriate when:

* a coherent feature/component has been completed
* several closely related tasks have accumulated
* a foundational change is complete and later tasks depend on it
* a significant integration boundary has been crossed
* a high-risk architectural/security change has just been completed
* the implementation plan explicitly identifies a review point
* roughly 2-4 related tasks have been completed without another natural checkpoint

These are examples, not a fixed rule. Do NOT adopt a fixed "review every N tasks" policy — a single large or risky task can justify an immediate checkpoint, and several small tasks that form one coherent change can be reviewed together.

```
Execute tasks
      ↓
Focused verification + self-review per task
      ↓
Meaningful milestone reached?
      ↓
NO → Continue
      ↓
YES
      ↓
Checkpoint review of accumulated changes
      ↓
Requirements / architecture / integration / scope check
      ↓
Scope drift check
      ↓
Comment hygiene review
      ↓
Independent review (optional)
      ↓
Problems found?
   ↓             ↓
  YES            NO
   ↓              ↓
Fix + test       Continue
   ↓
Re-review checkpoint if the fixes materially changed the reviewed area
      ↓
Continue
```

### What a checkpoint review examines

Review the accumulated work since the previous checkpoint (or since implementation began, for the first checkpoint). Inspect the actual current working tree as needed. Do NOT use commits, staging, or Git history as review checkpoints.

**Requirements** — Does the implementation still match the plan? Are acceptance criteria being satisfied? Has any requirement been missed or unintentionally changed?

**Integration** — Do the completed pieces fit together correctly? Are interfaces and assumptions consistent? Have earlier decisions created problems for upcoming tasks?

**Architecture** — Is the implementation still following the intended design? Has unnecessary complexity appeared? Has the implementation drifted from the plan?

**Scope** — Are changes still within the intended scope? Are unrelated changes appearing? Is temporary/debug code accumulating?

**Tests** — Are focused tests still meaningful? Are important integration cases covered? Is any new behaviour insufficiently verified? Use `superpowers:verification-strategy` to judge what level and kind of verification is actually proportional to the accumulated change, rather than defaulting to "re-run everything" or "looks fine."

### Checkpoint scope check

At a checkpoint, also decide whether the accumulated changes are still within the requested scope, using `superpowers:scope-drift-check`. Classify what's changed since the previous checkpoint:

* Required and genuinely necessary Supporting changes stay.
* Incidental improvements are named as potential follow-up work rather than folded in silently.
* Unrelated changes are removed from this task or split out.

The current explicit scope is whatever the user has actually authorized in the conversation so far — not necessarily the original wording of the request, if the user has since expanded it.

This is normally performed by the primary agent, the same as the rest of the checkpoint review — do not automatically spawn a subagent for it. An independent reviewer remains optional, per the existing review policy below.

### Checkpoint comment hygiene

At a checkpoint, also inspect comments introduced or materially changed since the previous checkpoint (see `superpowers:comment-hygiene`). Ask:

* Did the implementation add verbose explanatory comments?
* Are comments describing recent implementation history rather than durable facts?
* Are obvious comments restating the code?
* Can a comment be shortened without losing important information?
* Should code structure or naming be improved instead?
* Are there useful comments documenting constraints, invariants, workarounds, or tricky reasoning that should remain?

Clean up unnecessary comment bloat before continuing, then run the relevant verification. This is normally performed by the primary agent, the same as the rest of the checkpoint review — do not automatically spawn a subagent for comment cleanup. An independent reviewer remains optional, per the existing review policy below.

### Self-review vs. independent review

A checkpoint review does NOT automatically mean spawning another agent. The default is the primary agent reviewing the accumulated work itself, using the criteria above.

An independent reviewer (via `superpowers:requesting-code-review`) may be worth requesting when the accumulated change is large, the architecture is complex, the change is security-sensitive, independent reasoning would materially improve confidence, or the user explicitly requests it. Do not automatically dispatch a reviewer at every checkpoint.

### Fixing checkpoint findings

If a checkpoint identifies a real problem:

1. Understand the problem.
2. Fix it in the primary session.
3. Run the relevant verification.
4. Self-review the affected area again.
5. Continue.

Do not automatically spawn a fixer agent. Do not require a second reviewer for every fix — a re-review is appropriate only when the fix materially changes the reviewed area, the original issue was high-risk, independent review was explicitly requested, or another review would materially improve confidence.

### Relationship to task self-review and final verification

Three levels, each serving a different purpose:

* **Task self-review** — checks the individual task immediately; catches local mistakes quickly.
* **Checkpoint review** — checks several completed tasks together; catches integration, architecture, scope, and requirement drift.
* **Final verification** — checks the complete implementation before hand-off.

```
Task
 ↓
Implement
 ↓
Focused test
 ↓
Task self-review
 ↓
Next task
 ↓
...
 ↓
Meaningful milestone
 ↓
Checkpoint review
 ↓
Scope drift check
 ↓
Comment hygiene
 ↓
Fix + verify
 ↓
Continue
 ↓
Final verification
```

Checkpoint reviews must not introduce Git mutations — they inspect the current working tree the same way self-review and final verification do; see Git Safety below.

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
14. Perform a final comment-hygiene pass over comments introduced or modified during the implementation (see `superpowers:comment-hygiene`) — a lightweight quality pass, not a rewrite of pre-existing repository comments.
15. Confirm the final implementation still satisfies the requested scope, using `superpowers:scope-drift-check` — Required and Supporting changes stay; Incidental or Unrelated additions are reported as potential follow-up rather than left in silently.
16. Confirm the verification actually carried out is proportional to the change, using `superpowers:verification-strategy` — state plainly what was verified, what wasn't, and why, rather than implying blanket certainty.

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

> Plan → Implement directly → Test → Self-review → Fix → Test → Continue → Checkpoint review + comment hygiene at meaningful milestones → Final verification → Inspect working tree → Stop

> The primary agent owns implementation quality.

> The user owns Git history.
