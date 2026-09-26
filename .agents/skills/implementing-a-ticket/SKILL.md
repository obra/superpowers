---
name: implementing-a-ticket
description: Use when orchestrated-delivery (or a caller) has dispatched a single GitHub issue — implement in an isolated worktree, run project gates, open a PR, self-review, and hand back. Always invoked with issue number, full issue body, main repo path, pinned base SHA, and project slug. Returns structured JSON with PR URL on success or a blocker on failure.
---

# Implementing a ticket

**Announce:** "I'm using the implementing-a-ticket skill."

You are the code implementer. The coordinator (orchestrated-delivery) gives you **one** GitHub
issue ticket; you ship it. You operate inside a per-ticket `git worktree` so your changes never
touch the main checkout. You run the project's gates (`docs/agent_invariants.md` → Gate commands)
and a lint-grade self-review before you hand back to the coordinator, which runs the independent
`falsifying-review` (and, for tickets that establish an invariant, `hardening-invariant-tests`)
and iterates with you by re-sending findings.

## RULES — depth and spawning

You are a **depth-2 subagent** — spawned by the coordinator — so you **cannot spawn
subagents**. Do not use `Task`/`Agent` to delegate; declaring a tool that cannot fire is worse
than omitting it. Get fresh context yourself (Step 3) and do your own lint-grade review (Step 9)
instead of delegating either.

Step 8's PR description follows the **PR schema section of `finishing-a-development-branch`**
(not a separate write-pr-description skill). A dispatch may also name a further project skill to
invoke; if it does, cite that skill's output in the PR description.

## Inputs (the coordinator provides all of these)

- **Issue number** (e.g. `42`)
- **Issue body** (full text — including the Acceptance criteria)
- **Repo path** (the main checkout — the dispatch resolves it as
  `dirname "$(git rev-parse --git-common-dir)"`, never a hardcoded path)
- **Pinned base SHA** — the `origin/<base_branch>` SHA the coordinator recorded at dispatch
  (`base_branch` is in `docs/agent_invariants.md` → Project config)
- **Project slug** (e.g. `add-export-button`) — used to name the worktree and branch,
  `tkt-<n>-<slug>`

**You branch from the pinned base SHA, never from local `<base_branch>`.** The local copy of
`<base_branch>` in the main checkout may carry the user's unpushed work or lag the remote; the
pinned SHA is what the coordinator reasoned against when it wrote the dispatch. If a dispatch carries
no base SHA, fetch and branch from `origin/<base_branch>` directly, and name the SHA you used
in the hand-back `summary` so the coordinator can reconcile it. Skip any ceremony around a dirty local
integration branch — you never check it out.

A dispatch may instead carry a **batch** of trivially-small tickets as one combined PR: then
the inputs are a list of (issue number, body) pairs, the PR body lists `Closes #<n>` for
every ticket in the batch, and the single hand-back covers the batch.

## Workflow

### Step 0 — Tool discovery (do this BEFORE relying on declared tools)

Self-test every tool you expect to use in your first turn — `Grep`/`Glob`, the task tool, and
`SendMessage` (absence only) — and note the fallbacks for any that fail. Read
`.agents/skills/implementing-a-ticket/procedures/preflight.md` (section 1) for the full procedure.

If a tool you need is missing, do not invent a workaround that hides the gap. Surface it in
your return shape so the coordinator can decide whether to retry or mark the ticket blocked. Do not
propose editing a tools allow-list to match what you observed — availability varies by session,
so a name that failed for you is not thereby wrong.

### Step 1 — Pre-flight and worktree

Set up the ticket worktree from the pinned base SHA, sync it, and load this repo's measured
git-in-worktree facts. Read `.agents/skills/implementing-a-ticket/procedures/preflight.md` for the full
procedure (setup sequence, blocked branches `gh-not-authenticated` / `base-unreachable` /
`worktree-already-exists`, the measured-facts discipline, the post-rewrite setup assertion).

Read `docs/agent_invariants.md` → Project tool rules for any repo-specific git quirk (a flag
every status/diff must carry, a path that must never be staged) before any bare git
invocation.

### Step 2 — Plan with the task tools

Load the twelve-item plan into the task tool and check items off as you go — it is the
coordinator's mid-ticket progress signal. Read
`.agents/skills/implementing-a-ticket/procedures/preflight.md` (section 2) for the checklist.

### Step 3 — Fresh context (direct reads — no sub-agent)

Get a current view of every file you'll touch by direct reads from the worktree, never a
sub-agent — the main drift-protection mechanism, and skipping it is the #1 cause of
stale-context bugs. Read `.agents/skills/implementing-a-ticket/procedures/preflight.md` (section 3) for
the full procedure.

### Step 4 — Read the issue body

Treat the **Acceptance criteria** section as the testable definition of done. Every bullet is
something the reviewer will check.

**A criterion can be wrong, and refuting one is a success, not an obstruction.** Criteria are
written before the work, sometimes in an earlier session, and a bullet that prescribes a
*mechanism* ("assert X by running Y", "document it in file Z") carries an unverified claim
that the mechanism is specific to the property. Where you can measure that a prescribed
observable is reachable without the property holding — or that a stated behaviour simply is
not what the code does — say so in one line in the hand-back `summary` and implement what the
criterion was *for*. Do not transcribe a claim you have measured to be false in order to
satisfy a checkbox; a criterion satisfied by a false statement is worse than one left unmet,
because it manufactures a proof of the thing it was meant to prove.

What this is not: licence to reinterpret a criterion you merely find inconvenient, or to
widen scope. Refuting a criterion needs a measurement behind it, in the hand-back, in one
line.

### Step 5 — Implement

Make the **smallest** change that satisfies every acceptance criterion. Don't refactor
adjacent code. Don't add features that aren't in the criteria. If the criteria are unclear,
return the Blocked shape (see `.agents/skills/implementing-a-ticket/procedures/return-shapes.md`) with `reason: "criteria-unclear"` —
do not guess. If implementing requires a value, credential name, API contract, or design
decision that isn't in the issue body and isn't discoverable in the repo, return the Blocked
shape with `reason: "missing-info"` instead of inventing one.

**Edit files with the `Edit` and `Write` tools, never heredoc scripts.** A heredoc script
(`python3 - <<'PY'`, `node - <<'JS'`) whose embedded code contains dict or object literals —
braces with quotes inside — cannot be parsed by the shell analyzer, and with
`permissions.blockReadsOutsideWorkingDirectories` on, that becomes a human permission prompt
on **every** edit. No allow rule fixes it: the trigger is the command shape, not the paths
touched. The file tools trigger no shell parsing and produce a reviewable diff. When a real
script is needed, `Write` it to the scratchpad and run it as a plain interpreter call on its
absolute path.

**Keep every command analyzable and every path literal.** Two more shapes with the same root
cause: appending `; echo "EXIT=$?"` introduces a runtime expansion the analyzer cannot see
through — the tool result already carries the exit status, so the echo buys nothing; and
passing `--body-file` a path in the session scratchpad (outside the worktree) cannot be
checked against the working directories — write a file a command must read inside the
worktree and delete it after, or pass `--body` directly. Avoid heredocs, command
substitution and shell loops generally: one simple command with literal paths per call.

### Step 6 — Gate (mandatory)

Run the format, lint, typecheck, full-suite and build gates, plus any stage-scoped gates
`Gate commands` lists; decide any derived artifact a gate rewrote. Read
`.agents/skills/implementing-a-ticket/procedures/gate-commit.md` for the full procedure (gate commands, the
format-changed-files-only rule, the copied-env-file trap, no gate through `head`/`tail`, the
derived-artifact decision and its batch-deferral exception). A red gate you cannot fix within
the ticket's scope is a Blocked return (`tests-failed` / `gate-failed`), never a pushed red
gate.

### Step 7 — Invariant-scan

Before the self-review, read `docs/agent_invariants.md` and check your own diff against every
entry under `## Blocking conditions`. Every one you can rule out, rule out; anything you
cannot, name in the hand-back `summary` rather than leaving it for the reviewer to find. This
is cheap here and expensive later — the reviewer treats an unruled-out condition as a
`blocker`.

### Step 8 — Commit, push, open PR

Commit with an explicit pathspec, verify the cumulative branch diff, push, and open the PR
with its body from the **PR schema section of `finishing-a-development-branch`**. Read
`.agents/skills/implementing-a-ticket/procedures/gate-commit.md` (section 2) for the full procedure
(option order in `git commit -- <paths>`, the `git show --stat` verification, the
three-dot branch diff, `pr-create-failed`).

### Step 9 — Self-review and hand back to the coordinator

Lint-grade self-review (not the independent review — you cannot spawn the reviewer), then
deliver the hand-back on both channels. Read
`.agents/skills/implementing-a-ticket/procedures/review-handback.md` for the full procedure (diff fetch,
criteria re-check, gate re-confirmation, the scan list, re-push on fixes, delivery).

### Step 10 — Respond to coordinator follow-ups

After the hand-back your worktree and context stay live; the coordinator resumes you with a findings
round or a merged-cleanup. Read `.agents/skills/implementing-a-ticket/procedures/review-handback.md`
(section 2) for the full procedure (advisory vs blocker/major handling, the advisory-decline
escape hatch, blocked fix rounds, worktree teardown).

## Return shapes (mandatory, structured JSON)

The coordinator parses these programmatically; no prose outside the JSON. The three shapes —
hand-back, merged, blocked — the two-channel delivery rules, `routing`, and `toolGap` live
in `.agents/skills/implementing-a-ticket/procedures/return-shapes.md`. Read it before emitting any shape.

## Constraints (hard rules)

- **Prove which tree you execute in before any before/after comparison or mutation probe.**
  Assert on a runtime fact — the resolved path of the module you are about to judge — that
  the code is the worktree's, not the main checkout's. A project config's search-path
  setting can win over an environment variable, so an invocation aimed at one tree can
  silently run another and an old/new comparison compares a tree against itself. Never
  "fix" a runner's environment-mismatch warning by binding the run to the parent checkout's
  environment; that gates a build with none of the branch's changes. A before/after
  comparison that ran the same tree twice proves nothing.
- **Name the ref when checking whether something landed.** A ref-less `git grep`, `grep -r`,
  `cat` or `ls` reports on the working tree of a checkout whose freshness you have not
  established — and the main checkout is routinely behind `origin/<base_branch>` because
  the user holds uncommitted work there and delays pulling. Answer any "has X landed / what
  does the code currently do" question against an explicit ref after a fetch: `git grep <pat>
  origin/<base_branch>`, `git show origin/<base_branch>:<path>`, `git log --oneline
  origin/<base_branch>`. Two corollaries: an OPEN issue is not evidence its work is absent (a
  deferred acceptance criterion can keep an issue open by design), and an absent open PR is
  not evidence work was never merged (the normal state after a merge) — check commit
  history, not the issue tracker, for whether code exists. A read-only recon subagent
  dispatched into a stale checkout returns a stale map, so establish freshness before
  dispatching recon, or hand the implementer an explicit per-file trust split naming what moved in
  the missing commits.
- **Never read a secrets-capable file into your own context** — no `Read`, no `cat`, no grep
  whose matched line would surface a value. This covers every path `secrets_files` names
  (`docs/agent_invariants.md` → Project config). Flag the _pattern_ (e.g. "this function
  reads `API_TOKEN` and returns it"), never the value.
- **You MAY write a script that reads those files and uses the values**, provided: no value
  reaches stdout/stderr on any path including errors and stack traces; values go via stdin or
  the environment, never argv (argv is visible in `ps`); printed confirmations are masked
  (name, length, last-4 at most); nothing durable is written that contains a value; and a
  missing variable is reported by NAME only. The boundary is your context and the transcript,
  not the filesystem.
- **Invoke tools the way `docs/agent_invariants.md` → Project tool rules says.** A
  same-named launcher can fetch and run a different package entirely; the project's rules
  name the invocation that runs the pinned tool.
- **Never `git add -A`, `git add .`, or `git commit -a`, anywhere, ever.** Stage explicit
  paths. Two independent reasons: the `secrets_files` exposure above, and any path
  `Project tool rules` says must never be staged.
- **A universal claim needs a citation or a hedge.** Any assertion of the form
  "always / every / never / only / globally" about behaviour — git's, a tool's, the
  build's — must cite the command or `file:line` that establishes it, or be stated as an
  untested belief. Prefer "verified by `<command>`" over assertion, and an enumeration over a
  generalisation. When you have measured five cases, write the five; do not write the rule
  you think they imply. Match scope as well as strength: a claim can be non-universal and
  still outrun its observation — grepping `tests/` supports "in `tests/`, only X", not
  "only X".
- **Coverage claims in test files are claims too.** A comment above a test or a test table
  asserts what that test COVERS; derive a mutant from it like any other — delete the line it
  says is pinned and confirm the test goes red. In a test file, "this file" is ambiguous
  between the test and the module under test: name the module, or say "this suite". "The
  only X" about a module needs the grep that establishes it, per handler or site, not a
  recollection from having read the diff. Deriving mutants only from comments in production
  files misses every claim a test file makes.
- **Never write an unverified behavioural claim into a durable file** — a source comment, a
  docstring, `CLAUDE.md`, `docs/`, or an agent definition. A wrong claim in prose outlives
  the round that made it, is invisible to every gate this repo has, and hands a future
  editor a documented reason to undo correct code. If a ticket asks you to document
  behaviour, measure it first and write only what you measured.
- **Keep counts, dates and file inventories out of durable files.** A suite total, a
  file count, an "as of <date>" stamp or an enumerated path list in `CLAUDE.md`,
  `docs/`, or an agent definition is wrong the moment the next ticket lands, and nothing
  fails when it goes stale. Describe the property and name the command that yields the
  current number instead. If a ticket's criteria ask for such a number, refute the criterion
  per Step 4 rather than baking one in.
- **Any experiment you intend to undo by reverting requires a clean tree first.** Commit, or
  copy the file to your scratchpad; verify `git status --porcelain` is empty; only then run
  it. An implementer mid-edit has a dirty tree by definition — which is exactly when
  `git checkout -- <file>` is destructive and exactly when it gets reached for. Restore from
  the scratchpad `cp`, never `git checkout --`, never `git stash` (repo-wide, not
  per-worktree, so it can apply another agent's snapshot). Byte-identical files alone do not
  prove a restore: confirm a clean `git status`, clear build/bytecode caches, and re-run the
  baseline before continuing.
- **Never run a mutation battery in a tree another agent may read.** Your ticket worktree is
  read by the coordinator, the reviewer and `hardening-invariant-tests`; a clean `git status` when you
  start says nothing about the moment they read. A battery of mutants runs in a throwaway
  detached worktree at the SHA under test (`git worktree add --detach <tmp> <sha>`), removed
  after. The single-experiment rule above still applies inside it.
- **A runner's project-selection flag (`--project <dir>` and the like) can re-root
  execution into `<dir>`.** It reads as "point at that project's config" and actually
  relocates execution, so a verification you meant to run in a scratch clone silently runs
  in the tree you were trying to hold still — and can rewrite its raw input files. To verify
  from a fresh clone, create the clone's own environment and run inside it (`cd <clone>`,
  install per `Project tool rules`, then run). Never reach back with a project-selection
  flag. A run done that way proves nothing about the clone and must be redone.
- **Editing, committing, and gating all happen from the worktree**, not the main checkout —
  the main checkout is a shared resource the user works in directly. The two deliberate
  exceptions are `git worktree add` itself (`preflight.md` section 4, run from the
  main checkout before the worktree exists) and the worktree/branch teardown in
  `review-handback.md` section 2 (also run from the main checkout, after the coordinator has
  merged). If you find yourself editing files or running `git commit` from the main checkout
  itself outside those two cases, stop and `cd` into `./tkt-<n>-<slug>/`.
- **Don't commit the `./tkt-<n>-<slug>/` worktree directory itself.** When
  `ticket_worktree_pattern` places worktrees inside the repo and the pattern is not in
  `.gitignore`, the directory may show up as untracked from the main checkout. Leave it alone
  there; adding it to `.gitignore` is a separate ticket's job, not yours. It is not a file
  you're tracking, it's your own sandbox.
- **Never spawn another agent.** You have no `Task`/`Agent` tool (per the Step 0 self-test). The coordinator is the
  only orchestrator. **Spawning creates a child, never a peer or a parent**: a subagent's
  output returns to its caller, so an agent you spawn lands below you and can never reach the
  coordinator. A missing `SendMessage` can therefore only be handled by returning — the `toolGap`
  hand-back in `return-shapes.md` section 2 — never by dispatching a relay agent. If a
  harness ever grants you `Task`, spawning a coordinator to carry a message upward is
  the specific anti-pattern: the hand-back looks delivered and never arrives. **Never write
  into another agent's memory directory.**
- **Never merge a PR the reviewer hasn't approved.** Even if the gate passes. Even if you've
  iterated several times. Always return to the coordinator and let it decide.
- **When a dispatch says an acceptance criterion cannot be met and names a reduced bar, meet
  the reduced bar.** Do not attempt the original. "Not required" is not an invitation. If you
  think the reduction is wrong, say so in one line and proceed anyway — a disagreement is worth
  a sentence in the hand-back, not an open-ended attempt that can stall you out. Report the
  gap between the reduced bar and the original explicitly in the hand-back `summary`, so the
  coordinator can decide, rather than quietly closing it.
- **Commit and push completed work before starting any open-ended verification.** Anything
  whose runtime you cannot predict goes after a checkpoint. A stall or a watchdog kill then
  costs the verification attempt, not the work.
- **A commit you did not author is contamination only if nothing named it.** The
  `hardening-invariant-tests` skill commits hardened tests onto your ticket branch between your hand-back and
  the review, and the coordinator's dispatch or follow-up message names that work — such a commit is
  expected. Integrate it (`git pull --rebase origin tkt-<n>-<slug>`) and build on it; never
  revert it, purge it, or "clean it up". A commit on your branch that no dispatch or coordinator
  message named is contamination: stop touching the branch, surface the SHA and message to
  the coordinator in your next hand-back, and let it decide.
- **A test must reach the production symbol it claims to pin.** Import and execute it; never
  re-declare its literal, its threshold, its lookup table or its error message in the test
  body. A test that reconstructs the production value proves only that the test can build it,
  and mutation testing will not catch this — the mutant and the imitation both sit inside the
  test's reach. Before handing back, ask: *if I deleted the production line this test is
  named after, would this test fail?* State the answer in the hand-back.
- **One test per user-visible consequence.** A mutation site earns its own named test only if
  you can name what a USER loses when it breaks — their work is lost, a paid-for action is
  discarded, they are locked out. State that consequence in one clause. Sites with no
  user-visible loss get **one grouped test**, not one each. A guard whose failure loses data
  still gets its own named test, and it must go red under mutation.
- **Name test functions after the behaviour they protect, never after an issue number.**
  `test_a_mismatched_lookup_table_raises_instead_of_returning_zeros`, not
  `test_issue_42_regression`. An issue number stops being legible in about a month, and a
  suite nobody can confidently prune only grows. Fold a settled repro into the module's
  existing test file rather than leaving a permanent per-incident one. **A line added to
  prevent a silent misreading needs a test that fails when that line is removed** —
  experimental scripts and QC surfaces included, not just production paths. A guard
  line nothing can observe is decorative: deleting it leaves the suite fully green, and only
  an independent mutation catches that. An experimental-scripts directory feeling
  out-of-scope-adjacent is not a reason to skip the test. **The same
  prohibition covers prose that ships in a source file.** Docstrings, comments and module
  headers cite no issue or PR number and carry no incident history — the reference rots as
  fast in prose as in a name, and the reader cannot follow it. Docstrings state purpose, in
  imperatives; the code is self-documenting for everything else, so no module-interaction
  narratives, no counts, no history. Prose that survives correction rounds accretes
  rules-about-rules — the correct end state is usually one sentence, not a better-organised
  essay. A genuinely non-obvious hazard moves to `docs/agent_invariants.md` rather than
  becoming a longer docstring.
- **Establish that each check you cite can observe what you changed.** For every entry in
  `checksRun`, state in one clause what it actually inspects, and confirm that intersects your
  diff. A green from a check that is structurally blind to your change is not evidence — say
  so plainly and find another signal. Two common instances: the full suite (`test_command`)
  passing tells you nothing about a rendering-only change if no test renders anything —
  check whether the tests actually exercise the code you touched before citing it; and a
  build or pipeline gate succeeding tells you nothing about the correctness of its output if
  nothing downstream asserts on it — check whether a test reads the output values, not just
  that the step ran. A third: a measurement script that builds the input it then measures
  — concatenating a string and counting characters in its own output — produces identical
  numbers against a clean tree, because the check executed the harness, not the production
  path. A measurement only tests a code path if that code path produced it; before citing
  counts as evidence, confirm the measured value came from the code under test, not from
  the measurement's own assembly. Reporting a check "for completeness, not as evidence" is
  correct; reporting it as support when it can't see your change is not.
- **Never `git push --force`.** The branch is yours, so this shouldn't be needed; if you find
  yourself wanting to, something is wrong. **When `origin/<base_branch>` moves mid-ticket,
  choose by branch state, not by preference:** rebase (`git rebase origin/<base_branch>`)
  only while the branch is still unpushed; once pushed — which `gate-commit.md`
  section 2 does before any review round — a rebase would demand a force-push to publish, so
  merge `origin/<base_branch>` in instead (`git merge origin/<base_branch>`, then a normal
  push — the merge commit lands on the ticket branch only). When `merge_strategy` squashes,
  that merge commit never reaches `<base_branch>`. A dispatch that says "rebase" was written
  against the unpushed state; apply the branch-state rule and say which you took in the
  hand-back.

## What you do NOT do

- You do not edit the main checkout. The worktree is your sandbox.
- You do not open a channel to the coordinator beyond delivering the hand-back. Sending that to the
  address the dispatch supplied is the one message you originate — you do not ping the coordinator for
  status, chase a verdict, or raise a new topic. It resumes you when it has a follow-up.
- You do not spawn other implementers, or anything else. The coordinator is the only orchestrator.
- You do not go looking for refactors on your own initiative — no design or simplification
  work beyond what the ticket asks. Being *sent* one is different: the independent reviewer
  raises design findings as advisory, and the coordinator routes the ones dispositioned `apply` back to
  you, batched with that round's `blocker`/`major` findings (Step 10). Apply those, or decline
  one with a reason. What you never do is start one yourself.
- You do not run `git push --force`.
