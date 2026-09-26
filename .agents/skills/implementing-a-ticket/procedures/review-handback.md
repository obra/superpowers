# Implementer self-review, hand-back and follow-ups

Standalone: the code implementer's lint-grade self-review, hand-back delivery, and
follow-up rounds. Numbered 1 (self-review and hand-back) and 2 (coordinator follow-ups). Every
reference out of this file names its file.

## 1 — Self-review and hand back to the coordinator

You **cannot spawn the `code-quality-reviewer`** — no `Task`/`Agent` tool by design.
Your job here is a **lint-grade self-review**, then hand the
PR to the coordinator. Be honest: your self-review is lint-grade, NOT the independent review.

1. **Fetch the diff:** `gh pr diff tkt-<n>-<slug>`. `gh pr diff` takes a PR number, URL, or
   branch — not the GitHub issue number. The branch name is what you reliably know, so use it.
2. **Read the issue body** for acceptance criteria.
3. **Gate check** on the changed files: re-confirm `format_command` (on your changed files),
   `lint_command`, `typecheck_command`, `test_command` and `build_command` are clean
   (`docs/agent_invariants.md` → Gate commands; name any blank gate as skipped), and that
   any stage-scoped gate the ticket touched is clean on all of its targets with any derived
   artifact disposed of per the decision in `implementer-gate-commit.md` section 1 — and say in
   the hand-back which branch you took.
4. **Invariant-scan** — confirm the invariant-scan pass is complete and its
   findings are reflected in your `summary`.
5. **Scan the diff for**: (a) obvious bugs (off-by-one, wrong-sign comparison, unguarded
   division, missing raise), (b) security smells (unsanitized input, hard-coded secrets,
   missing auth checks), (c) alignment with every acceptance-criteria bullet, (d) anything
   under `docs/agent_invariants.md` → Blocking conditions you haven't already ruled out.
6. Fix anything you find, re-run the gate, commit (the explicit-pathspec form in
   `implementer-gate-commit.md` section 2), push.

Then deliver the **hand-back** shape on both channels — `SendMessage` to the coordinator's address if
you were given one, and return it as your result in every case (the full delivery rules and
the shape itself live in `implementer-return-shapes.md`). Do **not** merge — the coordinator merges after
its independent reviewer approves.

## 2 — Respond to coordinator follow-ups

After you hand back, your worktree and context stay live. The coordinator resumes you (via its own
message-sending mechanism — you don't call anything to initiate this, you just continue the
conversation) with one of two follow-ups:

- **"Apply these findings"**: address each finding the coordinator sends (file:line + description),
  re-run the gate (`implementer-gate-commit.md` section 1), commit with an explicit pathspec,
  push, redo the section-1 self-review above, and return the hand-back shape again with
  `iteration: N`. The coordinator re-reviews. **The coordinator enforces the max-round limit** — you just
  apply what's sent.

  A round can carry two kinds of finding, and the coordinator marks which is which:

  - **`blocker` / `major`** — merge-gating, from a `changes-requested` verdict. Apply them.
  - **`advisory`, dispositioned `apply`** — design, simplification or general test-coverage
    findings. `apply` is the reviewer's *default* disposition for these, and the coordinator batches
    them into the same round as any `blocker`/`major` so they cost no extra iteration. Apply
    them too. They do **not** gate the merge and they do **not** restart the round count, so
    a round carrying only advisory findings still leaves the merge on track. Advisory findings
    the reviewer dispositioned `surface` or `ticket` are not routed to you at all.

  **You may decline an advisory `apply`.** If one will not land cleanly, or applying it starts
  widening the diff beyond the ticket, drop it and say which and why in one line of the
  hand-back `summary`. That escape hatch is deliberate and `code-quality-reviewer.md` states
  it from the other side. It does not extend to a `blocker` or a `major`; those you fix or
  you block on.

  If a fix round leaves you genuinely stuck — the fix needs information the findings don't
  carry, or the gate goes red for a reason outside the ticket — return the **Blocked** shape
  instead of the hand-back, with the usual `reason` (`implementer-return-shapes.md`). The coordinator
  treats that as a stop-and-surface, not as another round. Do not push a red gate to keep
  the round moving.
- **"Merged — clean up"** (verdict was `approve` and the coordinator merged): from the main checkout,
  remove the worktree and branch, then return the Merged shape (`implementer-return-shapes.md`):
  ```sh
  cd "$(dirname "$(git rev-parse --git-common-dir)")"
  git worktree remove ./tkt-<n>-<slug>
  git branch -d tkt-<n>-<slug>   # or -D if needed
  ```
  If the remove refuses because the worktree holds untracked per-worktree setup (a linked
  resource, installed dependencies — `implementer-preflight.md` section 5), confirm
  `git -C ./tkt-<n>-<slug> status --porcelain` shows nothing of yours, then re-run it with
  `--force`. `Project tool rules` may name a worktree layout for which `--force` is the only
  invocation that works; follow it.

If the coordinator reports the review loop is exhausted, it marks the issue blocked — do not keep
iterating on your own.
