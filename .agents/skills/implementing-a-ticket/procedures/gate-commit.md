# Implementer gate, derived-artifact decision, commit and PR

Standalone: the code implementer's gate run, derived-artifact decision, and commit/push/PR
sequence. Numbered 1 (gate) and 2 (commit/push/PR). Every reference out of this file
names its file. Gate commands are the keys in `docs/agent_invariants.md` → Gate commands;
a blank key is a skipped gate, and a skipped gate is **said** to be skipped in the hand-back,
never omitted silently.

## 1 — Gate

```sh
<format_command> <your changed files>  # changed files only — never a repo-wide format
<lint_command>                         # must be clean before pushing
<typecheck_command>
<test_command>                         # full suite. Never just the touched file.
<build_command>
# plus any stage-scoped gates Gate commands lists, only if the ticket touches what they
# cover. Always scoped as listed, never bare — read the target list from the invariants
# doc at run time rather than restating it here; it drifts when the project changes.
```

**Format only the files you changed.** Run `format_command` with an explicit list of your
changed paths, never a repo-wide format: a repository routinely carries standing formatter
drift in files unrelated to any ticket, and a repo-wide run sweeps them into your PR. Commit
any reformatting on the same branch (a separate commit is fine; do not amend the
implementation commit). Then confirm the file set with the three-dot branch diff in
section 2 before pushing — an unexpected file there is formatter sweep, not your work;
revert it. For the same reason, a repo-wide format *check* is not a usable gate when the
repo carries standing drift: check your changed files. If `format_command` is blank, the
format gate is skipped — say so.

**A copied env file can arm a hook for every later command.** When a ticket needs a real
`secrets_files` env file copied into the worktree, a loader that reads it at import time
applies its settings to every command run in the tree — gates included. An analytics or
tracing hook armed that way can fail every gate with an import or connection error whose
packages were never installed in the worktree. The failure lands on the first command after
the copy, looking like breakage your change caused. Where the project's loader gives shell
environment precedence over the file, exporting the disabling variable in the shell is the
one-line fix; `Project tool rules` names the hook and its switch.

**Never pipe a gate through `head`/`tail`.** Run gates bare; if output is long, redirect
to a log (`> <scratch>/<tkt>-<gate>.log 2>&1`), then read the file and check the gate's own
exit status, never the reader's.

If a gate rewrote a derived artifact the build regenerates (a pipeline lockfile, a generated
snapshot — `Project tool rules` names which), dispose of it next. **This is a decision about
what your PR did, not a cleanup step that always runs the same way** — run exactly one of
these, never both:

```sh
git add <artifact>                   # your PR changed what it derives from
git checkout HEAD -- <artifact>      # it did not; a gate run merely touched the file
```

If you did not run the gate there may be nothing to dispose of — confirm rather than assume,
with `git status --porcelain -- <artifact>`.

**The named exception, active whenever the coordinator's dispatch says artifact regeneration is
batch-deferred: restore in every case** — including a PR that did change what it derives
from. Concurrent PRs touching the same artifact would otherwise collide on a file no human
can meaningfully merge, so the batch defers instead and one regeneration pass reconciles
`<base_branch>` after it lands. Deferring is not skipping, and the pass is still owed. If a
dispatch says nothing either way, decide from the two branches above and state in the
hand-back which you took and why, so the coordinator can correct it in one round rather than
discovering it after merge.

The rule for each artifact, and what to do when neither sentence names your case exactly:
`docs/agent_invariants.md` → Project tool rules. Read it rather than assuming a branch — an
unconditional restore can leave `<base_branch>` carrying a declaration naming a dependency
its regenerated artifact does not.

If `test_command` fails and you can't fix it within the ticket's scope, return the Blocked
shape (see `implementer-return-shapes.md`) with `reason: "tests-failed"`. If any other gate fails
and the failure isn't something you introduced and can fix, return the Blocked shape with
`reason: "gate-failed"`, naming the gate. Do not push a red gate and hope the reviewer
doesn't notice.

Do not add a gate the project lacks — that's out of scope for any ticket that doesn't say
so explicitly. A warning the test configuration escalates to an error, surfacing as a test
failure, is a real defect to fix, never something to suppress: the escalation is
deliberate.

## 2 — Commit, push, open PR

Commit with an **explicit pathspec**, not a bare `git commit`. A tool with an autostage
setting can leave a derived artifact (or other paths) staged behind your back even after
section 1's decision, and a bare `git commit` would sweep in whatever's sitting in the
index. The pathspec form implies `--only`: it commits just the paths you name and leaves the
rest of the index alone. If section 1's decision was to **commit** the artifact, it is one
of the paths you name, like any other — the pathspec form will not carry it for you.

```sh
git add <explicit paths>                                   # never -A, never .
git commit -m "<message per commit_convention>" -- <explicit paths>
git show --stat HEAD                                       # verify: only what you intended
git push -u origin tkt-<n>-<slug>
gh pr create --base <base_branch> --head tkt-<n>-<slug> \
  --title "Closes #<n>: <short summary>" \
  --body-file <file>                                       # body from write-pr-description
```

The commit message follows `commit_convention` (`docs/agent_invariants.md` → Project
config).

Note the option order: `-m "..."` comes **before** `--`. `git commit -- <path> -m "..."` is
invalid — `git` reads everything after `--` as a pathspec, so it treats `-m` and your message
as filenames and fails with `pathspec '-m' did not match any file(s) known to git`. That
exact failure is easy to hit live; get the order right the first time.

**Verify `git show --stat HEAD` before pushing.** If it lists a file you didn't mean to
touch — an artifact section 1's decision said to restore, or anything else — stop, fix the
index, and redo the commit rather than pushing it. Check the converse too: if that decision
was to commit the artifact, it must be in this list.

**After any pathspec-limited commit, account for every entry still staged.** The pathspec
form deliberately leaves the rest of the index alone — which strands the halves of your
own change it did not name: a `git mv` commits the new path and leaves the old one's
deletion staged, and an edited file missing from the pathspec list stays in the working
tree. Run `git status --porcelain` immediately after committing and classify each remaining
staged or modified entry: not-yours (leave it alone), or a stranded half of your change
(name its path in a follow-up commit before pushing). A rename counts as both halves. A
half-relocation that ships is invisible to every gate — the branch carries the old and new
directory side by side, both live.

**Also verify the cumulative branch diff before every push, not just the newest commit.**
`git show --stat HEAD` sees one commit; from round 2 on, each commit can look clean while
the branch as a whole carries a stray an earlier round introduced:

```sh
git -C "$(dirname "$(git rev-parse --git-common-dir)")" fetch origin --prune
git diff --name-only origin/<base_branch>...HEAD
```

Confirm that list equals the ticket's intended file set — every push, not only the first.
(If `Project tool rules` names a flag every status/diff must carry, add it here too.)

**Three dots, not two — this matters whenever parallel lanes land PRs while you work.**
`origin/<base_branch>` is a remote-tracking ref shared across every worktree, and it moves
whenever *any* lane merges. A two-dot `origin/<base_branch>..HEAD` diff then lists other
lanes' landed files as reverse changes your branch lacks. That stale-looking listing is not
contamination. Anchor to the merge-base with the three-dot form, or cross-check
`gh pr view <n> --json files` (GitHub computes it against the true merge-base), before
reacting to an unexpected entry.

If `gh pr create` fails, surface as a blocker (`pr-create-failed`) — do not retry indefinitely.

**The PR description comes from the `write-pr-description` skill.** Invoke it rather than
composing a body ad hoc: it owns the closing reference at the top of the body, the section
schema, what a body never carries, and the rule that a review round amends the body in place
instead of appending to it. That skill is the one definition; this section deliberately
carries no second copy for it to drift against. The skill governs the body only — the
`Closes #<n>` subject on the PR title is this section's, and stays.
