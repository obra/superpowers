# Spec-Derived E2E Verification

Live end-to-end evidence for the branch: scenario cards derived from the
governing spec, run against the built code. Results land before
superpowers:finishing-a-development-branch, so "ready to merge" includes
live-scenario evidence, not just review verdicts.

## Finding the governing spec

Open the spec the plan names. If the plan names none, check the repo's spec
directory (e.g. `docs/superpowers/specs/`) for specs governing the code the
plan touches.

- Spec with an "E2E scenario cards" section: cards derive from the table's
  falsification lines verbatim.
- Spec without the section: the bootstrap path in
  superpowers:agentic-end-to-end-testing's authoring-cards-from-a-spec.md
  backports a table from the spec's requirements (flagged for human review).
- No governing spec at all: there is nothing to derive cards from. Tell your
  human partner and proceed to finishing — or they can write a spec first
  and re-run the offer.

## Procedure

Use superpowers:agentic-end-to-end-testing:

1. Require a clean working tree (`git status --porcelain` is empty) before
   dispatching the card author. Record `E2E_BASE=$(git rev-parse HEAD)` before
   any card or bootstrap-spec work.
2. Dispatch a card-author subagent per its authoring-cards-from-a-spec.md. Ask
   the author to report every authored card path and, on the bootstrap path,
   the governing spec path it changed.
3. Run `scripts/check-cards-against-spec` yourself on the author's output —
   self-attestation is not the gate. Preserve the complete checker output and
   compare the resulting paths with the author's report.
4. If the author changed the governing spec, present the spec-only diff to
   your human partner and wait for explicit approval before continuing. This
   approval gate is conditional: a pre-locked, already-approved scenario table
   does not require a new approval.
5. Dispatch a runner subagent per its runner-prompt.md against the built branch
   and the checked cards while those artifacts remain uncommitted. Retain the
   runner report, ledger, and evidence; a successful card is not yet a shipped
   artifact.
6. After every card passes, stage only the card paths reported by the author
   plus the approved bootstrap spec path, if any. Do not stage product code or
   unrelated evidence. Commit the unchanged successful artifacts with:

   ```text
   test(e2e): add spec-derived scenario cards
   ```

7. Dispatch a focused artifact reviewer for that commit, using the governing
   spec, author report, independent checker output, and runner evidence. The
   reviewer checks the exact artifact paths, their unchanged spec assertions,
   and the evidence for every passing card.
8. If the focused review requires an artifact change, dispatch one separate
   artifact-fix subagent with the review findings. The original card author and
   focused reviewer remain finders, not fixers. Rerun the checker and every
   affected card, stage only the corrected artifact paths (and approved
   bootstrap spec path, if applicable), commit them with the same message, and
   repeat the focused artifact review over the new commit range.
9. Before invoking superpowers:finishing-a-development-branch, require empty
   `git status --porcelain` output and verify every authored path is tracked in
   `HEAD` with `git ls-files --error-unmatch -- "$path"`. Report `E2E_BASE`,
   the artifact commit range, reviewer verdict, and exact durable paths.

## Failure handling

Card FAILs are findings: dispatch ONE fix subagent with the complete list,
then re-run the failed cards. The card author never fixes. Fix-wave commits
land after the final whole-branch review, so give the fix diff its own
task-review gate before finishing — a green re-run alone does not ship
unreviewed changes.
