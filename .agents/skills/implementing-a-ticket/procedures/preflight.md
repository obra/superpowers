# Implementer start-of-run: tool discovery, plan, fresh context, worktree

Standalone. Expands `code-implementer.md` Workflow Steps 0, 2 and 3 (numbered 1–3 here) and
Step 1 (numbered 4–8 here): the first-turn tool self-test, the plan checklist, the
fresh-context reads, then the ticket worktree's pre-flight and setup plus the discipline for
this repo's measured git-in-worktree facts. Every reference out of this file names its file. The repo
root is resolved as `dirname "$(git rev-parse --git-common-dir)"`, never hardcoded. Project
facts (`base_branch`, `ticket_worktree_pattern`, `secrets_files`, and any per-worktree setup
or git quirk) live in `docs/agent_invariants.md` → Project config and Project tool rules; the
examples below use `./tkt-<n>-<slug>/` for the worktree path.

1. **Self-test every declared tool in your first turn.** Treat every declared tool as unconfirmed until you have called it. Self-test in your
   first turn:

   - **Grep / Glob** — try a tiny invocation. If it errors, fall back to `Bash` with `grep`,
     `find`, `ls` for fresh-context reads.
   - **TaskCreate** — try creating a 1-item task. If it errors, track progress with numbered
     steps in your own text output.
   - **SendMessage** — probe for *absence* only. A tool that was not granted fails with an
     explicit `No such tool available`, distinguishable from a delivery error, so a dummy
     recipient settles absence without needing a real address. It cannot settle presence, and
     neither can a real send: success reported is not arrival confirmed. Never read a delivery
     error as absence. The return is unconditional either way; see
     `implementer-return-shapes.md` section 2.

2. **Load the plan into the task tool.**
   ```
   1. Skim the worktree's CLAUDE.md and docs/agent_invariants.md
   2. Fresh context on relevant files (Grep/Glob/Read from the worktree — no sub-agent)
   3. Read the issue body and extract acceptance criteria
   4. Implement the smallest change that satisfies all criteria
   5. format_command on your changed files only; lint_command; typecheck_command
   6. test_command (full suite), build_command, and any stage-scoped gates Gate commands lists
      if the ticket touches what they cover
   7. Decide any derived artifact a gate rewrote: commit it or restore it (`code-implementer.md` Step 6) — not a
      fixed cleanup step
   8. Invariant-scan the diff against docs/agent_invariants.md → Blocking conditions
   9. Commit with an explicit pathspec, push, open PR
   10. Self-review (lint-grade): gates, criteria-fit, bug-scan, security-scan, invariant-scan
   11. Hand back to coordinator — coordinator runs the independent code-quality-reviewer (and unit-test-writer
       if the ticket establishes an invariant)
   12. On coordinator follow-up: apply reviewer findings & re-push, or clean up after the coordinator merges
   ```

   Check items off as you complete them. This gives the coordinator a visible progress signal mid-ticket.

3. **Get fresh context by direct reads.** Before editing, get a current view of the files you'll touch. The codebase evolves as earlier
   tickets land, so your cached view is stale. You **cannot spawn an Explore sub-agent** (no
   `Task`/`Agent` tool — `code-implementer.md`, Constraints), so read directly:

   - Work from the **worktree path** (`./tkt-<n>-<slug>/`), not the main checkout.
   - Use `Grep`/`Glob` to locate, then `Read` the relevant files and any related modules. (Fall
     back to `Bash` `grep`/`find` if `Grep`/`Glob` are unavailable per step 1 above.)
   - Also skim the worktree's own `CLAUDE.md` — it is the index of this project's architecture
     and load-bearing invariants. Don't restate it; know where it lives so a change you're about
     to make doesn't quietly violate it.
   - Note the file paths and line numbers you'll change.

   This is the main drift-protection mechanism. Skipping it is the #1 cause of stale-context bugs.

4. **Run this exact sequence:**

   ```sh
   cd "$(dirname "$(git rev-parse --git-common-dir)")"
   gh auth status
   git fetch origin --prune
   git cat-file -e <pinned-base-sha>^{commit}
   git worktree list | grep -q tkt-<n>-<slug> && echo "COLLISION: worktree already exists" || true
   git worktree add ./tkt-<n>-<slug>/ -b tkt-<n>-<slug> <pinned-base-sha>
   cd ./tkt-<n>-<slug>
   ```

   Then run any per-worktree setup `Project tool rules` names (linking a resource the main
   checkout holds that a fresh worktree lacks, installing the worktree's dependencies — a
   fresh worktree has none).

   Branch from the **pinned base SHA** the dispatch carried, never from local
   `<base_branch>`: the main checkout's local copy may carry the user's unpushed work or lag
   the remote. If the dispatch carried no SHA, branch from `origin/<base_branch>` after the
   fetch and name the SHA you used in the hand-back `summary`.

   (`grep -q` with no match exits 1, which is the normal success path here — no collision. The
   `|| true` keeps that from reading as a failed command if you're running these sequentially.)

   If `gh auth status` fails, return the Blocked shape (see `implementer-return-shapes.md`) with
   `reason: "gh-not-authenticated"`. If `git fetch` fails, or the pinned SHA does not resolve
   to a commit after it, return it with `reason: "base-unreachable"`. If the collision check
   above prints `COLLISION` and the worktree isn't yours to reuse, return it with
   `reason: "worktree-already-exists"` and `worktreePath: "./tkt-<n>-<slug>"`.

5. **Why the per-worktree setup step exists.** `git worktree add` checks out tracked files
   only. Anything the main checkout holds untracked — a linked resource, an installed
   dependency tree, a local config the build reads — is absent from a fresh worktree, and a
   gate that needs it fails in a way that looks like a code regression. `Project tool rules`
   names what this repo needs; run exactly that, and do not copy any `secrets_files` path in
   unless the ticket requires it (section 1 of `implementer-gate-commit.md` covers what a copied
   env file can arm).

6. **Measured git facts for this repo** live in `Project tool rules` — quote them, don't
   paraphrase them into something softer, and **do not generalise them**. An enumeration
   restated as a rule is a new, unmeasured claim wearing the authority of a measured one.

   Where a repo's git behaviour in a worktree is irregular (some `status`/`diff`/`fetch`
   invocations hard-erroring while others with a narrower pathspec succeed), which
   invocations fire is not predictable from a rule, so do not carry one. What is on record
   is the enumeration, and nothing beyond it. Do not infer a new rule from a measured list,
   and do not repair a measured list by writing a tighter generalisation — that is precisely
   the failure an enumeration replaces. If `Project tool rules` names a flag every
   status/diff must carry, pass it on every one rather than reasoning about which form is
   safe, and do not "fix" such an error with `skip-worktree`, `assume-unchanged`, or by
   staging the path.

   `git fetch` has no pathspec form — its mitigation is location, not flags. Run any
   mid-ticket fetch from the main checkout
   (`git -C "$(dirname "$(git rev-parse --git-common-dir)")" fetch origin --prune`);
   worktrees share refs with the main checkout, so a fetch there moves this worktree's
   `origin/*` too.

7. **After a history rewrite (`rebase`, `reset --hard`), the per-worktree setup can
   degrade** — a link section 1 created can come back as an empty directory, a generated
   file can vanish. The suite then dies at **collection** time, fast, which looks exactly
   like a code regression and is pure environment. Assert the setup state specifically after
   any history operation rather than trusting a green run made before it (for a link:
   `ls -ld <path>` must show a link, not a directory). If it degraded, recreate it with the
   section 1 setup step.

8. **Standing rules that ride with the worktree:**

   - **Never stage a path `Project tool rules` says must never be staged**, and never run a
     command it says must not run inside a worktree.
   - **Therefore: never `git add -A`, `git add .`, or `git commit -a`.** Stage explicit paths
     only, always. This is also a standing repo rule for an unrelated reason — the paths
     `secrets_files` names may live in this tree, and `-A`/`.` would be capable of staging
     both those and anything a per-worktree setup step placed.
   - **Do not require the main checkout to be clean.** The user works there and routinely has
     uncommitted edits. Never run `git status` against the main checkout as a gate, never
     stash, never `git checkout` anything in it. If something there looks surprising, report
     it as a `deviation` in your return shape and do not act on it.
   - **A gate can both dirty and *stage* a derived artifact.** Some tools stage files they
     regenerate (an autostage setting), so the file lands in git's index with no explicit
     `git add` — a later plain `git commit` would pick it up even though you never staged
     it. **What happens to it next is a decision, not a fixed cleanup step**: commit it when
     your PR changed what it derives from, restore it when a gate run merely touched the
     file. `implementer-gate-commit.md` section 1 carries both commands and the named exception
     that can override them; which artifacts this applies to, and the discriminator for a
     case neither branch names exactly, live in `Project tool rules`. When you do restore,
     name `HEAD`: plain `git checkout -- <file>` is **not** sufficient — it restores the
     working tree from the still-modified index, which does not match `HEAD`.
   - **A stage-scoped gate may be unable to run in a ticket worktree.** When a full,
     unscoped run needs a resource absent from any fresh checkout, always scope the gate
     as `Gate commands` lists it — and to the whole target list, because one target is a
     scope rather than the graph and reaches nothing outside its own chain. Do not work
     around a missing resource by supplying it. When the gate cannot run at all, report
     whatever non-executing check `Gate commands` names (a dry run, a status query that
     resolves declared dependencies without executing or writing anything) instead, and say
     the gate itself did not run.
