# Jira-Ticket Start and PR-First Finish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `starting-from-a-jira-ticket` skill that turns a ticket key into a branch off the freshly-fetched default branch, and change `finishing-a-development-branch` so it opens a Pull Request by default instead of blocking on a menu.

**Architecture:** Both deliverables are Markdown skill files under `skills/<name>/SKILL.md` — skills are auto-discovered from that directory by every harness manifest (`.claude-plugin/plugin.json`, `.codex-plugin/plugin.json` both point at `./skills/` wholesale), so no manifest edits are needed. Verification is grep-level structure tests in `tests/claude-code/`, written in the existing `assert_contains`/`assert_not_contains` bash style of `test-worktree-path-policy.sh`. Ticket identity travels from the start skill to the finish skill through the branch name alone — no state file.

**Tech Stack:** Markdown (skill content), Bash (tests), `git`, `gh` CLI (PR creation), ShellCheck (lint).

## Global Constraints

- Skill files live at `skills/<skill-name>/SKILL.md` with YAML frontmatter containing exactly `name` and `description`.
- `name` in frontmatter MUST match the directory name.
- Zero third-party dependencies. The Jira skill probes for an MCP tool and degrades to asking the human — it never requires an install.
- Terminology: "your human partner", never "the user". This is deliberate project voice.
- New shell test files must pass `scripts/lint-shell.sh` (ShellCheck `--severity=warning` plus `bash -n`).
- New test files must be added to the `tests` array in `tests/claude-code/run-skill-tests.sh`.
- Commit after every task.

---

## File Structure

| Path | Action | Responsibility |
|------|--------|----------------|
| `skills/starting-from-a-jira-ticket/SKILL.md` | Create | Ticket fetch, preflight, branch creation, routing |
| `tests/claude-code/test-jira-start-skill.sh` | Create | Structure assertions for the new skill |
| `skills/finishing-a-development-branch/SKILL.md` | Modify (Steps 4–6, Quick Reference, Rationalizations) | PR-by-default behaviour and PR body assembly |
| `tests/claude-code/test-finish-pr-default.sh` | Create | Structure assertions for the PR-default change |
| `tests/claude-code/run-skill-tests.sh` | Modify (`tests` array, ~line 76) | Register both new tests |
| `README.md` | Modify (lines 204–240) | Document the new skill and changed finish behaviour |

---

### Task 1: `starting-from-a-jira-ticket` skill

**Files:**
- Create: `skills/starting-from-a-jira-ticket/SKILL.md`
- Create: `tests/claude-code/test-jira-start-skill.sh`
- Modify: `tests/claude-code/run-skill-tests.sh:76-80`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: the branch-naming contract `<type>/<KEY>-<slug>` where `<KEY>` matches `[A-Z][A-Z0-9]+-[0-9]+` and stays uppercase. Task 2's PR assembly depends on this exact shape to recover the ticket key.

- [ ] **Step 1: Write the failing test**

Create `tests/claude-code/test-jira-start-skill.sh`:

```bash
#!/usr/bin/env bash
# Structure check: the starting-from-a-jira-ticket skill must keep its
# preflight gates, fetch-before-branch ordering, and both routing targets.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

JIRA_SKILL="$REPO_ROOT/skills/starting-from-a-jira-ticket/SKILL.md"

failures=0

assert_file_exists() {
  local file="$1"
  local label="$2"

  if [ -f "$file" ]; then
    echo "  [PASS] $label"
  else
    echo "  [FAIL] $label"
    echo "    Expected file: $file"
    failures=$((failures + 1))
  fi
}

assert_contains() {
  local file="$1"
  local pattern="$2"
  local label="$3"

  if [ -f "$file" ] && grep -Fq "$pattern" "$file"; then
    echo "  [PASS] $label"
  else
    echo "  [FAIL] $label"
    echo "    Expected to find: $pattern"
    echo "    In file: $file"
    failures=$((failures + 1))
  fi
}

echo "=== Jira Start Skill Structure Test ==="
echo ""

assert_file_exists "$JIRA_SKILL" "starting-from-a-jira-ticket SKILL.md exists"

assert_contains "$JIRA_SKILL" "name: starting-from-a-jira-ticket" "frontmatter name matches directory"
assert_contains "$JIRA_SKILL" "description: Use when starting work from a Jira ticket" "frontmatter description states the trigger"

assert_contains "$JIRA_SKILL" 'git status --porcelain' "preflight checks for a clean working tree"
assert_contains "$JIRA_SKILL" "Never auto-stash" "skill refuses to stash on its own"

assert_contains "$JIRA_SKILL" "git fetch origin" "skill fetches before branching"
assert_contains "$JIRA_SKILL" "refs/remotes/origin/HEAD" "skill resolves the default branch from origin/HEAD"
assert_contains "$JIRA_SKILL" 'git checkout -b "$BRANCH" "origin/$DEFAULT"' "branch is created from the fetched default branch"

assert_contains "$JIRA_SKILL" "superpowers:systematic-debugging" "Bug tickets route to systematic-debugging"
assert_contains "$JIRA_SKILL" "superpowers:brainstorming" "non-Bug tickets route to brainstorming"

assert_contains "$JIRA_SKILL" "ask your human partner to paste" "skill degrades to a paste when no Jira MCP is present"

echo ""

if [ "$failures" -gt 0 ]; then
  echo "STATUS: FAILED ($failures failures)"
  exit 1
fi

echo "STATUS: PASSED"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/claude-code/test-jira-start-skill.sh`

Expected: FAIL — `STATUS: FAILED (11 failures)`, first line `[FAIL] starting-from-a-jira-ticket SKILL.md exists`.

- [ ] **Step 3: Write the skill**

Create `skills/starting-from-a-jira-ticket/SKILL.md`:

````markdown
---
name: starting-from-a-jira-ticket
description: Use when starting work from a Jira ticket - fetches the ticket, branches from the fetched default branch, and routes into the right process skill
---

# Starting From a Jira Ticket

## Overview

**Core principle:** Fetch the ticket → verify a clean tree → branch from a
freshly fetched default → route by issue type.

The branch name is the only thing carrying ticket identity forward. Get it
right here and `finishing-a-development-branch` builds a PR that links back to
the ticket with no extra bookkeeping.

**Announce at start:** "I'm using the starting-from-a-jira-ticket skill to set
up work on <KEY>."

## Step 1: Get the Ticket Key

Take the key from your human partner's message. If there isn't one, ask for it.

Valid keys match `[A-Z][A-Z0-9]+-[0-9]+` — `ABC-123`, `PLAT2-45`. If what you
have doesn't match, ask rather than guessing.

## Step 2: Fetch the Ticket

Check whether a Jira or Atlassian MCP tool is available in this session.

**If one is available:** fetch the issue and record its summary, description,
issue type, status, and acceptance criteria.

**If none is available:** say so once, then ask your human partner to paste the
ticket:

```
No Jira MCP tool in this session. Paste the ticket (summary, type,
description, acceptance criteria) and I'll work from that.
```

Never invent ticket contents. A guessed summary is wrong twice — it names the
branch and it seeds the design that follows.

## Step 3: Preflight

```bash
git status --porcelain
```

**Output is non-empty:** stop. Report the dirty files and ask your human
partner to commit or stash them. Never auto-stash — uncommitted work carried
onto a ticket branch contaminates the PR, and a stash you created is a stash
they don't know about.

**A branch for this ticket already exists:**

```bash
git branch --list "*<KEY>*"
```

If that prints anything, stop and offer to check the existing branch out
instead of creating a second one.

## Step 4: Determine the Base Branch

```bash
git fetch origin
DEFAULT=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD | sed 's|^origin/||')
DEFAULT=${DEFAULT:-$(git remote show origin | sed -n 's/.*HEAD branch: //p')}
```

Always fetch first. Branching from a stale local ref produces conflicts at PR
time that look real but aren't.

If `origin/dev` exists and the repo's `CLAUDE.md` or `AGENTS.md` says work
lands on an integration branch rather than the default, ask which base to use
before branching.

## Step 5: Create the Branch

Pick the prefix from the Jira issue type:

| Jira issue type | Branch prefix |
|-----------------|---------------|
| Bug | `fix` |
| Story, Task, Improvement | `feat` |
| anything else | `chore` |

Build the slug from the first three or four meaningful words of the summary:
lowercase, hyphen-separated, stopwords dropped. Keep the key uppercase and
intact.

`ABC-123 "Add retry to webhook sender"` (Story) becomes
`feat/ABC-123-add-retry-webhook`.

```bash
BRANCH="feat/ABC-123-add-retry-webhook"
git checkout -b "$BRANCH" "origin/$DEFAULT"
```

Work happens in the current checkout. This skill does not create a worktree —
invoke `superpowers:using-git-worktrees` separately if your human partner wants
one.

## Step 6: Route by Issue Type

Report the branch and the base it came from, then hand off:

| Jira issue type | Next skill |
|-----------------|------------|
| Bug | `superpowers:systematic-debugging` |
| everything else | `superpowers:brainstorming` |

Pass the ticket summary, description, and acceptance criteria into that skill as
pre-loaded context so it starts from what the ticket already says instead of
re-asking.

Say the route out loud so your human partner can redirect in one word:

```
Branch feat/ABC-123-add-retry-webhook created from origin/main.
Story ticket, so I'm starting brainstorming. Say "debug" if this is
really a bug hunt.
```

## Quick Reference

| Situation | Action |
|-----------|--------|
| No ticket key given | Ask for it |
| No Jira MCP | Ask for a paste, then continue |
| Dirty working tree | Stop, report, ask commit-or-stash |
| Branch for key already exists | Offer checkout, don't create a second |
| `origin/dev` plus repo docs naming it | Ask which base |
| Bug ticket | Route to systematic-debugging |
| Any other type | Route to brainstorming |

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "The ticket key tells me enough, skip the fetch" | A guessed summary is wrong twice — in the branch name and in the design built on it. |
| "The working tree is only a little dirty" | Branch from a clean tree or stop. Unrelated changes ride along into the PR. |
| "I'll stash it for them, it's reversible" | Never auto-stash. A stash your human partner didn't ask for is work they can't find. |
| "Local main is probably current" | Always `git fetch` first. Stale bases manufacture conflicts. |
| "No Jira MCP, I'll work from the key alone" | Ask for a paste. Working blind is how the wrong thing gets built. |
| "This ticket is obviously a bug, type says Task" | Route on the ticket's type. If it looks wrong, say so and let your human partner decide. |
| "I'll create the worktree too, it's tidier" | This skill branches in place. Worktrees are a separate, explicit choice. |
````

- [ ] **Step 4: Run test to verify it passes**

Run: `bash tests/claude-code/test-jira-start-skill.sh`

Expected: PASS — `STATUS: PASSED`, eleven `[PASS]` lines.

- [ ] **Step 5: Register the test in the runner**

In `tests/claude-code/run-skill-tests.sh`, change the `tests` array (line 76):

```bash
tests=(
    "test-worktree-path-policy.sh"
    "test-jira-start-skill.sh"
    "test-sdd-workspace.sh"
    "test-subagent-driven-development.sh"
)
```

- [ ] **Step 6: Lint the new shell file**

Run: `bash scripts/lint-shell.sh tests/claude-code/test-jira-start-skill.sh`

Expected: `Linting 1 shell files` and exit 0 with no ShellCheck output.

If ShellCheck is not installed, the script exits with `error: required tool 'shellcheck' is not on PATH` — that is a skipped check, not a pass. Report it and continue.

- [ ] **Step 7: Commit**

```bash
git add skills/starting-from-a-jira-ticket/SKILL.md tests/claude-code/test-jira-start-skill.sh tests/claude-code/run-skill-tests.sh
git commit -m "feat(skills): add starting-from-a-jira-ticket

Fetches the ticket via a Jira MCP tool when one is present, refuses to
branch over a dirty tree, branches from a freshly fetched default, and
routes Bug tickets to systematic-debugging and everything else to
brainstorming. Branch name encodes the ticket key so the finishing skill
can link the PR back to it."
```

---

### Task 2: PR-by-default in `finishing-a-development-branch`

**Files:**
- Modify: `skills/finishing-a-development-branch/SKILL.md:54-82` (Step 4), `:84-157` (Step 5), `:159-178` (Step 6), `:180-187` (Quick Reference), `:189-202` (Rationalizations)
- Create: `tests/claude-code/test-finish-pr-default.sh`
- Modify: `tests/claude-code/run-skill-tests.sh:76-81`

**Interfaces:**
- Consumes: the branch-name contract from Task 1 — ticket key matches `[A-Z][A-Z0-9]+-[0-9]+` within the branch name.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Write the failing test**

Create `tests/claude-code/test-finish-pr-default.sh`:

```bash
#!/usr/bin/env bash
# Structure check: finishing-a-development-branch opens a PR by default but
# still lists every option and still gates destructive paths behind an
# explicit request.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

FINISHING_SKILL="$REPO_ROOT/skills/finishing-a-development-branch/SKILL.md"

failures=0

assert_contains() {
  local file="$1"
  local pattern="$2"
  local label="$3"

  if grep -Fq "$pattern" "$file"; then
    echo "  [PASS] $label"
  else
    echo "  [FAIL] $label"
    echo "    Expected to find: $pattern"
    echo "    In file: $file"
    failures=$((failures + 1))
  fi
}

echo "=== Finish PR-Default Test ==="
echo ""

assert_contains "$FINISHING_SKILL" "1. Push and create a Pull Request" "PR is the first menu option"
assert_contains "$FINISHING_SKILL" "doing this now" "menu marks the PR as the action being taken"
assert_contains "$FINISHING_SKILL" "2. Merge back to <base-branch> locally" "merge-locally is still offered"
assert_contains "$FINISHING_SKILL" "3. Keep the branch as-is" "keep-as-is is still offered"
assert_contains "$FINISHING_SKILL" "do not wait for a reply" "skill acts without blocking"

assert_contains "$FINISHING_SKILL" "Type 'discard' to confirm." "discard still needs the exact typed confirmation"
assert_contains "$FINISHING_SKILL" "explicit request to throw the" "discard is still explicit-request-only"

assert_contains "$FINISHING_SKILL" '[A-Z][A-Z0-9]+-[0-9]+' "PR assembly recovers the ticket key from the branch name"
assert_contains "$FINISHING_SKILL" "PULL_REQUEST_TEMPLATE.md" "PR body honours the repo template"
assert_contains "$FINISHING_SKILL" "docs/superpowers/specs" "PR body draws on the design spec when one exists"
assert_contains "$FINISHING_SKILL" "not a draft" "PR is opened ready for review"

assert_contains "$FINISHING_SKILL" "A red test suite" "test gate still blocks the PR"

echo ""

if [ "$failures" -gt 0 ]; then
  echo "STATUS: FAILED ($failures failures)"
  exit 1
fi

echo "STATUS: PASSED"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash tests/claude-code/test-finish-pr-default.sh`

Expected: FAIL — `STATUS: FAILED (10 failures)`. Only `3. Keep the branch as-is`, `Type 'discard' to confirm.`, and `explicit request to throw the` pass against the current file.

- [ ] **Step 3: Replace Step 4 of the skill**

In `skills/finishing-a-development-branch/SKILL.md`, replace everything from the line `## Step 4: Present Options` through the line ending `is theirs.` (the paragraph above `## Step 5: Execute Choice`) with:

````markdown
## Step 4: Present Options and Proceed

**Normal repo and named-branch worktree — present exactly this menu:**

```
Implementation complete.

1. Push and create a Pull Request  <- doing this now
2. Merge back to <base-branch> locally
3. Keep the branch as-is

Proceeding with the PR. Say so now if you want 2 or 3 instead.
```

**Detached HEAD — present exactly this menu:**

```
Implementation complete. You're on a detached HEAD (externally managed workspace).

1. Push as new branch and create a Pull Request  <- doing this now
2. Keep as-is

Proceeding with the PR. Say so now if you want 2 instead.
```

Print the menu, then act on the PR immediately — **do not wait for a reply**.
Pushing a branch and opening a PR are additive and reversible: close the PR,
delete the remote branch, nothing is lost. Merging into a base branch and
discarding work are not reversible, so those run only when your human partner
asks for them by name. The menu exists so they can redirect, not to gate the
default.

Acting without waiting applies to the integration *choice*, not to the gates
in front of it. A red test suite (Step 1) or an unconfirmed base branch
(Step 3) still stops everything.
````

- [ ] **Step 4: Replace the PR section of Step 5**

Replace the `### Option 2: Push and Create PR` block (from that heading through the line `Keep the worktree — your human partner iterates on PR feedback there.`) with:

````markdown
### Push and Create PR (the default)

```bash
git push -u origin <feature-branch>
# From a detached HEAD, name the new branch on the remote:
# git push origin HEAD:refs/heads/<new-branch>
```

Assemble the PR before creating it:

1. **Ticket key.** Match `[A-Z][A-Z0-9]+-[0-9]+` against the branch name. No
   match — look for a ticket key in the session. Neither — skip the ticket
   link and carry on. A missing link never blocks the PR.
2. **Title.** `<KEY>: <summary>` when a key was found. Otherwise a
   conventional-commit style title built from the branch name and commits.
3. **Body.** Use `.github/PULL_REQUEST_TEMPLATE.md` when the repo has one and
   fill every section with real content. No template — use `## Summary`,
   `## Changes`, `## Testing`.
4. **Sources.** `git log <base-branch>..HEAD` for the change narrative, plus
   the `docs/superpowers/specs/*-design.md` written for this work if one
   exists. Add a ticket link line when a key was found.
5. **Ready for review, not a draft.**

Create it with the forge's CLI when one is available (`gh pr create --base
<base-branch> --title ... --body-file ...`), otherwise via the creation URL the
remote prints on push. Report the URL to your human partner.

Keep the worktree — your human partner iterates on PR feedback there.

### Merge Locally (on explicit request)
````

Then move the existing `### Option 1: Merge Locally` body (the `MAIN_ROOT`/`git checkout`/`git merge` block and the paragraphs through `git branch -d <feature-branch>`) underneath that new `### Merge Locally (on explicit request)` heading, deleting the old `### Option 1: Merge Locally` heading. Rename `### Option 3: Keep As-Is` to `### Keep As-Is (on explicit request)`.

- [ ] **Step 5: Fix the Step 6 cross-reference**

In `## Step 6: Cleanup Workspace`, replace:

```markdown
**Runs for Option 1 and confirmed discards.** Options 2 and 3 always
preserve the worktree.
```

with:

```markdown
**Runs for the merge-locally path and confirmed discards.** The PR and
keep-as-is paths always preserve the worktree.
```

- [ ] **Step 6: Update the Quick Reference table**

Replace the Quick Reference table body with:

```markdown
| Path | Merge | Push | Keep Worktree | Cleanup Branch |
|------|-------|------|---------------|----------------|
| Create PR (default) | - | yes | yes | - |
| Merge locally (on request) | yes | - | - | yes |
| Keep as-is (on request) | - | - | yes | - |
| Discard (explicit request only) | - | - | - | yes (force) |
```

- [ ] **Step 7: Add the new rationalization rows**

Append these rows to the `## Common Rationalizations` table, and delete the existing row `| "They obviously want it merged" | Integration is your human partner's decision. Present the menu and wait. |` — it now contradicts the default:

```markdown
| "They'll probably want a local merge this time" | PR is the default. Merge-local runs only when your human partner asks for it by name. |
| "No PR template section applies here, I'll write N/A" | Fill it, or say in one sentence why it does not apply. Placeholders are why PRs get closed. |
| "Tests are red but the PR is only for review" | A red test suite blocks the PR exactly as it blocks a merge. |
| "No ticket key on the branch, I'll stop and ask" | A missing ticket link never blocks the PR. Open it without the link. |
```

- [ ] **Step 8: Run both tests to verify they pass**

Run:
```bash
bash tests/claude-code/test-finish-pr-default.sh
bash tests/claude-code/test-worktree-path-policy.sh
```

Expected: both print `STATUS: PASSED`. The worktree-path test also asserts on this file — it must stay green, proving the cleanup-ownership wording survived the edit.

- [ ] **Step 9: Register the test and lint**

In `tests/claude-code/run-skill-tests.sh`, the `tests` array becomes:

```bash
tests=(
    "test-worktree-path-policy.sh"
    "test-jira-start-skill.sh"
    "test-finish-pr-default.sh"
    "test-sdd-workspace.sh"
    "test-subagent-driven-development.sh"
)
```

Run: `bash scripts/lint-shell.sh tests/claude-code/test-finish-pr-default.sh`

Expected: `Linting 1 shell files` and exit 0.

- [ ] **Step 10: Commit**

```bash
git add skills/finishing-a-development-branch/SKILL.md tests/claude-code/test-finish-pr-default.sh tests/claude-code/run-skill-tests.sh
git commit -m "feat(skills): open a PR by default when finishing a branch

The menu still lists merge-locally and keep-as-is, but the PR is marked
as the action being taken and runs without waiting -- pushing and opening
a PR is reversible, merging and discarding are not. Adds PR assembly:
ticket key recovered from the branch name, repo PR template honoured,
body built from the commit log and the design spec."
```

---

### Task 3: README documentation

**Files:**
- Modify: `README.md:204-216` (Basic Workflow), `README.md:231-240` (Skills Library)

**Interfaces:**
- Consumes: skill names from Tasks 1 and 2.
- Produces: nothing.

- [ ] **Step 1: Add the workflow step**

In `## The Basic Workflow`, insert a new step before the current step 1 and renumber the rest (existing 1–7 become 2–8):

```markdown
1. **starting-from-a-jira-ticket** - Activates when work starts from a ticket. Fetches the ticket, refuses to branch over a dirty tree, branches from the freshly fetched default branch, routes Bug tickets to systematic-debugging and everything else to brainstorming.
```

- [ ] **Step 2: Reword the finishing-a-development-branch step**

Replace the (now renumbered) finishing step with:

```markdown
8. **finishing-a-development-branch** - Activates when tasks complete. Verifies tests, then pushes and opens a Pull Request by default; merge-locally and discard happen only on explicit request.
```

- [ ] **Step 3: Update the Skills Library list**

In the **Collaboration** list, replace the `finishing-a-development-branch` line and add the new skill directly above `brainstorming`:

```markdown
**Collaboration** 
- **starting-from-a-jira-ticket** - Ticket to branch to the right process skill
- **brainstorming** - Socratic design refinement
```

```markdown
- **finishing-a-development-branch** - PR-by-default finish workflow
```

- [ ] **Step 4: Verify the numbering**

Run: `grep -n '^[0-9]\. \*\*' README.md`

Expected: eight consecutively numbered lines, `1.` through `8.`, starting with `starting-from-a-jira-ticket` and ending with `finishing-a-development-branch`. (The unscoped `grep -n '^[0-9]\.' README.md` also matches an unrelated pre-existing numbered list further down the file and returns 13 lines, not 8 — scope the pattern to `^[0-9]\. \*\*` to match only the bolded workflow-step lines.)

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs(readme): document starting-from-a-jira-ticket and the PR-first finish"
```

---

### Task 4: Full verification

**Files:** none modified.

**Interfaces:** none.

- [ ] **Step 1: Run every structure test**

Run:
```bash
bash tests/claude-code/test-jira-start-skill.sh
bash tests/claude-code/test-finish-pr-default.sh
bash tests/claude-code/test-worktree-path-policy.sh
bash tests/claude-code/test-sdd-workspace.sh
```

Expected: four `STATUS: PASSED` lines.

- [ ] **Step 2: Lint every changed shell file**

Run: `bash scripts/lint-shell.sh`

Expected: exit 0. (ShellCheck missing from PATH is a skipped check, not a pass — report it.)

- [ ] **Step 3: Confirm skill discovery**

Run: `ls skills/starting-from-a-jira-ticket/SKILL.md && head -4 skills/starting-from-a-jira-ticket/SKILL.md`

Expected: the path prints, and the frontmatter shows `name: starting-from-a-jira-ticket` matching the directory. Both plugin manifests point at `./skills/` wholesale, so nothing else registers the skill.

- [ ] **Step 4: Live behaviour check**

This is the check the structure tests can't make. In a fresh session with the plugin loaded, and with no Jira MCP connected, say:

```
Start work on ABC-123
```

Expected: the skill announces itself, and asks for the ticket to be pasted rather than inventing a summary. Report what actually happened, verbatim, including any deviation.

- [ ] **Step 5: Report and hand off**

Summarise: tests run and their results, the live-check transcript, anything skipped. Then invoke `superpowers:finishing-a-development-branch` — which, on its new default, opens the PR for this work.

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|------------------|------|
| Menu keeps 3 options, PR first and marked | Task 2, Step 3 |
| Act immediately, no wait | Task 2, Step 3 |
| Detached-HEAD menu, same rule | Task 2, Step 3 |
| Test gate and base-branch gate still block | Task 2, Steps 3 and 7 |
| Ticket key regex recovery with silent skip | Task 2, Steps 4 and 7 |
| Title, template, sources, ready-not-draft | Task 2, Step 4 |
| Worktree preserved on the PR path | Task 2, Steps 4 and 5 |
| New rationalization rows | Task 2, Step 7 |
| Jira skill: key validation | Task 1, Step 3 |
| Jira skill: MCP probe with paste fallback | Task 1, Step 3 |
| Jira skill: clean-tree gate, no auto-stash, existing-branch check | Task 1, Step 3 |
| Jira skill: fetch, `origin/HEAD` resolution, `dev` question | Task 1, Step 3 |
| Jira skill: prefix table, slug rules, branch in place | Task 1, Step 3 |
| Jira skill: route by issue type with pre-loaded context | Task 1, Step 3 |
| README workflow and skills-list updates | Task 3 |
| Two structure tests in the existing style | Tasks 1 and 2 |
| Live no-MCP verification | Task 4, Step 4 |

No gaps.

**Placeholder scan:** No TBDs. Every code step carries its content. The one non-literal instruction is Task 2 Step 4's "move the existing Merge Locally body" — the text being moved is quoted by its anchor lines and already exists in the file verbatim, so nothing needs inventing.

**Type consistency:** `<type>/<KEY>-<slug>` and the `[A-Z][A-Z0-9]+-[0-9]+` key regex are written identically in Task 1 Step 3, Task 2 Step 4, and both tests. Shell variable names `DEFAULT` and `BRANCH` match between the skill body and the test's `assert_contains` string. Test filenames match between creation, the runner array, and Task 4.
