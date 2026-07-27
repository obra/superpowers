# Jira-ticket start and PR-first finish — design

- **Date:** 2026-07-27
- **Status:** approved (Tom, 2026-07-27)
- **Problem owner:** `skills/finishing-a-development-branch/`, new `skills/starting-from-a-jira-ticket/`
- **Branch:** `feat/pr-first-finish-and-jira-start`

## Problem

Two gaps at opposite ends of the development loop.

**At the end.** `finishing-a-development-branch` presents a three-option menu
(merge locally / push + PR / keep as-is) and blocks until the human picks. In
this environment the answer is always "open a PR" — every piece of work is
integrated through review, never by a local merge. The block buys nothing and
costs a round trip on every completed branch.

**At the start.** Work begins from a Jira ticket, but nothing connects the
ticket to the branch. The agent has to be told the ticket contents by hand, the
branch gets named ad hoc, and the base branch is whatever happened to be checked
out — frequently a stale local `main`, which surfaces as phantom conflicts at PR
time. Nothing carries the ticket key forward, so the eventual PR does not link
back to the ticket.

The two ends are related: a ticket key captured at branch-creation time is what
lets the finish skill build a PR that links to the ticket, with no state stored
anywhere but the branch name.

## Design

Two self-contained skills. PR-body assembly lives inside the finishing skill
rather than in a shared third skill — there is exactly one caller today.

### 1. `finishing-a-development-branch` — PR is the default action

The three-option menu stays, reordered so the PR is first and marked as the
action being taken:

```
Implementation complete.

1. Push and create a Pull Request  ← doing this now
2. Merge back to <base-branch> locally
3. Keep the branch as-is

Proceeding with the PR. Say so now if you want 2 or 3 instead.
```

The skill then **acts immediately** — it does not wait for a reply. Push and PR
creation are additive and reversible: close the PR, delete the remote branch.
Merging into a base branch and discarding work are not reversible, so those
still happen only when the human asks for them by name. The menu is printed so
the human can redirect, not to gate the action.

Detached HEAD keeps its reduced two-option menu and the same act-not-wait rule,
pushing `HEAD:refs/heads/<branch>`.

**Preconditions are unchanged and still block.** Acting without asking applies
to the integration *choice*, not to the *gates*:

- Step 1: full test suite must be green. Failures stop everything.
- Step 3: base branch must be known or confirmed with the human.

#### PR assembly

1. **Ticket key.** Match `[A-Z][A-Z0-9]+-[0-9]+` against the branch name. No
   match — fall back to the ticket key in session context. Neither — skip the
   ticket link and continue; a missing link never blocks the PR.
2. **Title.** `<KEY>: <summary>` when a key was found. Otherwise a
   conventional-commit style title derived from the branch name and commits.
3. **Body.** Use `.github/PULL_REQUEST_TEMPLATE.md` when the repo has one, and
   fill every section with real content. With no template, use `## Summary`,
   `## Changes`, `## Testing`.
4. **Sources.** `git log <base-branch>..HEAD` for the change narrative, plus the
   `docs/superpowers/specs/*-design.md` written for this work if one exists. Add
   a ticket link line when a key was found.
5. **Ready, not draft.**

Created with the forge's CLI when available (`gh pr create`), otherwise via the
creation URL the remote prints on push. Report the URL.

Cleanup is unchanged: the PR path preserves the worktree, because PR feedback is
addressed there.

#### New rationalization rows

| Excuse | Reality |
|--------|---------|
| "They'll probably want a local merge this time" | PR is the default. Merge-local happens only when your human partner asks for it. |
| "No PR template section applies here, I'll write N/A" | Fill it, or state in one sentence why it does not apply. Placeholders are why PRs get closed. |
| "Tests are failing but the PR is just for review" | A red suite blocks the PR exactly as it blocks a merge. |

### 2. New skill `starting-from-a-jira-ticket`

**Frontmatter description:** *Use when starting work from a Jira ticket —
fetches the ticket, branches from the fetched default branch, and routes into
the right process skill.*

**Step 1 — Ticket key.** Take it from the human's message; ask if absent.
Validate against `[A-Z][A-Z0-9]+-[0-9]+`.

**Step 2 — Fetch the ticket.** Probe for a Jira/Atlassian MCP tool. When one is
present, fetch summary, description, issue type, status, and acceptance
criteria. When none is present, say so once and ask the human to paste the
ticket body. Never invent ticket contents — a guessed summary corrupts both the
branch name and the design that follows from it.

**Step 3 — Preflight.** `git status --porcelain` must be empty. If it is not,
report the dirty files, stop, and ask the human to commit or stash. Never
auto-stash. If a branch for this ticket already exists locally, stop and offer to
check it out instead of creating a second one.

**Step 4 — Default branch, freshly fetched.**

```bash
git fetch origin
DEFAULT=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD | sed 's|^origin/||')
DEFAULT=${DEFAULT:-$(git remote show origin | sed -n 's/.*HEAD branch: //p')}
```

If `origin/dev` exists and the repo's `CLAUDE.md`/`AGENTS.md` says work lands on
an integration branch rather than the default, ask which base to use before
branching.

**Step 5 — Create the branch.**

```bash
git checkout -b <type>/<KEY>-<slug> "origin/$DEFAULT"
```

Work happens in the current checkout. No worktree is created; the finishing
skill's worktree handling is unaffected because there is nothing under
`.worktrees/` to clean up.

| Jira issue type | Branch prefix |
|-----------------|---------------|
| Bug | `fix` |
| Story, Task, Improvement | `feat` |
| anything else | `chore` |

Slug: the first three to four meaningful words of the summary, lowercased,
hyphenated, stopwords dropped. `ABC-123 "Add retry to webhook sender"` becomes
`feat/ABC-123-add-retry-webhook`. The key stays uppercase and intact so the
finishing skill's regex recovers it.

**Step 6 — Route by issue type.** Announce the branch, then invoke:

- **Bug** → `superpowers:systematic-debugging`
- **everything else** → `superpowers:brainstorming`

Ticket summary, description, and acceptance criteria are passed to the next
skill as pre-loaded context, so it starts from what the ticket already states
instead of re-asking. State the route out loud so the human can redirect in one
word.

#### Rationalizations

| Excuse | Reality |
|--------|---------|
| "The ticket key tells me enough, skip the fetch" | A guessed summary is wrong twice — in the branch name and in the design built on it. |
| "The working tree is only a little dirty" | Branch from a clean tree or stop. Carrying unrelated changes onto a ticket branch contaminates the PR. |
| "Local main is probably current" | Always `git fetch` first. A stale base produces conflicts that look like real ones at PR time. |
| "No Jira MCP, I'll work from the key alone" | Ask for a paste. Working blind is how the wrong thing gets built. |

## Data flow

```
Jira ticket ABC-123
  ↓ starting-from-a-jira-ticket
branch feat/ABC-123-add-retry-webhook   (ticket key encoded in the name)
  ↓ systematic-debugging | brainstorming → writing-plans → implementation
  ↓ finishing-a-development-branch
PR titled "ABC-123: ..." linking the ticket
```

The branch name is the only carrier of ticket identity between the two skills.
No file, no session state.

## Supporting changes

**README.** Reword the workflow step for `finishing-a-development-branch` to
describe the PR default. Add `starting-from-a-jira-ticket` to the Workflow skill
list and as a step 0 in the numbered workflow, since it now precedes
brainstorming.

**Cross-references.** `executing-plans` and `subagent-driven-development` refer
to `finishing-a-development-branch` by name. `executing-plans` stays correct
and needs no edit. `subagent-driven-development`'s residual-findings handoff
said load-bearing findings "surface to your human partner when
finishing-a-development-branch presents the options" — that described a
blocking menu that no longer blocks, so it needed updating to say those
findings are carried into the PR description instead.

**Tests.** Two shell tests in `tests/claude-code/`, matching the existing
content-assertion style of `test-worktree-path-policy.sh`:

- `test-jira-start-skill.sh` — SKILL.md exists; frontmatter has `name` and
  `description`; content contains the clean-tree gate, the `git fetch origin`
  before branching, and both routing targets.
- `test-finish-pr-default.sh` — the finishing SKILL.md still lists all three
  options, marks the PR option as the action taken, and retains the
  explicit-request-only wording for discard.

These are structure tests, not behaviour evals. Behaviour is verified by a live
session: invoke `starting-from-a-jira-ticket` with a ticket key and no Jira MCP
present, and confirm it asks for a paste rather than inventing a summary.

## Out of scope

- No `evals/` drill scenarios — that repo is not cloned in this checkout.
- No version bump; `.version-bump.json` is release tooling, handled at release
  time.
- No shared `creating-pull-requests` skill. PR assembly has one caller; extract
  it if a second one appears.
- No changes to `.github/PULL_REQUEST_TEMPLATE.md`.
- No worktree support in the Jira start skill. `using-git-worktrees` remains
  available to invoke separately.
