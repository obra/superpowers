# Coordinator Dispatch and hand-back procedure

Expands Delegation-loop steps 7, 8 and 8a of `code-coordinator.md`, numbered 1, 2 and 2a
here. Every reference out of this file names its file.

1. **Spawn the `code-implementer` subagent** via the Task tool, passing it:
   - The issue number.
   - The full issue body.
   - The main repo checkout path — resolve it portably, never hardcoded:
     `dirname "$(git rev-parse --git-common-dir)"`.
   - The project slug (so it can name the worktree per `ticket_worktree_pattern`,
     `docs/agent_invariants.md` → Project config).
   - The base ref, `origin/<base_branch>` (`base_branch`, same section), **and the SHA you
     pinned for it at pre-flight** (`code-coordinator.md` Pre-flight step 3). The implementer
     fetches and branches from `origin/<base_branch>`; the pin records what the ticket was
     dispatched against, so a base move while it is in flight is a comparison of two SHAs
     rather than a guess. Never branch from, or pin, the local `<base_branch>` — it may carry
     the user's unpushed work.
   - **Any batch-level deferral `docs/agent_invariants.md` → Project tool rules defines, as of
     this dispatch, stated either way rather than left out** (for example, regeneration of a
     derived artifact the build regenerates, deferred to one reconciliation at the end of a
     batch). The implementer's decision about that artifact turns on it. Omit the field only when
     the project defines no such deferral, and say that it defines none.
   - **Your own address, so the implementer can `SendMessage` its hand-back straight back to you**
     — when you have one. The implementer has no `ListAgents` and must not infer a recipient: a
     guessed `"main"` reaches the orchestrating thread and bypasses you silently, which is
     worse than not sending. Pass the address as a dispatch-time value; never write a literal
     one into this file, which would rot. **If you cannot determine your address, say so and
     omit the field** rather than guessing — `ListAgents` is in your `tools:` but has been
     observed disabled for a session and in subagents alike, so this is a real case, not a
     hypothetical. Omitting it costs nothing: the implementer returns the hand-back shape as its
     result on **every** path, address or not, so what an omitted address loses is the direct
     copy and never the hand-back itself — the returned one surfaces in the orchestrating
     thread and gets relayed, exactly as it did before the channel existed. A missing address
     degrades to a visible relay; a wrong one degrades to a silent miss.

     Supplying an address does not guarantee a message either: an implementer's `SendMessage` has
     been observed absent from its runtime set, and which `tools:` line its session loaded
     is not observable from your side — so do not read a missing send as the implementer
     declining to use a tool you know it has. Its `toolGap` distinguishes absent tool from
     absent address, and either way the returned shape is what you actually rely on.
   - **The verification tier you chose for this ticket, stated explicitly.** Same taxonomy as
     step 2a — not a second one.
   - **Every other agent that will commit into this ticket's worktree while the implementer holds
     it**, named per step 2a — or a statement that none is planned.

   **Classify the tier at dispatch and say which you picked.**

   - **Full tier** — the ticket adds or repairs a guard, cap, dedupe, classification,
     normalisation, entitlement, ordering constraint, or race: anything shaped *"X must never
     reach Y."* Gets `unit-test-writer` hardening (step 2a), your own per-limb mutation gate
     (coordinator-review-gate.md §2.4), and independent review. A green suite is not evidence for this shape of change.
   - **Light tier** — docs, comments, config, dependency bumps, ignore patterns,
     behaviour-preserving refactors: anything whose contract is its happy path. Implementer
     self-review plus a green full suite and the independent review. No mutation sweep, no
     `unit-test-writer`.

     **Light tier assumes the gates reach the touched code — check that before granting it.**
     Ask which touched files the lint and test gates (`lint_command`, `test_command`,
     `docs/agent_invariants.md` → Gate commands) never load: anything the linter's config
     excludes, scripts no test imports, any pinned or frozen record. A green suite over files
     the suite never loaded is not evidence. Where touched files sit outside gate reach,
     require the implementer to enumerate them by path and say what it checked in each.

   **When unsure, choose full**: a misclassified invariant ships a decorative guard, while a
   misclassified refactor only costs a sweep. A ticket that reads as cleanup can still establish
   a guard — classify by the shape of what it enforces, not by how the work sounds.

   **Mutation gates cover production code and key functionality only.** The per-limb,
   full-suite sweep is priced for production code and anything reaching the product's
   deliverable or user-facing output. Eval tooling, scripts and experimental code get
   proportionate coverage instead: the suite must pass, but tests are not individually
   mutation-proven, and fencing prose constants is explicitly not wanted. Each test added is a
   probe the review must run, so test count is a review-latency decision, not only a coverage
   one — a test that fences trivia taxes every future round.

   State the tier in the dispatch and in the issue comment, so the implementer knows before it
   starts whether a mutation gate is coming.

   State the tier to the reviewer too, with the one-line reason. A light tier means you decided
   no invariant was in play and no mutation gate would run — the reviewer is the backstop for
   that call, and it cannot back up a decision it was not told about. For a behaviour-preserving
   ticket, say so explicitly: no functionality changed, so there is nothing to mutate, and the
   evidence is the byte-identical output comparison.

   **If `origin/<base_branch>` moves while a ticket is in flight, attribute before you judge.**
   Compare it against the SHA you pinned at dispatch. This matters precisely when the criteria
   are measured numbers: they were measured against code the new base may have changed, so a
   post-integration divergence has two candidate causes and the implementer cannot tell them apart.
   Fetch when a hand-back arrives; if the base moved since the pin and the criteria are
   measured values, instruct the implementer to integrate (by the branch-state rule in its own def)
   and then run the attribution experiment: on the integrated code, revert the ticket's own
   change and regenerate — if the ticket's documented before-numbers still reproduce, the new
   base is inert for this fixture and the criteria remain valid; if they do not, the criteria
   were measured against code that no longer exists, which is a stop-and-surface about the
   base, not a failure of the ticket. State this expectation in the dispatch or follow-up
   message, so a disagreement is informative rather than ambiguous.
2. **Wait for the implementer to hand back.** It returns
   `{ok: true, readyForReview: true, prNumber, prUrl, branch, worktreePath, filesChanged, selfReview: "lint-grade", checksRun, iteration, routing, summary}`
   once the PR is open and self-reviewed. If `{ok: false, reason, missingInfo, suggestedNextStep, worktreePath, routing}`,
   go to code-coordinator.md §11. Take `prNumber` and `worktreePath` from the hand-back when dispatching the
   test-writer and the reviewer below — both are emitted precisely so you do not reconstruct
   them from `prUrl` or from the `ticket_worktree_pattern` naming convention.

   **A hand-back can arrive on either of two channels, and may arrive on both.** Name them
   rather than treating delivery as unexplained magic:

   - **The implementer's `SendMessage`**, when you supplied an address in step 1 and its
     `SendMessage` tool was actually present. This one lands directly in your turn.
   - **The implementer's returned result**, which it emits on every path whether or not it sent.
     Depending on how the session is wired this surfaces to you directly or in the
     orchestrating thread, which relays it.

   **Both arriving is the designed outcome, not a duplicate to report.** Match them on
   `routing` — same `issue`, same `answers` — and act on the hand-back once. Treat a second
   copy of a hand-back you have already acted on as confirmation, never as a new round. What
   you must not do is infer from *one* copy that the other channel failed: only the implementer's
   `toolGap` says that. Its absence means the implementer observed no failure — not that the send
   landed, which neither end can see. So do not count a `toolGap`-free hand-back as evidence
   the direct channel was exercised; a send that reported success and never arrived looks
   identical from here.

   **Do not poll.** A completion reaches you on one of those two channels without your
   arranging it: waiting is the default, not something you set up. Do not schedule self-wakeups, sleep
   loops, or repeated status checks to discover it. If you schedule a single timer as a fallback
   against a genuinely hung implementer, keep at most one outstanding and cancel it the moment the
   hand-back arrives; a queue of timers will keep firing after the loop has exited and
   re-invoke the orchestrating thread for no state change. When any watcher or timer does
   wake you, re-derive the state it was watching from its source rather than from the fact
   that it woke you (code-coordinator.md, Constraints).

   **Ending a turn with live children is a harness outcome, not a violation.** An async
   child's completion is delivered after your turn ends, and you have no blocking wait —
   no tool in your set parks you until a hand-back arrives. A "never return while a child
   is live" rule therefore demands something the harness does not offer: every hand-back
   costs a relay round and reads as a violation the agent could not avoid.
   Design for the relay instead: if your turn ends while an implementer, test-writer or
   reviewer is live, return with an explicit **live-children roster** — for each, the
   agent, its purpose, the round it is answering, and the PR/issue — so whoever relays
   the hand-back can route it without reconstructing state. The relay path is already
   built: the implementer's `routing` field, the relay line at coordinator-review-gate.md §1a, and the
   Provenance-of-relayed-input rules govern what comes back. Returning ends your turn and
   nothing but an inbound message restarts it (code-coordinator.md, "Your turn ends when you
   return"), so a return without the roster strands every live child's hand-back. Still
   return yourself for exactly two reasons — a decision only the user can make (with an
   explicit ask naming it), or the dispatch is finished — and never end a turn on a status
   summary alone when the next action is yours to take.

2a. **Harden the tests before review, when the ticket introduces or repairs an invariant.**
   Spawn `unit-test-writer` as a sibling, passing the hand-back's `prNumber`, its
   `worktreePath`, and the specific invariant the ticket establishes (quoted or paraphrased from
   `docs/agent_invariants.md` → Blocking conditions). It runs **after** the implementer and
   **before** the reviewer, so the reviewer sees a settled state rather than a moving target —
   and because at most one agent — **you included** — occupies a ticket worktree at a time, so
   the order is not optional.

   **Tell the implementer whenever you spawn an agent that will commit into its worktree.** A
   hardener committing into a worktree the implementer still holds is indistinguishable from
   contamination: the implementer cannot see its siblings, and every commit carries the same local
   git identity, so `git log` settles nothing. Whenever you spawn an agent that will commit into
   a live ticket worktree — the test-writer here, or any other — name it in the implementer's
   dispatch, or in a `SendMessage` if the implementer is already running, with the label it runs
   under and roughly what it will touch (which test files, which fixtures). An unnamed sibling
   commit gets flagged and blocks a merge while provenance is established; a named one is
   expected and gets built on.

   **When it applies:** the ticket adds or repairs a guard, cap, dedupe, classification,
   normalisation, entitlement, ordering constraint, or race — anything shaped _"X must never
   reach Y."_ Skip it for pure refactors, docs, comments and config.

   **Why this step exists.** A correct implementation can ship with tests that protect none of
   it: a mutant reintroducing the exact defect the ticket closes still passes the suite. Test
   **presence** is not the signal; test **falsifiability** is. `unit-test-writer` establishes it
   by breaking the invariant and confirming a test goes red before handing back.

   **Tell it plainly what to hunt:** a test that mocks the module under test proves the mock
   works; a test that asserts a value was written proves the write, not the behaviour that
   value is supposed to gate; and shared fixtures beat several copies of the same hand-rolled
   stub drifting apart.

   It reports back in plain text (no JSON return shape is expected of it): which test files it
   added or changed, which invariant each protects (quoting the bold lead phrase from
   `docs/agent_invariants.md` → Blocking conditions), the mutation it ran with raw before/after
   counts, any invariant it could not get coverage for and why, and confirmation that
   `test_command` is green and `git status --porcelain --ignore-submodules=all` is clean.

   **If it names an invariant it could not get coverage for, don't drop that on the floor.**
   `unit-test-writer.md` is explicit that a test it can't write — or can't make fail against
   broken code — without an implementation change is a finding for you to route to the implementer,
   not something it fixes itself. Treat it exactly like a reviewer finding: `SendMessage` it to
   the implementer before spawning the reviewer, batched with anything else outstanding. The implementer
   either adjusts the implementation to make the invariant coverable, or narrows the ticket and
   says so in the PR body; either way, re-run step 2a before moving on. This does not by itself
   block the merge — it's a routing step, not a verdict — but don't let it pass through to the
   reviewer silently uncovered, either. The backstop is coordinator-review-gate.md §2.4: your own mutation gate runs
   independently of whatever the test-writer could or couldn't cover, so an invariant that stays
   genuinely unprotected is still caught there and still turns into `changes-requested` at that
   point, regardless of how this step went.

   **Cap this at two step-2a re-runs.** Because the backstop exists, this loop does not need to be
   run to convergence, and an uncapped one can spend a ticket's whole budget on coverage the
   mutation gate is about to decide anyway. If the invariant is still reported uncovered after
   the second re-run, stop re-running: proceed to coordinator-review-gate.md §1 with the reviewer,
   record the uncovered invariant by name in the verdict comment at coordinator-review-gate.md §2.5,
   and let coordinator-review-gate.md §2.4 settle it. If your
   own mutation leaves the suite green there, it is `changes-requested` like any other gate
   failure. If it goes red, the invariant is protected by something the test-writer could not
   see, and the merge proceeds with the gap on record. These re-runs are not review rounds and
   do not count against coordinator-review-gate.md §1d's three.
