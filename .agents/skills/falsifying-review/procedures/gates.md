# Reviewer gates and invariant-scan

Standalone: the reviewer's diff/issue fetch, the gates run from the implementer's worktree, and
the invariant-scan. Numbered 1–4. Every reference out of this file names its file.

1. **Fetch the diff** with `gh pr diff <n>`. This command may be run from the implementer's
   worktree or from the main checkout — it asks GitHub, so the diff is identical either
   way. That equivalence covers the diff and nothing else; see section 3.

2. **Fetch the issue body** with `gh issue view <issue-number>`. Extract the **Acceptance
   criteria** section. This is your definition of done.

3. **Run the gates, from the implementer's worktree.** `cd <worktreePath>` first — the path the
   caller gave you — and run every gate below there. A gate is not like the diff: it
   observes whatever tree it is standing in. The main checkout carries the user's own
   uncommitted edits, so a pass or a failure there is evidence about the user's working tree,
   not about this PR, in either direction. A failure at any step is an automatic
   `changes-requested`. Do not proceed to bug/invariant review until the gate is clean — it
   wastes time reviewing code that is about to be recommitted.

   Read each command from `docs/agent_invariants.md` → Gate commands at run time; never
   carry one from memory or from an earlier ticket.

   - `lint_command` — a failure is an automatic `changes-requested`.
   - `typecheck_command` — a type error in a changed file is a `blocker`.
   - `format_command`, in check mode, against the changed files only (the file list from
     the diff) — never against the whole repository. If the formatter has no check mode,
     run it in the throwaway detached worktree (`code-quality-reviewer.md`, Constraints)
     and treat any diff it produces as the finding; never let it write into the implementer's
     worktree.
   - `test_command` — the full suite; a failure is a `blocker`.
   - `build_command` — a build failure is a `blocker`.
   - **Any stage-scoped gates `Gate commands` lists**, when the diff touches what that
     section says triggers them. Never run one bare, and never narrower than the section's
     target list: a target outside the chain you happened to pick is not reachable from it,
     so a one-target run cannot fail on it. Read the list from the section at run time — it
     drifts when the project changes.

   **A blank gate is skipped and said to be skipped.** Record it in `summary` and leave it
   out of `checksRun`; never report a gate you did not run as passing, and never go looking
   for a tool the project does not configure.

   **Never pipe a gate through `head`/`tail`.** A pipeline reports the exit status of its
   last command, so a failing gate piped into `tail` reads as success. Run gates bare or
   redirect to a log file and read that; check the gate's own exit status.

   **A derived artifact a gate regenerates.** If a gate you ran in this review rewrote a
   tracked derived artifact (a lockfile or generated output the build regenerates), restore
   that file afterwards — and only then, for a reason that does not generalise to the
   implementer: you are disposing of what *your* gate run dirtied, and you author no commit here,
   so restoring is how you leave the worktree as you found it. When no gate of yours touched
   it there is nothing of yours to dispose of: leave it exactly as the implementer left it,
   because its state is the implementer's own gate decision, to be judged and never overwritten.
   Whether the *PR* should carry a diff to that artifact is a separate question with two
   answers — commit when the PR changed what the artifact is derived from, restore when a
   gate run merely touched the file — and any project rule that refines it lives in
   `docs/agent_invariants.md` → Project tool rules. Judge the PR's choice against that; do
   not read the implementer's restore as an error, or its committed artifact as an unrelated
   file swept into the diff.

   Inside the implementer's worktree, some git commands may need extra flags or emit errors that
   the worktree layout makes expected; `Project tool rules` names them. An error that section
   names as expected is not a finding.

4. **Invariant-scan the diff (merge-gating).** This is the reason this agent exists in
   this project rather than a generic reviewer. Read `docs/agent_invariants.md` and check
   the diff against every condition under `## Blocking conditions`. A hit is a `blocker`
   with `category: "invariant"`, citing `file:line` and quoting the condition's bold lead
   phrase.

   State the reason to yourself before you start, because it changes how this axis reads:
   these do not crash, do not fail lint, and do not fail an existing test. They produce
   plausible output that is wrong. A hardcoded constant where the source of truth should be
   read, a substituted algorithm with the same signature, a reordered sequence that
   downstream code indexes positionally — a reviewer scanning for unhandled exceptions,
   off-by-one errors, and unclosed file handles will pass every one of them.

   Apply the same unprotected-invariant test as `reviewer-review.md` section 2(d),
   sharpened for this codebase: can you describe a plausible simplifying edit that breaks
   the invariant while leaving the whole suite green? For a guard here, try the mutation
   shapes in `docs/agent_invariants.md` → Mutation shapes as candidate edits. Include the
   supersession shape: an added key is not always additive — where the guarded format has
   override, fallback, or precedence semantics, a **new** key can supersede the pinned one
   while every existing assertion still reads green. Check the format's spec for an
   override family and for case-sensitivity before certifying — a more specific directive
   (a CSP `style-src-elem` beside a guarded `style-src`) can beat the guard with the suite
   green, and a differently-cased spelling of it can beat the fix. The same shape appears
   in fallback directives, later-wins config merges, ignore-file negation, permissive
   policy union, and any first-match-wins router. If one of these edits would leave the
   suite green, that is a `blocker` — the criterion is unmet, because the behaviour the PR
   promises is unprotected. Never sufficient to downgrade it: that the suite passes, that
   the implementer says it is covered, or that a follow-up ticket could carry it. Run any such
   edit only in the throwaway detached worktree (`code-quality-reviewer.md`, Constraints).
