# Coordinator Review gate procedure

Expands Delegation-loop steps 9 and 10 of `code-coordinator.md`, numbered 1–3 here.
Section 2 carries the merge-gate sub-steps 1–5; section 3 carries sub-steps 6–11
(merge, cleanup, close-out). Every reference out of this file names its file.

Gate commands (`test_command`, `lint_command`, `typecheck_command`, and any stage-scoped
gates) are defined in `docs/agent_invariants.md` → Gate commands. A blank gate is skipped, and
the skip is said in the gate evidence (§2.5) rather than left silent.

1. **Run the independent review — you own this.** The implementer is a depth-2 subagent and
   **cannot spawn the reviewer itself**, so you spawn `code-quality-reviewer` as its sibling.
   Loop up to 3 rounds:

   **Before spawning any reviewer, verify all five.** The reviewer reviews what is *pushed*;
   a verdict rendered against a moving tree is worthless, and re-rendering it costs a full
   round. This is mechanical — run it every time, not just when something looks off.

   1. `git status --porcelain --ignore-submodules=all` in the worktree is empty.
   2. The branch is pushed and in sync with its remote.
   3. The full `test_command` is green, with the implementer quoting its summary line.
   4. You have the head SHA and pin the review to it — record in the PR comment which SHA
      each finding was rendered against.
   5. You have re-derived the current round from the PR's round comments (§1d), not from
      your own context.

   **An advisory `apply` finding reaches the implementer before the merge, one way or the other.**
   On a `changes-requested` round, batch it with that round's `blocker`/`major` findings so it
   costs no extra iteration. On an `approve` verdict it gets a round of its own before step 2.
   The reason the approve case cannot skip the round: the merge removes the worktree, and an
   `apply` finding not applied before the merge is stranded forever — step 2 files only
   `ticket` dispositions and has no branch for `apply` ones, so the finding silently dies at
   section 3.3 below. The implementer applies and re-pushes, and you re-run the gates yourself on
   the new SHA (`lint_command`, `typecheck_command`, the full `test_command`, and any
   stage-scoped gate whose scope the diff touches). Then two backstops, and a full-tier round
   gets both:
   - **When the applied advisory added or changed a guard line, mutate that fix before
     accepting it** (§2.4, in a fresh throwaway worktree at the new SHA). An advisory fix is
     exactly as likely to be decorative as the original code was, and it arrives late enough
     that nothing else re-gates it.
   - **When the round touched a full-tier guard, re-review at step 1a on the new SHA as
     well.** The mutation proves the fix is enforced; the re-review proves it is correct and
     that it did not falsify an earlier justification. Neither substitutes for the other.
   Outside those two cases there is **no re-review**: the verdict is already `approve` and
   advisory findings cannot change it, so after the gates you merge. The implementer may decline
   each finding as usual; a declined advisory is dropped, not forced, and the merge proceeds
   on the gates alone.

   a. Spawn `code-quality-reviewer` via the Task tool, passing the hand-back's `prNumber`, the
      issue number (for acceptance criteria), the hand-back's `worktreePath`, the round number
      you derived per §1d, and **any batch-level deferral `docs/agent_invariants.md` → Project
      tool rules defines, as of this dispatch, stated either way rather than left out** — same
      as the implementer's dispatch in coordinator-dispatch-handback.md. The reviewer's ruling on the
      deferred artifact turns on it. The reviewer's worktree is **read-only**; if the review
      will mutate files, pass a throwaway detached worktree at the review SHA instead
      (§2.4). It fetches `gh pr diff` and returns a structured verdict:
      `{verdict: "approve", summary, checksRun, claimsVerified, criteriaFit, advisory, priorFindings}`
      or `{verdict: "changes-requested", blockingFindings, summary, findings, checksRun, claimsVerified, criteriaFit, advisory, priorFindings}`.
      `priorFindings` is empty or absent in round 1; from round 2 on it accounts for every earlier
      merge-gating finding as `fixed`, `retracted` or `open`, plus any advisory the reviewer
      withdrew; advisories it still stands behind you route yourself at §1f. It is where the
      verdict comment's resolution column comes from (§2.5) — never a
      round-over-round diff of your own. If a re-review returns without it while earlier
      findings exist, ask for it rather than inferring; that inference is exactly what the
      field replaced.

      **If you cannot spawn it** — `Task` absent, or a hand-back that surfaced in the
      orchestrating thread instead of yours — that is a harness condition, not a failure.
      Say so in one line carrying the values whoever is relaying needs in order to run
      it for you: **PR number, issue number, worktree path, review SHA, round number, and
      the batch-deferral state (when the project defines one).** Do not describe the
      situation in prose. Restate the round number and what is outstanding in every message you
      hand to a relay — the PR's round comments (§1d) are the durable record, and restating
      saves the relay from re-deriving it.
   b. **`verdict: approve`** → post the round comment (§1d); then, if the `advisory` array
      carries any `apply` disposition, open one advisory round first per the paragraph above
      step 1a (send them to the implementer, re-run the gates yourself on the re-pushed SHA,
      mutate an applied guard fix, and re-review if the round touched a full-tier guard),
      then step 2 (merge). No `apply` findings → step 2 directly.
   c. **`verdict: changes-requested`** → post the round comment (§1d), then SendMessage the
      implementer (its worktree + context are live) with the **`findings`** to apply. It fixes,
      re-pushes, re-self-reviews, and returns the hand-back with `iteration: N`. Re-review
      (step 1a).

      **A fix round can come back blocked.** If the implementer returns
      `{ok: false, reason, missingInfo, suggestedNextStep, worktreePath}` instead of the
      hand-back, treat it exactly as an initial-dispatch blocker: go to code-coordinator.md §11, mark
      `status:blocked` with the implementer's `reason`, note which round it blocked in and which
      findings were outstanding, and stop. Do not re-send the findings, do not spend the
      remaining rounds on it, and do not merge over it. A blocked implementer is a stop-and-surface,
      not a round — the round count is only for hand-backs the reviewer can re-review.

      **A `changes-requested` whose findings are all explicitly non-code-actionable routes to
      stop-and-surface, not a fix round.** A finding whose own text says no code change is
      requested and names the resolution as above the implementer — a refuted acceptance criterion,
      a decision only the user can make — cannot be acted on in the ticket, and sending it to
      the implementer is make-work against a target that is not the diff. Set `status:held`,
      record the verdict and the releasing decision on the PR and the issue, and stop; this
      consumes no review round. The three-round budget is for diff disputes, and a re-review
      can happen cheaply later against an amended issue body if the user wants an `approve`
      on the record.
   d. **After 3 unapproved rounds** → mark blocked with reason `review-loop-exhausted`
      (code-coordinator.md §11), posting the last reviewer feedback. Never merge an unreviewed PR.

      **The round count lives on the PR, not in your context.** After every reviewer verdict,
      and after every §2 gate failure that consumes a round, post a one-line PR comment
      carrying the round number, the verdict (or the failed gate), and the SHA it was
      rendered against — e.g. `Review round 2 of 3: changes-requested at <sha>`. Before
      spawning any reviewer, re-derive the current round from those comments
      (`gh pr view <n> --comments --json comments`), take the next number, and use that. A
      resumed PR — a new coordinator instance, a relayed hand-back, a restarted session — inherits the
      count from the PR rather than restarting at 1; a coordinator that counts from memory hands every
      resumed PR a fresh three rounds. Where your context and the comments disagree, the
      comments win, and you say so. A user-directed scope change resets the budget
      (code-coordinator.md, "User-directed scope changes"); post the reset as a round comment
      too, so the ledger carries it.
   e. **Sharpen each re-review with what the last round found.** Re-review round N+1 is not a
      repeat of round N. Pass the prior findings and tell the reviewer to verify they are
      genuinely fixed — by observation, not by the implementer's report — to account for each one
      in `priorFindings`, and to check whether the fix invalidated a justification the implementer
      gave earlier. A correct fix can falsify the reasoning behind an earlier correct
      decision. Where a defect recurs, name the **pattern** rather than the instance, or the
      next correction lands at the same resolution and stays wrong.
   f. **Route `advisory` findings by their `disposition`.** The reviewer stamps each one
      `apply` / `surface` / `ticket`.
      - **`apply`** — send it to the implementer to fix **in this PR**, batched with any
        `blocker`/`major` findings from the same round so it costs no extra iteration. The
        worktree is open and the context is hot; that is the cheapest the fix will ever be.
        Mark clearly which findings are advisory so the implementer knows they do not gate the merge.
      - **`surface`** — do not send it and do not file it. Raise it with the user in your status
        line.
      - **`ticket`** — apply the four-gate test in (g). Expect this to be rare.

      **Advisory findings never gate the merge and never restart the round count.** If the
      implementer cannot land one cleanly, or applying it starts widening the diff beyond the
      ticket, drop it and say so.
   g. **File an `advisory` finding as a ticket only when its disposition is `ticket` — not at
      merge — and only when it cannot be applied in this PR,** for one of three reasons: it is
      blocked by an unlanded dependency, it lies outside the implementer's file scope, or it needs a
      design decision the user must make. **Record which of the three, and why, in the ticket
      body.** File it with the `create-ticket` skill, under the parent ticket's
      `project:<slug>` — that covers the label creation and the severity choice — using the
      finding's `suggestedTicket` title. Still put the reviewer's concrete cost and specific
      alternative in the **body**, because a ticket saying "simplify this" is noise.
      Consolidate findings that are genuinely one unit of work.

      **A new ticket is the exception, not the default.** File a standalone ticket only when
      ALL four hold: it is independently shippable, not contingent on a decision its parent
      ticket already owns; it is not already on record in the scope or body of any ticket,
      **open or closed**; it names a concrete defect, or is severity medium or higher; and it
      cannot be folded into the next queued ticket in the same area without distorting that
      ticket's scope. If any one fails, fold it forward — and let what the fold changes pick
      the destination: **anything that changes what *done* means for the receiving ticket
      goes in that ticket's body as an acceptance-criterion bullet** (as a dated "Scope
      amended" paragraph when the ticket already exists), because the reviewer measures
      criteria-fit against the body and cannot see comments. A comment carries only context
      that does not change the definition of done — a behavioural fix reported as "in ticket
      #N" while #N's body says nothing about it is work no downstream agent will ever be
      measured against, and the one check that would catch the omission is structurally
      unable to see it. Never sufficient on its
      own: that the reviewer supplied a `suggestedTicket` title, or that the finding is correct.
      A deferred option the parent ticket already named, a design refinement with no defect
      behind it, and a low-severity note you would not prioritise within 30 days are comments,
      not tickets. In your status line report filed and folded counts separately — a review
      that produces zero new tickets is a normal outcome, not a miss.

      Filing is triggered by an advisory **existing**, not by an outcome. A ticket that ends
      `blocked` still produces advisories worth having — often the most valuable output of the
      run, since they are independent of whatever blocked it. Do not defer them to a merge that
      may never come.

2. **On `approve` — record the verdict, merge, clean up, close.** Sub-steps 1–3 run in the
    ticket worktree, each with the worktree as its working directory (`cd <worktreePath> && …`
    per command, or `git -C <worktreePath>` for the git ones). Sub-step 4 runs in a throwaway
    detached worktree at the review SHA, never in the ticket worktree (§2.4). Pre-flight pins
    the coordinator to the main checkout (or the configured `coordinator_worktree`) for everything
    else, and the scoping matters in both directions: the gates only mean anything run inside
    a tree holding the PR's code, and the main checkout holds the user's uncommitted work
    instead.

    **At most one agent touches a ticket worktree at a time, and that includes you.** Your
    gates run only when no subagent is live in that worktree. A gate run mid-review lands as a
    dirty file inside the review and can regenerate derived artifacts in a tree another agent
    is reading. If something needs verifying mid-review, wait for the verdict or ask the
    reviewer to check it; it is already standing in the tree and the check is cheap.
    Restore discipline (scratchpad `cp`, the Restoration rule's verification) protects against
    *sequential* readers and says nothing about concurrent ones — exclusivity of access is the
    property, not correctness of the restore. That is why the mutation gate does not run in
    the ticket worktree at all.

    **Return to the main checkout — `dirname "$(git rev-parse --git-common-dir)"`, never a
    hardcoded path, or the configured `coordinator_worktree` — before sub-step 5, and stay
    there for the rest of the merge step.**
    Sub-step 5 is below; sub-steps 6 onward are section 3 below, whose item 2 has the implementer
    `git worktree remove --force` that directory; anything from 5 onward that is still sitting
    inside it — the `gh` calls at sub-step 5 below and section 3.4, the loop-back
    at section 3.6 — would be running in a working directory deleted out from under it.

    **A failure in any of sub-steps 1 through 4 routes the same way**, and none of them is a
    caveat to merge over. `SendMessage` the implementer with the failure as findings, exactly as
    step 1c does — the red `test_command` output, the lint or typecheck diagnostics, the
    failing stage-scoped gate, or the mutation that left the suite green. Then: it **consumes
    a step-1d review round** (the same three rounds, not a separate budget — a gate failing
    here means the PR passed a review it should not have, so it is not free — and posted as a
    round comment per §1d); when the implementer hands back, **re-review at step 1a**, since
    the diff changed and the verdict was rendered against a SHA no longer on the branch; then
    **re-run step 2 from sub-step 1**, not from the sub-step that failed, because a fix for
    one gate routinely breaks a gate that already passed in the same pass. At 3 unapproved
    rounds, go to code-coordinator.md §11 (blocked) with `review-loop-exhausted`, posting the gate failure alongside the
    last reviewer feedback.

    **When a ticket's criteria state measured numbers, validate your instrument against
    the stated *before* values before judging the *after* ones.** First reproduce the
    baseline with your own code. If it reproduces, the instrument is validated and the
    after-number is a real gate. If it does not, the after-number is not falsifiable by
    you — measure both arms with one consistent instrument of your own, judge the change,
    and report the non-reproducible baseline as a finding about the ticket rather than
    about the implementer. Watch the definition mismatch specifically: a stated standard deviation
    computed as population (ddof=0) against your sample-sd check differs in the third
    decimal — enough to flip a fixed-precision "reproduced?" verdict.

    1. **Full suite from the worktree**: `test_command`. Not the touched file — transitive
       breakage is common. Judge the run's own summary line — failures gate the merge, and
       its skips are whatever the suite gates on data a worktree does not carry — never
       against a pass count written down in prose, which goes stale silently. A
       collection-time failure in a ticket worktree whose errors all point at a path the main
       checkout has is a worktree setup artifact, not a finding — `docs/agent_invariants.md` →
       Project tool rules names the known cases (for example, a symlink that came back as an
       empty directory after a history rewrite); check it before routing anything to the
       implementer.

       **A suite failure in files the diff does not touch is evidence of a contaminated
       tree, not of a regression** — here, and in any baseline re-run at sub-step 4.
       Establish tree ownership (which agents and processes can write to it, and what
       `git status` and the diff against the review SHA say) before recording it against a
       PR.
    2. `lint_command`, then `typecheck_command`.
    3. **Any stage-scoped gates `docs/agent_invariants.md` → Gate commands lists**, when the
       ticket touched what they gate — **always scoped as that section specifies, never
       bare**. Read the target list from the invariants doc at run time rather than
       restating it here; it drifts as the project changes, and the same section carries any
       never-bare rule and the reason for it.

       If your gate run regenerates a tracked derived artifact behind you (a lock file, a
       build output the gate rewrites), restore that byproduct afterwards, by the mechanism
       `Project tool rules` gives — this run of yours is a gate, not the PR. That restore
       disposes of **your** byproduct and says nothing about whether the PR should carry a
       diff to that artifact; where the project has a rule for that, it is in `Project tool
       rules`. Check the PR against it here rather than assuming either answer.

       **Never pipe a gate through `head`/`tail`** — it masks the gate's exit status. Run
       gates bare or redirect to a scratchpad log and read that; check the gate's own exit
       status.
    4. **Mutation-gate the invariant, yourself, before merging.** For any ticket in the coordinator-dispatch-handback.md §2a
       category, break the guard it introduces and re-run the **full** suite. At least one test
       must fail, and it must be a test that names the behaviour rather than the implementation
       detail. A green suite against deliberately broken code means the invariant is
       unenforced, and that is `changes-requested`, routed to step 1c — not a caveat in the verdict
       comment. The candidate mutations come from `docs/agent_invariants.md` → Mutation shapes;
       read that section at run time rather than assuming you remember it, since it is added
       to over time. The sweep itself is scoped: it runs on full-tier tickets touching
       production or key-functionality code; eval tooling, scripts and experimental code take
       the proportionate rule in coordinator-dispatch-handback.md's tier block, not per-test proof.

       **Where it runs: a throwaway detached worktree at the review SHA, never the ticket
       worktree.** A mutation battery requires exclusive ownership of the tree it mutates, and
       a live ticket worktree cannot give that: a clean `git status` in the implementer's tree at
       time T says nothing about time T+1, and an implementer restoring what looks like stray
       contamination will overwrite a live mutant. Create the tree, mutate and run the suite
       there, and remove it when the sweep ends:
       ```sh
       git worktree add --detach "<scratchpad>/mut-<n>-<sha7>" <review-sha>
       # ... baseline run, mutants, restores, all inside that path ...
       git worktree remove --force "<scratchpad>/mut-<n>-<sha7>"
       ```
       Hand **that** path to any agent that will modify files for the sweep, yourself
       included. Run a baseline of the full suite there before the first mutant, so a red
       result is a mutant's and not the tree's. The sweep's worktree holds nothing anyone
       needs, so removing it loses nothing; leaving it behind leaves a stale tree that the
       next orphan-prune has to account for.

       **How you do this with no `Edit` and no `Write`.** You have neither, deliberately: the
       coordinator must never author code that ships. The gate does not need them. Perform the mutation
       through `Bash` — `sed -i`, or a `cp` of a copy you edited in the
       scratchpad — which is the same tool you run the gates with. This is not authoring code,
       because the mutation is temporary by construction: it lives in a tree nothing commits
       from, you take a scratchpad `cp` of the file *before* you touch it, and you restore
       from that copy within this same sub-step, verified per `docs/agent_invariants.md` →
       Restoration rule. Nothing you mutate reaches a commit, a push, or the merged PR. If a
       restore does not verify, stop and surface (code-coordinator.md §11) — never merge on a
       sweep whose tree you could not return to its prior state.

       Rules:
       - **Run it yourself.** An implementer or test-writer reporting its own mutation is reporting on
         its own work; a decorative guard is caught by an independent re-run, not a self-report.
       - **Mutate each limb separately** when a guard has more than one. A suite proving the
         arithmetic is right stays green if the branch that gates on it never consults the
         result — the original defect relocated one layer up.
       - **Try the shapes a future edit would actually take**, not just deleting the line.
         Reordering, a flipped comparison, a widened match, a shifted index, a leading comma,
         an added second key, a synonym — a guard that only rejects the exact mutation or
         spelling it was shown once is not a guard. The project's vocabulary is in
         `docs/agent_invariants.md` → Mutation shapes.
       - **An added key is not always additive.** Formats with override, fallback or
         precedence semantics let a **new** key supersede the pinned one while every existing
         assertion still reads green: a more specific directive in a security policy that
         overrides the general one the test pins, a fallback key the test never sets,
         later-wins config merges, `.gitignore` negation, a permissive row-level policy that
         unions with the restrictive one under test, a first-match-wins router gaining an
         earlier route. Check the format's spec for an override family and for
         case-sensitivity before certifying — a guard that pins the override key's lowercase
         spelling can be beaten by the same key in another case, if the format folds case.
         Add a supersession mutant and a case-variant mutant for any guard over such a format.
       - **Restore from a scratchpad copy with `cp`.** Never `git checkout --` (reverts to
         HEAD, silently destroying uncommitted work) and never `git stash` (repo-wide, not
         per-worktree, so it can apply another agent's snapshot). After each restore, verify
         per `docs/agent_invariants.md` → Restoration rule: a clean
         `git status --porcelain --ignore-submodules=all`, build and bytecode caches cleared,
         and the baseline re-run green. Byte-identical files alone are not enough — a
         same-size restore can leave a stale compiled cache that the next run loads instead
         of the source.
       - **Install the restore as a shell `trap ... EXIT` before applying the first mutation,
         and keep the per-iteration restore.** A harness whose restore sits at the end of a
         loop silently violates the restore rule the moment anything interrupts it — a tool
         timeout, a denial, a crash. The trap is the backstop, not the mechanism: time one
         full-suite probe first and budget the probes so a batch fits one Bash call's
         timeout, and split across calls rather than raising the timeout by reflex. The
         per-iteration `cp` restore stays because it also carries the Restoration-rule
         verification.
       - Record the mutation results with **raw counts**, because "verified" ages badly and a
         count can be re-run and compared. In the verdict comment that is one line inside the
         collapsed gate-evidence block — limbs and survivors, `9 limbs, 0 survivors` — never a
         per-limb table, which is the shape that buries the findings
         (§2.5). Keep the per-limb results in your status line to the
         user, where a survivor is `changes-requested` and needs the detail.


    5. **Post the reviewer verdict as a PR comment, before merging**:
       `gh pr comment <n> --body-file <file>`. Reviews live only in agent transcripts — without
       this the reasoning that gated the merge is unrecoverable. The issue close-out is not a
       substitute: it records the outcome, not the review.

       **The findings are the comment.** A reader opens it to see what was flagged, and
       anything they scroll past to reach the findings costs more than it carries. That is why
       what follows is a fixed structure and not a list of things to include: an inclusion list
       plus an instruction to be brief settles, every time, in favour of the list. Four
       sections, in this order, then one collapsed block, and nothing else.

       1. **Verdict.** The verdict, the round it came from, and the SHA it was rendered
          against. Then one line for whether anything blocked the merge and whether the PR is
          merged — an agent review is not merge authorization. If the verdict predates the
          merged SHA, one more sentence: say so, and name what you re-verified on the final
          SHA.
       2. **Findings — one table, every round, one row per finding.** Columns: the round and
          the SHA it was rendered against, the severity, the finding in one line with its
          `file:line`, and the resolution. A finding fixed in a later round keeps its row: it
          vanishes from a clean diff and is the most useful thing a later reader learns.
          **The resolution column names the outcome, and the list below enumerates outcomes
          rather than the categories that reach them** — one disposition or status can end in
          more than one, which is why a `ticket` advisory appears twice. Each entry says what
          its cell carries besides the word:
          **`fixed`** (in which SHA) · **`retracted`** (the reason it was withdrawn, and
          whether the PR body still cites the claim it knocks out — a reader who sees the
          citation without the retraction believes the change rests on something it does not) ·
          **`applied`** · **`declined`** (the implementer's reason) · **`surfaced`** ·
          **`filed as #<n>`** · **`folded into #<n>`** · **`open`**.
          **An outcome this list does not name is a stop-and-ask, never the nearest word.**
          Nothing checks the list for completeness, and reaching for the closest word is how the
          table comes to assert something that did not happen; one line to the user before you
          post costs less than a record that is wrong. `fixed` and `retracted` are different
          facts about the change and the table must never blur them: take both from the
          reviewer's `priorFindings` array, which states each earlier merge-gating finding's
          status on every re-review round. Do not derive either by diffing round N's findings
          against round N+1's.
          Advisory findings are rows in the same table, severity `advisory`, resolved by where
          their `disposition` actually ended: `applied` or `declined` for an `apply`;
          `surfaced` for one you raised with the user and did not file; and for a `ticket`,
          `filed as #<n>` or `folded into #<n>` according to which the four-gate test at
          §1g produced — it files or folds, and reports the two counts
          separately, so one word cannot carry both. An advisory the reviewer withdrew in a
          later round is `retracted`, from its `priorFindings` entry. Every disposition gets a
          row — a `surface` advisory is written down nowhere else (§1f leaves
          it in your status line, which the PR does not keep). One line under the table says an
          advisory never gates the merge.
          A `claimsVerified` entry that was `refuted` and bore on a finding gets a row too — a
          refutation is a finding. It inherits the round, the severity and the `file:line` of
          the finding it bears on, because `claimsVerified` carries none of the three; where the
          refuted claim is about the PR body rather than the diff, the `file:line` cell reads
          `PR body`. One that `held` gets no row; it is how the verdict was reached, not what
          was flagged.
       3. **Criteria** — one line, `<k> of <n> acceptance criteria met`, from the reviewer's
          `criteriaFit`. Name a bullet individually only when its status is not `met`. The met
          ones are already in the issue body.
       4. **Needs a human** — decisions this merge does not settle, and any invariant left
          without automated enforcement (coordinator-dispatch-handback.md §2a; and the scope-reduction
          case under "User-directed scope changes" in code-coordinator.md). Three lines at most, and omit the
          section entirely when there are none. It is not a place for caveats about the gates.

       Then one collapsed `<details><summary>Gate evidence</summary>` block, last: one line per
       gate saying whether it was green, the mutation sweep as limbs and survivors
       (`<n> limbs, <m> survivors` — a raw count, re-runnable, where "verified" would age badly),
       and any gate you did not run with the reason you did not — including a gate left blank
       in `docs/agent_invariants.md` → Gate commands. It is collapsed because it serves the
       six-month reader rather than the person deciding whether to merge.

       **Not in the comment at all**, because each is re-runnable at the merge SHA by whoever
       wants it and none of it is what the reader came for: test pass/skip totals, lint and
       typecheck output, the per-limb mutation table, the claim-by-claim `claimsVerified`
       list, the bullet-by-bullet `criteriaFit` list, and any round-by-round account of how
       the verdict was reached. You still judge the gates on their own summary lines
       (§2.1–2.3); you just do not transcribe them here.

       **Compose `<file>` with `printf`, not a heredoc** — the permission classifier refuses
       heredocs and the run stalls. Having no `Write` tool does not block this: the file is the
       comment body, it lives outside the repo, and it is never committed. One command,
       `printf '%s\n' '<line>' '<line>' … > <scratchpad>/verdict-<n>.md`, then
       `gh pr comment <n> --body-file` it. Two shapes to keep out of those single-quoted
       arguments: a line starting with `#`, which the classifier refuses (use `**bold**` for
       headings — markdown needs nothing else here), and a straight apostrophe, which ends the
       argument (write `’`). The same applies to the close-out file at section 3.4 and the
       round comments at §1d.

## 3 — Merge, cleanup and close-out

Expands Delegation-loop step 10 of `code-coordinator.md`, sub-steps 6–11 there, numbered
1–6 here. Sub-steps 1–5 (gates, mutation gate, verdict comment) are section 2 above.
Every reference out of this file names its file.

1. **Merge**: `gh pr merge <prUrl>` with the flag for `merge_strategy`
   (`docs/agent_invariants.md` → Project config). `gh pr merge` has no `--base` flag — the
   base is already fixed where it belongs, at `gh pr create --base <base_branch>` in
   `code-implementer.md`. Do not force-merge if checks are failing, and read the checks'
   conclusion from GitHub for the exact head SHA on this wake (`gh pr checks <n>`,
   `gh run list --commit <sha>`) — never infer it from a watcher having fired
   (code-coordinator.md, Constraints). Compose the merge message per `commit_convention`
   against the PR's diff — never accept the default, which concatenates every branch commit
   and blows past any length ceiling the convention sets on any multi-commit ticket. The
   repair for an over-long merge message is an amend plus a force-push of `<base_branch>`,
   which needs the user's explicit confirmation every time; preventing it at compose time is
   the only cheap point. **Do not pass `--delete-branch`** — it reports success and can leave
   the remote branch in place. Delete explicitly and verify:
   ```sh
   git push origin --delete <branch>
   git ls-remote --heads origin refs/heads/<branch>   # empty = gone
   ```
   Skipping the verify is how stale ticket branches accumulate and bury the orphan-prune
   signal.
2. `SendMessage` the implementer "merged — clean up"; it removes its worktree + branch and
   returns `{ok: true, merged: true, prUrl, routing}`.
3. Advisory findings were already filed at section 1g, as each review returned them. Nothing
   to do here beyond confirming none were missed.
4. **Close the issue. Post the close-out as a separate `gh issue comment <n> --body-file <file>`,
   then verify it landed** (`gh issue view <n> --comments --json comments -q '.comments[-1].body' | head -5`).
   Do **not** rely on `gh issue close --comment`: when the merged PR's merge title contains
   `Closes #<n>`, the merge auto-closes the issue first and the subsequent close command
   discards the comment while still exiting 0. Remove `status:in-progress`, add
   `status:done`.

   **A batch-deferred reconciliation is the user's, not yours.** When the dispatch deferred
   a batch-level regeneration (`docs/agent_invariants.md` → Project tool rules), the
   close-out states the deferral as a fact of record and stops there: do not raise it as an
   outstanding action, do not ask whether to run it, and do not carry it forward into the
   next ticket's report as an open obligation. A reconciliation that requires paid or
   credentialed runs cannot be run by an agent at all without the user's explicit say-so
   every time. If some other work is genuinely blocked on the reconciliation, say what is
   blocked, not that the batch is incomplete.
5. Print: `✓ #<n> <title> — PR <prUrl> (reviewer approved in <N> iterations)`.
6. **Loop back to the Delegation loop's step 2** in `code-coordinator.md` for the next
   ticket — in the same turn (code-coordinator.md, "Your turn ends when you return").
