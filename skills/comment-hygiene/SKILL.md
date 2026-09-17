---
name: comment-hygiene
description: Use during subagent-driven-development checkpoint reviews and before final hand-off to clean up comments introduced or modified during the current implementation — keep durable technical knowledge, remove narration/history/restated-obvious-code. Judgement-based, not a linter.
---

# Comment Hygiene

## Central Rule

> Comments should explain durable, non-obvious knowledge that the code alone cannot communicate clearly. They should not narrate the implementation, document the conversation/history of the change, or restate what obvious code already says.

The purpose of this skill is to prevent code bloat from explanatory comments that merely describe recent changes, justify simple decisions at excessive length, or narrate self-explanatory code — not to remove comments indiscriminately.

---

## Comments Worth Keeping

Preserve comments when they explain durable information such as:

* non-obvious constraints
* important invariants
* security implications
* tricky edge cases
* external system behaviour
* compatibility requirements
* workarounds for known bugs or limitations
* reasons a surprising implementation is necessary
* algorithmic reasoning that would otherwise be difficult to recover
* public API/documentation comments where the project convention requires them
* warnings about behaviour that future maintainers genuinely need to know

The reason should remain useful even months after the implementation was written.

---

## Comments to Remove or Shorten

Flag or remove comments that:

* simply restate what the code does
* narrate the implementation line-by-line
* explain obvious variable/function behaviour
* describe that a bug was "fixed"
* describe what Claude changed during the task
* explain the conversation or decision history unnecessarily
* justify a simple implementation in multiple paragraphs
* repeat information already obvious from names/types/tests
* act as miniature changelogs inside source files
* document temporary reasoning that no longer matters
* contain excessive prose where one concise sentence would work
* duplicate nearby documentation

For example, this:

```text
// We need to check whether the user exists here before continuing.
// This is important because earlier in the implementation we added
// the user lookup and then discovered that the user may not exist.
// Therefore we return early so that the rest of the function does
// not try to use a missing user.
```

should normally become either:

```text
// User may not exist; callers treat this as a no-op.
```

or no comment at all if the code already makes that obvious.

---

## Comment Quality Test

For each non-trivial comment ask:

1. Is this information still useful if the reader knows nothing about the current task?
2. Is the information non-obvious from the code?
3. Is it describing a durable fact rather than recent implementation history?
4. Is the wording concise?
5. Would better naming, structure, or tests communicate the same thing more effectively?

If the answer is mostly no, remove or shorten the comment.

---

## Prefer Fixing Code Over Explaining It

Prefer improving the code over explaining confusing code with comments.

Bad:

```javascript
// Check if the user has permission to perform the requested operation
// before proceeding with the operation.
if (user.permissions.includes("admin")) {
```

Better:

```javascript
if (user.permissions.includes("admin")) {
```

or improve the structure/name if necessary.

Do NOT add comments merely because code could be made clearer through better naming or structure.

---

## Do Not Remove Valuable Context

Never remove a comment simply because it is longer than one line. A longer comment can be justified when the underlying reasoning is genuinely complex or externally constrained. Use judgement rather than a rigid line-count rule.

---

## Scope

When invoked as part of Superpowers:

1. Inspect comments introduced or modified during the current task/checkpoint.
2. Identify comments that are verbose, redundant, historical, or obvious.
3. Keep comments that preserve durable technical knowledge.
4. Shorten comments that contain useful information but excessive prose.
5. Remove comments that add no durable value.
6. Prefer code improvements when they eliminate the need for explanatory comments.
7. Re-run relevant verification after modifying code.

---

## Generated and Documentation Comments

Apply project conventions. Do not remove:

* required generated-file headers
* licensing/copyright notices
* tool directives
* lint/compiler directives
* public API documentation required by the project
* comments required by external tooling

If uncertain whether a comment is required, inspect the surrounding project conventions before removing it.

---

## User Changes

Respect comments and source changes that existed before the current task. Only clean comments introduced or modified by the current implementation, unless the user explicitly asks for a broader cleanup. Do not rewrite unrelated comments merely for stylistic preference.

---

## Git Safety

This skill edits source files as part of implementation review, but it must not manage Git history.

Do NOT:

* `git add`
* `git commit`
* `git reset`
* `git restore`
* `git checkout --`
* `git rebase`
* `git merge`
* `git cherry-pick`
* `git stash`
* `git push`
* create/delete branches
* create/delete worktrees

The user owns Git history.

---

## Completion

Report:

* comments removed
* comments shortened
* important comments retained
* any code structure improvements made to eliminate unnecessary comments
* verification performed

Then stop.
