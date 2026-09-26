# Agent invariants

The coordinator, the implementer, the test-writer, and the reviewer all read this file at run
time. It is the one place this project's facts and silent-failure modes are stated,
because four copies would drift. Agents cite sections by name and conditions by their bold
lead phrase.

**Everything in this file is project-specific.** Fill it in when you adopt the template,
and keep it current: a lesson scoped `local` by `improve-agents` lands here, not in an
agent file.

## Project config

| Key | Value | Meaning |
|---|---|---|
| `base_branch` | `main` | Integration branch. Tickets branch from `origin/<base_branch>`; PRs target it. The local copy may carry the user's unpushed work — never branch from it and never sync it. |
| `merge_strategy` | `squash` | How PRs merge. With squash, a PR title's `Closes #n` can close the issue before the coordinator's close-out comment — post close-out comments separately and verify they landed. |
| `ticket_tracker` | GitHub Issues via `gh` | Labels are the state machine: `project:<slug>`, `status:ready` / `in-progress` / `blocked` / `held` / `done`. |
| `ticket_worktree_pattern` | `./tkt-<n>-<slug>/` | Per-ticket worktree path, relative to the main checkout. Add the pattern to `.gitignore`. |
| `coordinator_worktree` | *(optional)* | If set, the coordinator runs from its own worktree so the user's main checkout is never touched. Blank: it runs in the main checkout. |
| `secrets_files` | `.env`, `.env.*`, `.secrets/` | Never read into any agent's context, never staged, never printed. A script MAY source them if no value reaches stdout/stderr on any path, values go via env/stdin never argv, and a missing variable is reported by name only. |
| `commit_convention` | Conventional Commits | Subject in the imperative, ≤ 50 chars; body only when the why is not obvious from the diff. |
| `template_repo` | https://github.com/66degrees/ai-ml-agentic-engineering-kit | Where `upstream`-scoped lessons are proposed back (`improve-agents` step 9). |

## Gate commands

Run from the ticket worktree root. A blank gate is **skipped, and the hand-back says it
was skipped** — silence reads as a pass.

| Key | Command | Notes |
|---|---|---|
| `test_command` | `<e.g. npm test / pytest / go test ./...>` | The **full** suite — never just the touched file; transitive breakage is common. A skip set that varies by checkout (optional extras, gitignored data) is not a failure; print skip reasons. Wall-clock time is not a signal. |
| `lint_command` | `<e.g. eslint . / ruff check .>` | |
| `typecheck_command` | `<e.g. tsc --noEmit / mypy .>` | Confirm the changed files are actually in the checked program before citing a green. |
| `format_command` | `<e.g. prettier --write / ruff format>` | Must accept a **file list**. Run it on changed files only — repos carry standing formatter drift, and a repo-wide run sweeps unrelated files into the PR. |
| `build_command` | `<e.g. npm run build>` | |
| `dev_server_command` | `<optional>` | |

Stage-scoped or expensive project gates (a data pipeline, an integration environment) go
here too, each with the condition that makes it required.

## Blocking conditions

Each is a `blocker`-severity finding for the reviewer and a must-cover case for the
test-writer. State the condition, then why it fails **silently** — a condition that fails
loudly does not belong here. Replace the starters below with this project's own as they
are discovered.

1. **A new silent path where the code should raise.** A branch that returns a default,
   an empty result, or a zero where the input is invalid turns a crash into wrong output
   that nothing downstream detects.
2. **A warning or error suppressed rather than fixed.** Quieting a diagnostic removes the
   only signal that the condition occurred; it is a blocker unless the ticket's stated
   purpose is that suppression and it says why.
3. **A guard shaped "X must never reach Y" with no test that goes red when it is
   deleted.** A green suite is not evidence for a guard: the happy path passes whether the
   guard runs or not.

## Mutation shapes

What the coordinator, reviewer, and test-writer try when mutation-gating an invariant.
Mutate **each limb** of a multi-part guard separately and **each site** where the guard
is applied — a suite proving the arithmetic stays green if the branch that consults it is
deleted, and one construction site can die while another survives.

- **Delete** the guard, the `raise`, or the refusal.
- **Invert** a condition; flip a comparison (`<` ↔ `<=`, `>` ↔ `>=`); shift an index by one.
- **Relocate** a statement rather than deleting it — move it later, into a deferred or
  cleanup block, or after an `await`. Presence and position are different properties, and
  a deletion-only battery is blind to the second.
- **Widen** a match: exact → prefix, case-sensitive → case-insensitive, a list → a superset.
- **Reorder** keys or entries; add a leading separator; use a **synonym**.
- **Supersede by addition.** In formats with override, fallback, or precedence semantics
  — CSP directives, later-wins config merges, `.gitignore` negation, policy unions,
  first-match-wins routers — a **newly added** key can override the pinned one while every
  existing assertion stays green. Check the format's spec for an override family and for
  case-sensitivity before certifying a guard.

Project-specific shapes go below this line.

## Restoration rule

Stated as a hard constraint:

- Mutate in a **throwaway detached worktree** at the review SHA
  (`git worktree add --detach <tmp> <sha>`), never a live ticket worktree another agent may
  hold. Remove it when the sweep ends.
- Take a fresh scratch copy of the file immediately before each mutant write, and discard
  it after the restore — at most one copy exists at a time.
- Restore with `cp` from that copy. Never `git checkout --` (reverts to HEAD, silently
  destroying uncommitted work) and never `git stash` (the stash stack is repo-wide, not
  per-worktree, so an entry can be popped into another agent's checkout).
- Verify: clean `git status --porcelain`, then clear build and bytecode caches, then
  re-run the baseline. Byte-identical files are necessary, not sufficient — a stale cache
  can keep a mutant alive after its source is restored.
- A run reporting **zero tests**, or an unexpected all-green, is a broken harness until a
  positive control (a mutant known to fail) proves otherwise.
- Record results as raw counts (`5 failed | 1 passed`), never the word "verified".

## Project tool rules

Project-specific tool gotchas every agent must know at the point of action: a broken dev
path, a command that must never be run a certain way, a canonical data location that
differs from the obvious one, stack-specific test conventions. One bullet each, stated as
a rule with its trigger.

Two entries the agents look for by name, if the project has them:

- **Derived artifacts.** A tracked file a gate regenerates (a lock file, a build manifest,
  generated code): whether a ticket commits it or restores it, and how to restore it.
- **Batch-level deferral.** A standing agreement to defer one of the above across a batch
  of tickets. The coordinator states it in every dispatch and close-out, either way — or
  says none is defined.

- *(none yet)*
