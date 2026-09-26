# Reviewer axes, claim verification and design review

Standalone: the reviewer's five-axis diff review, adversarial claim verification, and
bounded design review. Numbered 1 (axes), 2 (checks-as-claims), 3 (adversarial
verification), 4 (design review), 5 (prose claims). Every reference out of this file names
its file.

1. **Review the diff** along five axes. Axes (a)–(d) are merge-gating; axis (e) is
   advisory. For each finding, cite `file:line` and a category from the enum in
   `reviewer-verdict-shapes.md`.
   - **(a) Obvious bugs** — null deref, off-by-one, missing raise, unguarded division,
     wrong-sign comparison, resource leak, infinite loop. Only flag what you can prove
     from the diff. Don't speculate about runtime behavior you can't see.
   - **(b) Security smells** — scan every changed path for all four, not only the first
     one you think of:
     - **Unsanitized input** — user- or externally-supplied data reaching a sink without
       validation or escaping: rendered into markup, interpolated into a query, a shell
       command, a file path, or a prompt.
     - **Missing authentication or authorization** — a request-path handler that acts
       without verifying who is calling, or that verifies identity but never checks the
       caller may act on *this* resource.
     - **Missing rate limiting on a request path** — a public or authenticated endpoint
       that can be driven in a loop, especially one that spends money or calls a paid
       upstream, with no limit the project's existing limiter applies.
     - **Hard-coded secrets** — a credential in source, or a pattern that reads a
       credential and returns or logs it.

     **Do not read any file matching `secrets_files`** (`docs/agent_invariants.md` →
     Project config) — that's a project-wide rule. Flag the _pattern_ (e.g. "this function
     reads an API-token environment variable and returns it in its result") without ever
     opening the secrets file. A proven security defect is a `blocker`; a missing check you
     cannot prove is exploitable from the diff is a `major` naming the path and the check.
   - **(c) Lint / gate drift** — already caught by the gates in `reviewer-gates.md`
     section 3; do not duplicate. (If you spot something the gate didn't catch — a warning
     silenced rather than fixed — note it under a separate finding, with
     `category: "invariant"` when a `docs/agent_invariants.md` → Blocking conditions entry
     covers it, quoting that entry's lead phrase.)
   - **(d) Acceptance-criteria fit** — for each bullet in the issue's Acceptance criteria,
     verify the diff addresses it. If a bullet is missed, that's a `blocker`. If a bullet
     is partially addressed, that's `major` with a description of what's missing.
     Also gating: when the PR's value **is** an invariant — an atomicity guarantee, an
     ordering constraint, a race that must not reopen, a contract that must not silently
     drift — confirm a test protects it. The test for whether this applies: can you
     describe a plausible simplifying edit that breaks the invariant while leaving the
     whole suite green? If yes, that is a `blocker` — the criterion is unmet, because the
     behaviour the PR promises is unprotected. Never sufficient to downgrade it: that the
     suite passes, that the implementer says the behaviour is covered, or that a follow-up
     ticket could carry it. A general "more tests would be good" stays advisory.

     **Establish this by deleting, not by describing.** Break the guard and re-run — one
     limb at a time, against the **full** suite, never a scoped subset — and name the
     specific test that goes red for each. A limb with no failing test is unenforced, and
     that is the blocker. Mutate at the finest resolution the invariant has: proving a
     lookup *table* is validated while each of its individual entries can be moved with the
     suite byte-identical is the same defect one level up. Try the shapes a future edit
     would actually take, from `docs/agent_invariants.md` → Mutation shapes — including a
     superseding key and a differently-cased spelling (`reviewer-gates.md` section 4), not
     only deleting the line. A comment asserting coverage is itself a claim to verify — an
     inaccurate one invites the deletion it was written to prevent.

     **Where the mutation runs.** Only in a throwaway detached worktree at the review SHA,
     never the implementer's live worktree, and only after the restore procedure in
     `code-quality-reviewer.md` (Constraints) is in hand. A mutant run that reports zero
     tests, or an all-green you did not expect, is a broken harness until a positive
     control — a mutant known to fail — proves otherwise: a mutant that does not compile
     can report "no tests", which reads exactly like a clean run.

     **Proportionality.** Require a named failing test per site only where you can state
     what a **user of the output** loses when that site breaks: a value computed against
     the wrong reference, a record attributed to the wrong owner, a displayed figure that
     no longer matches its own scale. Where you cannot, one grouped test is the correct
     answer and demanding more is manufacturing tests — mutation coverage emits one test
     per site by construction and has no stopping rule of its own. Do not treat a grouped
     test as a gap. This softens nothing above it: a guard whose failure puts a wrong result
     in front of a user, loses data, or charges twice still needs its own named test and
     still must go red under mutation.
   - **(e) Design and simplification** — see the bounded design review in section 4.
     Findings here are `advisory` and never block a merge.

2. **Treat every check the implementer cites as unverified until its coverage is established.**
   The hand-back's `checksRun` is a claim, not evidence. For any check the implementer leans on
   to defend a specific change, determine what that check actually inspects and whether it
   intersects the diff — a validator that compares one field while another was edited, or
   a gate that never ran against the changed path, is green for reasons unrelated to the
   work. An implementer that states its own coverage ("this passes but does not observe my
   change") has done this correctly; absent that, do it yourself. If you cannot run a
   gate, say which one and why, and substitute an observation that does cover the change
   rather than skipping silently.

3. **Verify the implementer's claims adversarially. This is the default, not something the
   caller must request.** Before reviewing the diff, list the load-bearing assertions in
   the hand-back — "X is the only call site", "this is comments-only", "the test fails
   without the fix", "every tier is covered", "no other caller depends on the old
   behavior". Each is a claim. Pick the ones the PR's correctness rests on and try to
   falsify them.
   - **Prefer executing over reading.** Run the changed module against the case in
     question, in the throwaway detached worktree if you must mutate anything. Reading code
     confirms what the author intended; running it confirms what it does. A test asserting
     a general property may pass for an incidental reason — construct the neighbouring case
     (the other ordering, the empty input, the second element) and see.
   - **Re-derive rather than confirm.** If the implementer says a symbol has one call site,
     grep it yourself. If it says a mapping row points at a decision that carries a fact,
     read the target and look for the specific fact, not an adjacent one.
   - **Check the claim at the right resolution.** A claim can be true at set level and
     false at occurrence level, or true in aggregate and false per case. When a corrected
     claim is wrong again, the defect has usually moved one resolution finer than the last
     finding named — measure the finer one.
   - **Ask what the implementer did not test.** A fix verified only on the happy path, or only
     through the interface the author was thinking about, is a common source of surviving
     bugs.
   - **A stated risk, cost or tradeoff is a claim too.** The PR body's
     `## Notes for reviewers` section is the least verified thing in it — an assertion
     about what the code does in a case the author did not test — and it is frequently
     the input to a human merge decision.
     Falsify or confirm each one and label the ones you could not check. Never sufficient:
     that the risk sounds plausible, that it is conservatively stated, or that it sits
     under a heading marked speculation.
   - **Your own proposed fix is a claim, and it is not exempt.** When you tell the implementer
     what to write instead — a replacement sentence, a one-line command, a narrower rule —
     you are asserting that the replacement is true, and it inherits none of the
     verification the finding itself had. Measure it before you send it. **An implementer that refutes your
     finding with a measurement has done its job** — treat that as the round succeeding,
     confirm the measurement yourself, and retract in the next verdict rather than
     restating the finding at a finer resolution. A retraction is a `priorFindings` entry
     with `status: "retracted"`; dropping the finding silently is not a retraction.

4. **Bounded design review** (axis e). This is the only pass that examines design quality,
   so a defect you skip here ships. Look at: unnecessary complexity in the added code,
   duplicated logic the diff could have reused, a second source of truth for something the
   codebase already models once, dead or unreachable code introduced, naming that actively
   misleads about behavior, a performance characteristic that will bite at realistic
   scale, and test coverage that omits the case the change is most likely to break.
   Every design finding must clear all four of these or it is taste and you drop it:
   - It concerns code **this diff adds or changes** — not pre-existing debt you noticed
     nearby.
   - You can name a **concrete cost**: what breaks, what gets slower, what a future editor
     gets wrong. "Could be cleaner" is not a cost.
   - You can name a **specific alternative**, not a direction.
   - It would still be worth doing **a month from now**. If it only matters because you
     happen to be looking, drop it.

   Cap design findings at **five**, ranked by cost. If you have more, you are reviewing
   style. These are reported as `advisory` and never gate the merge. Stamp each with a
   `disposition` — `apply` (default: the implementer fixes it in this PR), `surface`, or
   `ticket`.

5. **A prose claim that survives two rounds of correction is the wrong artifact, not the
   wrong wording.** When the thing under review is a documented statement about behaviour
   and the second corrected version is still measurably false, stop correcting it. Say so
   once in `summary`, recommend that the passage state its enumeration and stop, or that it
   be dropped in favour of the single place the fact already lives, and let the coordinator surface
   the choice to the user. Prose is invisible to every gate this repo has: the linter and
   the test suite cannot see it, so each round costs a full cycle and buys a sentence
   nobody can test. Two rounds on one sentence is the signal that the sentence is trying
   to say something that is not true in general.

   The same test applies to duplication: a measured fact documented in two places is one
   round away from disagreeing with itself. If the diff adds a second copy, that is an
   advisory finding naming the copy to keep — and if a diff *deletes* one copy, check that
   the survivor is the correct version, because the deletion may have left the wrong one
   standing as the sole source.
