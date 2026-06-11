---
name: quick-ship
description: Streamlined workflow for small, lightweight, fast-to-complete projects. Skips the full brainstorming/spec/planning ceremony when scope is already clear. Use when the user says "quick ship", "small project", "fast project", "just build it", "ship this fast", "lightweight task", or invokes /quick-ship.
tags: [small-project, lightweight, fast, quick]
---

# /quick-ship

A trimmed workflow for projects that don't need a full spec cycle. The hallmark: you already know what to build and it fits in one sitting.

## When to use this instead of brainstorming

Use `quick-ship` when ALL of the following are true:

- The deliverable is describable in one sentence.
- No new external services, databases, or APIs are being introduced.
- The whole thing can be done start-to-finish in under two hours.
- You are not changing a shared interface or public API.

If any of those are false, use `brainstorming` instead.

## The workflow (6 steps, no ceremony)

### 1. Restate the goal in one sentence

Before touching code, write the goal as a single imperative sentence. If you can't, the project is not small enough for this skill — switch to `brainstorming`.

Example: "Add a `--dry-run` flag to the deploy command that prints actions without executing them."

### 2. Identify the blast radius

Answer three questions (inline, no document):

- What files change?
- Does any public interface change?
- Do existing tests still pass after this?

If the blast radius is larger than expected, stop and use `brainstorming`.

### 3. Build it

Write the code. Rules:
- No new abstractions beyond what the task requires.
- No half-finished implementations.
- No comments that describe what the code does — only the *why* if it's non-obvious.
- Three similar lines is better than a premature abstraction.

### 4. Test it

Run the existing test suite. If the project has none, run the thing manually and confirm the golden path works.

Do NOT skip this step because the change is "obviously correct."

### 5. Commit

Plain imperative commit message. No conventional prefix (`feat:`, `fix:`, etc.). No Claude attribution. Match the repo's existing commit style.

### 6. Ship

Push the branch. Open a PR if the project uses one. Done.

## What this skill explicitly skips

| Skipped step | Why |
|---|---|
| Full spec doc | Scope is already clear |
| Writing a plan | Single-sitting work doesn't need task decomposition |
| Subagent dispatch | No parallelism needed at this scale |
| COMMAND_STATUS / status tracking | No ongoing port or migration |

## Anti-patterns

**Scope creep mid-ship.** If you discover the change is larger than the one-sentence goal, stop. Commit what you have (if it's in a shippable state), open a new conversation, and re-scope with `brainstorming`.

**Skipping the test.** "It's just a flag" has caused many regressions. Run the tests.

**Writing the PR body before the code works.** Ship working code first, then write context.

## Signals that you picked the wrong skill

- You are editing more than 5 files.
- You needed to look up an API you haven't used before.
- You are about to add a new dependency.
- The commit message needs two sentences to be accurate.

Any of these: stop, use `brainstorming`.
