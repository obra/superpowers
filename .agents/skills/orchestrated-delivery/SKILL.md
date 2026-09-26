---
name: orchestrated-delivery
description: Use when a high-level goal should be broken into ordered GitHub tickets and shipped one at a time through implementer → (optional test hardener) → falsifying reviewer, with mutation gates and human merge consent. Not for a single well-defined PR-sized task (use implementing-a-ticket or subagent-driven-development).
---

# Orchestrated delivery

**Announce:** "I'm using the orchestrated-delivery skill."

You are a coordinator for this repository. You take a high-level goal from the user,
decompose it into PR-sized tickets, persist them as GitHub Issues, and dispatch each ticket to
an agent that loads the `implementing-a-ticket` skill, hardening tests with
`hardening-invariant-tests` and reviewing with `falsifying-review` as siblings. GitHub Issues
are the source of truth — your only state is what `gh` can read.

Project facts — the base branch, merge strategy, secrets files, worktree pattern, commit
convention and every gate command — live in `docs/agent_invariants.md`. Read them there at run
time; never assume them.

## When to use

- The user gives a high-level goal (not a single PR-sized task).
- The work spans multiple files / modules / sessions.
- The user wants durable tracking (so they can check progress on GitHub).
- The user wants to resume work across sessions.

## When NOT to use

- The user has a single, well-defined, single-PR task. Just dispatch an agent that loads
  `implementing-a-ticket` directly.
- The user wants to _review_ code, not _create_ code. Use `falsifying-review`.
- The user wants to _plan_ but not execute. Stay in the plan-mode conversation; do not enter
  this skill.

## Pre-flight (always run first)

The coordinator never branches and never mutates the checkout it runs from — it only reads, dispatches,
and runs `gh`/`git` commands that inspect state. Run directly from the main checkout — resolve
it portably, never hardcoded — or, when `docs/agent_invariants.md` → Project config sets
`coordinator_worktree`, from that worktree instead. Do not add a coordinator worktree the config does
not name.

```sh
cd "$(dirname "$(git rev-parse --git-common-dir)")"   # or the configured coordinator_worktree
gh auth status
gh repo view --json nameWithOwner --jq .nameWithOwner    # confirm this is the repo you were asked to work in
git fetch origin --prune
git worktree prune --expire=24h
git rev-parse "origin/<base_branch>"                     # the dispatch base pin (step 3)
```

1. **Check `gh` is installed and authenticated.** Run `gh auth status`. If it fails, **stop and
   tell the user** to run `gh auth login` (or set `GH_TOKEN`). Do not invent a way around auth.
   Do not create issues with curl.
2. **Read the repo.** Confirm `gh repo view` reports the repository the user named (or the one
   the orchestrating thread relayed from the user).
3. **The base is `origin/<base_branch>`, always** (`base_branch`, see `docs/agent_invariants.md`
   → Project config) — never the local copy, which may carry the user's unpushed work. **Pin it
   at dispatch:** after the fetch, record `git rev-parse origin/<base_branch>` and pass both the
   ref and that SHA to the implementer. The pin is what the base-move attribution in
   `.agents/skills/orchestrated-delivery/procedures/dispatch-handback.md` (section 1) measures against; without it
   "the base moved while the ticket was in flight" is a claim nothing can check.
4. **The user's uncommitted edits in the main checkout are none of the coordinator's business.** Never
   gate on them, never stash, never `git checkout` anything there. The coordinator only reads state from
   the main checkout; it never mutates it. To prove the coordinator disturbed nothing, verify the
   **specific paths** it touched are unchanged — a whole-tree baseline false-alarms on the
   user's own concurrent work (a staging hook or an autostage setting can flip a file between
   ` M` and `M ` mid-run), and an agent taught to shrug those off will miss real drift. Where
   `docs/agent_invariants.md` → Project tool rules names a path that legitimately differs
   between a worktree and the main checkout (a symlink in one, a real directory in the other),
   that difference is correct and must not be "fixed".
5. **Orphan prune.** `git worktree prune --expire=24h` cleans up worktree dirs left over from a
   prior implementer crash/timeout older than 24 hours. Active `status:blocked` worktrees are NOT
   pruned — they belong to the user.

## Decomposition

Decompose the user's goal into PR-sized tickets — one per independently-shippable unit, never
padded to a count. **Invoke the `create-ticket` skill to file each one**; it owns the slug, the
duplicate check, the body schema and its criteria-writing rules, `project:<slug>` label creation
and the severity choice. What stays here is the judgment that is yours alone: how many tickets
the work genuinely needs, and how they are dispatched.

The user gives a goal in free text. Your first job is to decide how many tickets the work
genuinely requires. **A simple task is one ticket; a multi-step goal may be several.** Do not
impose a minimum — only subdivide when there are genuinely separable, independently-shippable
units, and never pad to hit a count. The body schema is the same shape whether there is one
ticket or many, so a single small ticket is not wasteful — it is the right size for a small
task.

1. **Decide whether to subdivide at all.** Ask first: is this a single PR-sized task? If yes,
   create one ticket and stop — do not invent substeps to reach a count. Only if the work has
   genuinely separable, independently-shippable units should you break it into multiple
   tickets. When you do subdivide, ask: what are the _sequentially necessary_ steps, and what
   are the _parallelizable_ subtasks within each step? Don't pad.
2. **Create each ticket** with the `create-ticket` skill — slug, duplicate check, body schema,
   criteria rules, label creation, severity. Use one slug for the whole goal, so every ticket
   in it shares a `project:<slug>` label.
3. **Report the decomposition** to the user as a numbered list with issue numbers, then start
   the delegation loop.

**Batch trivially small tickets at dispatch, not just avoid padding at creation.** The
guard above prevents inflating one task into many tickets; the opposite failure is running
many pre-existing tiny tickets through one full cycle each — a worktree, environment sync,
PR, review, verdict record and close-out apiece. Judge by process-cost-to-diff ratio: a
ticket too small to carry its own ceremony rides in a batch. At dispatch time, group
`status:ready` tickets whose expected diff is trivially small (comment-level edits,
single-line config tweaks, typo fixes) into one combined PR — a single `implementing-a-ticket`
run over multiple ticket bodies, one PR whose body lists `Closes #a, Closes #b` for each, one
review and one verdict record covering the batch. `# Depends on` and file-disjointness
still govern: batch only tickets with no deps, and treat shared files within the batch as
one lane.

## Ticket lifecycle (labels are the state machine)

| Label                 | Meaning                                          |
| ---------------------- | ------------------------------------------------ |
| `project:<slug>`      | This issue is part of the project.               |
| `status:ready`        | Created, not started.                            |
| `status:in-progress`  | Implementer has been dispatched.                      |
| `status:blocked`      | Implementer reported blocked. A comment explains why. |
| `status:held`         | Intentionally paused pending a user decision.    |
| `status:done`         | PR merged or change accepted. Issue is closed.   |

`status:held` is **not** `status:blocked`. Blocked means something went wrong and the ticket
needs unblocking; held means the work is fine and the user has deliberately paused it —
typically a multi-criterion ticket where some criteria shipped and the rest await a go-ahead.
**Never dispatch a `status:held` ticket**, and never treat one as a problem to resolve. Do not
use `status:ready` for this: ready means "dispatch me", which is the opposite instruction. When
you set `status:held`, comment saying what is held and what decision releases it.

**State transitions:**

- `ready` → `in-progress`: when the implementer is spawned.
- `in-progress` → `done`: when the implementer returns success. Issue is closed.
- `in-progress` → `blocked`: when the implementer returns blocked. Issue is **left open** so the
  user can investigate.
- `blocked` → `ready`: when the user unblocks it (manual; you do not auto-reopen).

**Never** move a ticket from `done` back to anything else without an explicit user instruction
(regression re-open is out of scope for now).

## Delegation loop (one ticket at a time, with dep-check)

1. **Already done in pre-flight** (`git worktree prune --expire=24h`).
2. **List `status:ready` issues** under the project's label:
   `gh issue list --label "project:<slug>,status:ready" --state open --json number,title,body --jq 'sort_by(.number)'`.
3. **Dep-check** each candidate in order. For each, scan the body for a `# Depends on` section.
   If present, list the referenced issue numbers. Verify every listed issue is `status:done`
   (i.e. its closed PR has been merged) — you can check with
   `gh issue view <n> --json state,labels`.
4. **Pick the lowest-numbered candidate whose deps are all satisfied.** If no candidate is
   dep-ready, **stop and surface** to the user: print which tickets are blocked and why (e.g.
   "Ticket A depends on ticket B which is `status:blocked`; ticket C depends on ticket D which
   is `status:in-progress`"). Then exit the loop. Never auto-skip silently.
4a. **Confirm the criteria with the user before dispatching a ticket you did not write in this
   session.** A ticket authored in an earlier session, or by an earlier coordinator instance, encodes
   what someone believed the user wanted at the time — and the user has not seen those
   bullets since. Print the acceptance criteria and ask, in one line, whether they still
   describe the intended work. Do this **once per ticket, before the dispatch**, not after.

   No other step measures against the user's intent — every agent downstream measures against
   the criteria instead. This is the only check that catches a ticket whose criteria are
   internally consistent and unwanted.

   Skip the confirmation only for a ticket you decomposed from the user's own instruction in
   this session, and dispatch immediately when the user has already said to run the whole
   project without further check-ins.

   **When acceptance criteria gate on what a file CONTAINS, not just what it is named,
   measure that content yourself before dispatching.** A one-line masked scan — field names
   and shape flags only, never values — confirms or refutes the premise the criteria are
   built on; put the measured counts in the dispatch comment. A data-content premise left
   unmeasured is discovered by the implementer instead, at the cost of a full dispatch.

5. **Mark in-progress.** `gh issue edit <n> --remove-label "status:ready" --add-label "status:in-progress"`.
6. **Comment on the issue**: `gh issue comment <n> --body "coordinator dispatching implementing-a-ticket. Acceptance criteria: [paste list]."`
7. **Spawn a fresh subagent / named agent that loads `implementing-a-ticket`** — dispatch with issue, base ref and its pinned SHA, tier, and any batch-deferral state the project defines. Read `.agents/skills/orchestrated-delivery/procedures/dispatch-handback.md` for the full procedure (dispatch fields, full/light tier classification, base-move attribution, live-children roster, 8a test hardening).
8. **Wait for the implementer to hand back** — do not poll; it arrives on either or both of two channels (the implementer's `SendMessage`, and its returned result, which it emits every time), and both arriving is expected rather than a duplicate to report; return a live-children roster if your turn ends with children live. Read `.agents/skills/orchestrated-delivery/procedures/dispatch-handback.md` for the full procedure.
8a. **Harden tests before review when the ticket establishes an invariant** — spawn an agent that loads `hardening-invariant-tests` as a sibling before the reviewer. Read `.agents/skills/orchestrated-delivery/procedures/dispatch-handback.md` for the full procedure.

9. **Run the independent review** — spawn an agent that loads `falsifying-review` as a sibling, loop up to 3 rounds. Read `.agents/skills/orchestrated-delivery/procedures/review-gate.md` for the full procedure (verifier checks, verdict handling, advisory routing, round count).
10. **On `approve` — record the verdict, merge, clean up, close.** Run the gates (`test_command`, `lint_command`, `typecheck_command`, and any stage-scoped gates `docs/agent_invariants.md` → Gate commands lists) and mutation-gate the invariant yourself before merging. Read `.agents/skills/orchestrated-delivery/procedures/review-gate.md` for the full procedure (sub-steps 1–5: gates, mutation gate, verdict comment).

    5. **Post the verdict comment, merge, clean up, close** — the verdict comment's composition, the
    merge with its message composed per `commit_convention` and verified branch delete, the implementer cleanup,
    the advisory confirmation, the close-out with its batch-deferral statement, and the loop-back.
    Read `.agents/skills/orchestrated-delivery/procedures/review-gate.md` (sections 2 and 3) for the full procedure.

11. **On blocked / review-loop-exhausted.** Add `status:blocked`, remove `status:in-progress`:
    `gh issue edit <n> --remove-label "status:in-progress" --add-label "status:blocked"`.
    Comment the reason — the implementer's blocker (`reason` / `missingInfo` / `suggestedNextStep` /
    `worktreePath`), or `review-loop-exhausted` with the last reviewer feedback and the
    PR/worktree paths. **Stop and surface to the user.** Do not pick the next ticket.

## Your turn ends when you return

Returning is not a checkpoint — it is the end of your turn, and nothing but an inbound message
restarts it. There is no scheduler, no timer, and no implementer hand-back that re-invokes a coordinator
which has already returned. A coordinator that shows as `completed` while one of its PRs is open and
unmerged is a **stall**, not a wait.

**Never return while the next action is your own.** A merge-ready PR, a green review, an implementer
hand-back, and a finished ticket are all mid-loop. Reporting progress is fine — ending on the
report is not. If you want the user to see where things stand, print the status line and then
take the next concrete step **in the same turn**: merge the approved PR, dispatch the next
ticket, spawn the reviewer.

**Returning with live children is permitted only as a roster hand-back naming them** — for
each live implementer, test-writer or reviewer: the agent, its purpose, the round it is answering,
and the PR/issue (`.agents/skills/orchestrated-delivery/procedures/dispatch-handback.md`, section 2). A return
that leaves children live without naming them strands their hand-backs with nobody able to
route them. Otherwise return only when the queue has no dep-ready ticket left, or a decision
genuinely belongs to the user (step 11).

## User-directed scope changes

The user may cut or redirect a ticket's scope at any point, including after the reviewer has
approved the PR. This is normal and it is not a regression, a defect, or something to argue
back. Handle it the same way every time:

- **The user's instruction supersedes the acceptance criteria** where they conflict. A
  criterion the user withdraws is withdrawn — do not have the reviewer fail the PR for it.
- **Give the change a fresh round budget.** The three rounds at `.agents/skills/orchestrated-delivery/procedures/review-gate.md` §1d are spent settling one
  diff; a user-directed change produces a different diff, and charging it against rounds
  consumed by the previous one blocks a ticket the user has just simplified. Record the reset
  in the round comment on the PR (review-gate.md §1d), so a resumed PR inherits it.
- **Amend the issue body** so the withdrawn work is recorded under `# Out of scope` with the
  date and the reason. Otherwise it reads as an unfinished gap and someone re-files it.
- **Re-review, re-run the gates in review-gate.md §2 (sub-steps 1–4), and re-post the verdict comment** naming the new
  SHA and what changed since the earlier approval. An approval names a SHA; once the SHA
  moves, so must the record.
- **Say plainly what the reduction gives up**, once, in the verdict comment — not as an
  argument, as a record. When removing a test leaves an invariant with no automated
  enforcement, that sentence is the most useful thing in the comment for whoever reads the
  PR later. State it and move on; the decision is the user's and it is already made.
- **If the reduction's stated reasoning rests on a factual claim you have measured to be
  false, say so once, in your own voice, and proceed anyway.** The user owns the tradeoff;
  they cannot own it accurately if the loop stays quiet about the measurement.

## When prose is the thing under review

A documented claim about behaviour is invisible to the lint and test gates, so every round
spent correcting one costs a full cycle and buys a sentence no gate can check. If the reviewer
reports that a corrected statement is still measurably false — the 8a condition in
`falsifying-review` — do not spend a third round on wording. Route it as `surface`:
tell the user the passage is trying to state something that is not true in general, and that
the options are an enumeration, a deletion in favour of the one place the fact already lives,
or dropping it. A sentence that has been wrong twice will be wrong a third time at a finer
resolution.

Watch the duplication case specifically. When a diff removes one of two copies of a measured
fact, confirm the surviving copy is the correct one before approving — deleting the corrected
copy and leaving the false one standing as the sole source is a strictly worse outcome than
the duplication was, and no gate in this repo can see it happen.

## Status reporting

- **After every transition**, print a one-line status to the user.
- **After every dispatch**, print: `→ #<n> <title> — dispatched. Acceptance: <N> criteria. Worktree: <path per ticket_worktree_pattern>.`
- **Recommend `gh issue list --label "project:<slug>"`** for the full ledger. The user can run
  this anytime.
- **Do not print raw JSON** to the user. The structured return is for the calling loop, not for
  human reading. Summarize.

## Memory

You have a persistent, file-based memory — the project's memory store, indexed by its
`MEMORY.md`, at the location the project's `CLAUDE.md` / `AGENTS.md` names. This is the same store the rest
of the project already uses. Use it for _non-obvious_ lessons only:

- "This repo's unscoped build gate dies on a fixture whose input is gitignored; always scope
  the gate, to the full target list in `docs/agent_invariants.md` → Gate commands." (Yes —
  save this kind of thing.)
- "Ticket N used worktree `tkt-N-add-retry-backoff`." (No — GitHub is the ledger; don't
  duplicate.)

Do **not** save: per-ticket state, code structure, file paths, or anything derivable from
`git log` / reading the code. The memory guidance in the project's `CLAUDE.md` / `AGENTS.md` is the canonical
rule.

## Constraints

- **Never `git add -A`, `git add .`, or `git commit -a`, and never stage on the user's
  behalf.** Stage explicit paths only, and never stage anything `secrets_files`
  (`docs/agent_invariants.md` → Project config) names.
- **A permission setting changed mid-session does not reach an already-spawned subagent.**
  It keeps the context it took at spawn, so a denial it reports can cite a rule that is no
  longer on disk. Expect stale denials until the agent finishes; route the fix to the next
  dispatch rather than killing a nearly-done implementer to clear them.
- **A probe that returns nothing is reporting on the probe, not the world, until its window
  is proven right.** A zero has no self-evidence the way a hit does — a hit shows its
  context, a zero shows only your own query. Before acting on a nothing: re-run with a
  fixed-string match (`grep -F`), widen the pattern, or prove the window by finding
  something you know is there. Regex metacharacters inside double-quoted shell strings (`$`
  as an end-of-line anchor mid-pattern) and separator mismatches (hyphen vs space) both
  produce confident zeros that read as missing records or absent dependencies. This is the
  same discipline as asserting a mutation actually applied, applied to absence instead of
  change.
- **Never read any file `secrets_files` names.** Even redacted greps are off-limits.
- **A tool flag that re-roots execution into another directory relocates execution rather
  than just pointing at config** (a package runner's `--project <dir>`-style option), so a
  gate you meant to run in one tree runs in another. Run gates by `cd`-ing into the worktree,
  never by reaching into it with such a flag. Project-specific tool gotchas are in
  `docs/agent_invariants.md` → Project tool rules.
- **Tickets must be ordered correctly.** Numbering matters because the dep-check is
  "lowest-numbered dep-ready ticket first." Number dependencies _higher_ than their prereqs.
- **Stop and surface on any of:**
  - No dep-ready ticket exists.
  - Implementer returns blocked.
  - Review-loop-exhausted.
  - `gh` returns a non-zero exit (auth, network, rate limit). Surface the exact `gh` error.
- **Do not** create issues without acceptance criteria. A ticket without checkable bullets is a
  ticket the implementer can't finish and the reviewer can't evaluate.
- **A denied tool call is a decision, not a transient error.** If the permission layer refuses
  an action, do **not** retry it verbatim. Fall back to the closest existing alternative, use
  it, and note the substitution in your report. Retrying a denial burns turns and then
  misreports as an unauthorized mutation. (Distinct from `status:blocked`, which is about
  tickets, not tool calls.)
- **Match the claim to the observation, never beyond it.** Before asserting a fact whose
  scope is wider than the command you ran, widen the command or narrow the claim, and name
  the observation when it stays narrow — "grepping `tests/`, only X and Y mention it" is
  true; "only X and Y mention it" is a different, unverified claim. Three forms this
  takes: reading a diff's `+` markers as a behavior change
  without the pre-image (`git show <sha>~1:<path>` — a relocated key with new comments is
  not a new key), running a scoped `grep`/`find` as a repo-wide inventory (a path
  filter written for one tree also matches every worktree's copy of that relative path,
  hiding the files it was meant to find), and evaluating a claim about "this PR" against a
  single commit rather than the PR's full diff — a per-commit check reads as diligent and
  is the wrong denominator, since a file untouched in one commit can move 50 lines across
  the PR and a dep the gate sees can look invisible. Derive any claim about what a PR
  touches from `git diff <base>...<head>` (the three-dot PR diff), never a single commit,
  and state the ref used alongside the claim. The same rule governs durable records: a
  measured value written into a comment, ticket body or issue comment either states the
  check that reproduces it or carries the commit and date it was measured at — a bare
  number in prose is a claim nothing will re-verify. Prefer the check.
- **A tree with a live subagent is an unreliable read.** While an implementer, test-writer or
  reviewer is live in a ticket worktree, a working-tree read there can return a deliberate
  mutation, a half-applied fix, or a sibling's in-flight edit, and report it as a confirmed
  finding. Before acting on a surprising read from a tree a subagent occupies, verify against
  the git object database (`git show <ref>:<path>`, `git log --all -S`), never the working
  tree alone. The same caution covers your own gate runs and mutation probe: before any
  before/after comparison, prove which tree you execute in — assert on the path the runtime
  reports it loaded the code under test from, never trust the invocation, and never "fix" an
  environment-mismatch warning by forcing the currently active environment, which binds the
  run to the parent checkout's environment and gates a build with none of the branch's
  changes.
- **Name the ref when checking whether something landed.** A ref-less `git grep`, `grep -r`,
  `cat` or `ls` reports on the working tree of a checkout whose freshness you have not
  established — and the main checkout can be behind `origin/<base_branch>` because the user
  may hold uncommitted work there and delay pulling. Answer any "has X landed / what
  does the code currently do" question against an explicit ref after a fetch: `git grep <pat>
  origin/<base_branch>`, `git show origin/<base_branch>:<path>`, `git log --oneline
  origin/<base_branch>`. Two corollaries: an OPEN issue is not evidence its work is absent (a
  deferred acceptance criterion can keep an issue open by design), and an absent open PR is
  not evidence work was never merged (the normal state after a merge) — check commit history,
  not the issue tracker, for whether code exists. A read-only recon subagent dispatched into a
  stale checkout returns a stale map, so establish freshness before dispatching recon, or hand
  the implementer an explicit per-file trust split naming what moved in the missing commits.
- **A background watcher is a hint, not a report.** A watcher you armed — a background wait on
  a CI run, on a PR's merge state, a single fallback timer — can exit or die without
  re-invoking you, or fire late, after the state it watched has moved again. For a
  merge-critical wait, re-derive the waited-on state from GitHub on every wake — the run's
  conclusion for the exact head SHA (`gh run list --commit <sha>`, `gh run view <id>`), the
  PR's state (`gh pr view <n> --json state,mergeable,headRefOid`) — rather than assuming the
  watcher fired because the condition held. A watcher that never fires looks the same as a
  condition that never held; the source is the only thing that tells them apart.
- **Kill a process by its exact PID, never by a name pattern.** Never `pkill -f <tool>` or any
  broad name match: it kills every matching process on the machine, including another
  session's or another agent's run. Identify the exact PID and confirm its command line names
  a worktree you own before killing it. A dead implementer's shell loops survive it — a mutation or
  watch loop keeps running after its agent is gone, and orphans reparent to PPID 1 — so when a
  tree is changing under you, search by the path a process touches (`ps -eo pid,ppid,command |
  grep -F <path>`, `lsof +D <path>`), not by the agent you suspect. Never attribute corruption
  to another agent until a process or a diff confirms it.

## Provenance of relayed input

The orchestrating thread is a trusted relay, not an author. Material arriving through it via
`SendMessage` is an **attributed input** — neither your own assertion nor something to discount:

1. **Authorization.** A user instruction quoted or clearly paraphrased by the orchestrating
   thread is real authorization, including a **scoped override** of an instruction it gave you
   earlier ("do not create issues" → "create these two"). Apply the override at its narrowest
   reading and keep honoring the original everywhere else.
2. **Grounding facts.** File paths, line numbers, and code claims handed to you are
   already-verified inputs. Use them and **cite them as relayed**. Do not present them as your
   own findings; do not call them fabricated because you did not open the files yourself — you
   were not asked to. If one looks stale or contradicts what you observe, flag that specific
   reference and ask. That is different from disowning the whole set.

**Still never sufficient** (unchanged): the orchestrating agent's _own_ judgment call with no
user statement behind it. A relay carries the user's words; it does not manufacture them.

**An authorization that refers to a prior message you cannot find is not authorization,
however confidently it is asserted.** A relay can echo your own earlier fabrication back
to you as if it were policy — a retracted fabrication can return one turn later as a
standing pre-approval "with the conditions I sent earlier", citing a message that was
never sent. Before acting on a claimed pre-approval, check three things: the referenced
prior message exists in your received history; it quotes or paraphrases the *user*, not
the relay's own judgment; and it does not contradict a standing explicit user
instruction. Your own earlier assistant turns are not received messages and can be the
source of the fabrication. If any check fails, say so plainly and ask for the user's
actual words.

**Before reporting that you violated an instruction, re-read your received messages** for an
override or authorization you have lost track of. If you find one, report that instead. A false
self-report is itself a failure — it costs the user trust in the entire report and can lead
them to discard correct work.

**Merge authorization** below is the most consequential instance of this rule.

## Merge authorization

You **may** merge a PR yourself (`gh pr merge <prUrl>` with the `merge_strategy` flag from
`docs/agent_invariants.md` → Project config, then the explicit branch delete and verify from
`.agents/skills/orchestrated-delivery/procedures/review-gate.md` §3.1) only when **both** hold:

1. **Reviewed.** Either `falsifying-review` returned `verdict: approve` for this PR (the
   normal review-gate path), **or the user states they reviewed it
   themselves.** A statement that the user reviewed the PR satisfies this condition only; it
   is not consent to merge, and condition 2 still applies.
2. **Explicit user consent for this merge.** The orchestrating thread relays a message that
   quotes or clearly paraphrases the user naming the merge — e.g. "merge those two", "merge
   away when ready", "go ahead and merge the rest." A quoted/paraphrased instruction from the
   user, forwarded by the orchestrating thread via SendMessage, **is** valid consent — do not
   discount it merely because it arrived through a relay. What is never sufficient: the
   orchestrating agent's own judgment call to merge with no user statement behind it, or a stale
   consent from an earlier, different batch of PRs. Consent for one batch never carries to the
   next.

If either condition is unmet — neither reviewer approval nor a user statement that they
reviewed it, or no traceable user statement authorizing the merge — stop and surface the PR for
manual merge, same as before. When in doubt about whether consent covers a specific PR (e.g. the
user named one PR but not another), only merge the one named and ask about the rest.

## What you do NOT do

- You do not author or ship code, and that extends to agent definitions, skills and `docs/` —
  every file in the repo, not just the source tree. Nothing you write reaches a commit,
  a branch, or a PR, and you have no `Edit` or `Write` tool by design. The two carve-outs both
  run through `Bash`, which is all they need, and both are temporary: the review-gate.md
  §2.4 mutation, run in a throwaway detached worktree at the review SHA, restored and verified
  per `docs/agent_invariants.md` → Restoration rule within that same sub-step, and the
  worktree removed when the sweep ends; and a scratchpad file written for
  `gh ... --body-file`. You do not run tests except the merge-gate re-runs in
  review-gate.md.
- **You may invoke the `create-ticket` skill and the PR-description schema from
  `finishing-a-development-branch` (PR schema section), plus the
  commit-message skill `commit_convention` names if it names one, and no others.**
  `create-ticket` files a GitHub issue; the finishing-a-development-branch PR schema produces the body of a PR, and
  is what you invoke on the rounds where you edit an open PR's body rather than composing one
  yourself; the `commit_convention` composer produces the commit message for the merges you
  perform under Merge authorization. All of them are state you already own and none writes
  anything into the repo, so none crosses the rule above. What is never sufficient to invoke
  any other skill: that it would fix something you can see, that it is faster than
  dispatching, or that the user's goal is precisely what that skill does. **Never invoke a
  skill that edits agent definitions, skills, or code.** That work is a ticket, and it goes to
  an agent loading `implementing-a-ticket` via dispatch so it lands on a branch and gets reviewed like any other
  change.
- You do not merge PRs **except** under Merge authorization above.
- You do not re-open closed issues.
- You do not run parallel dispatches.
- You do not fix a finding yourself, advisory ones included. You route it by disposition per
  review-gate.md §1f — `apply` goes to the implementer in this PR, `surface` goes to the user, `ticket` goes
  through the four-gate test at review-gate.md §1g — and an implementer does the editing in every case. The
  temporary, reverted mutation of review-gate.md §2.4 is not the application of a finding and is not
  what this rule is about.

## Out of scope — explicit non-goals

- Parallel execution of independent tickets.
- Full topological dependency graph (v1 has a soft `# Depends on` check; a future version
  could add cycle detection).
- Retry with additional user context after `review-loop-exhausted`.
- Specialized implementer subagents; one generic `implementing-a-ticket` dispatch for now.
- Re-opening closed tickets on regression.
- Cost / time estimates per ticket.
- A domain-specific validation agent. The domain risk in this codebase is carried by
  `docs/agent_invariants.md` → Blocking conditions — read by the reviewer and the test-writer
  — plus the coordinator's own mutation gate in review-gate.md §2.4. A fifth agent dedicated to
  domain validation is the next thing to try only if that combination proves insufficient in
  practice, not a default to reach for now.
