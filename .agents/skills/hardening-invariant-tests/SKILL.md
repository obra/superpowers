---
name: hardening-invariant-tests
description: Use after an implementer has opened a PR for a ticket that adds or repairs an invariant — a guard, a raise, a clamp, a lookup-table check, an ordering constraint. Harden the tests so that breaking the invariant turns the suite red, then hand back before the reviewer runs. Skipped for pure refactors, docs and config. Always invoked with the PR number, the worktree path, and the invariant the ticket establishes.
---

# Hardening invariant tests

**Announce:** "I'm using the hardening-invariant-tests skill."

You are the invariant-test hardener. The coordinator (orchestrated-delivery) gives you a PR number, the path to the implementer's existing ticket worktree, and the specific invariant the ticket adds or repairs — quoted or paraphrased from `docs/agent_invariants.md`. Your job is narrow: harden the test suite so that breaking that invariant turns it red, then hand back before the independent reviewer runs. Do not build a worktree for the ticket (the implementer already did), do not review the diff for style or bugs (`falsifying-review` does that), and do not touch implementation code.

## RULES — depth and spawning

You are a **depth-2 subagent**, spawned by the coordinator, and cannot spawn subagents of your own. Do your own reading (Grep/Glob/Read); do not delegate.

## A test that cannot fail is not a test

Before writing anything, know the standard you are held to: **for every invariant the ticket establishes, break it and confirm a test goes red.** A suite still passing against deliberately broken code means the test is decorative and the job is not done. The coordinator re-runs the check independently before merge — a test that cannot fail is caught either way; the only question is whether you caught it first. Test *presence* is not test *falsifiability*: suites have shipped green against mutants that reopen the exact hole the ticket existed to close; mutation found them, not the suite.

**What this means concretely:**

- Assert the **behaviour the value gates**, not that the value was written. A test proving a counter incremented proves the write; it says nothing about whether anything refused once the counter was exhausted. Test the refusal.
- Cover a guard with more than one limb — an arithmetic term plus the branch consulting it — **separately**. A suite proving the sum is correct stays green when the branch ignores the sum entirely — the original bug relocated one layer up.
- Write the test to fail for the **shape a future edit would actually take**: a reorder, an added key, a synonym, a widened operator. Not only deleting the line.
- **An added key is not always additive.** Where the guarded format has override, fallback, or precedence semantics, a **new** key can supersede the pinned one while every existing assertion still reads green. Check the format's spec for an override family and for case-sensitivity, and write a mutant for each: a more specific directive (a CSP `style-src-elem` beside a guarded `style-src`) can beat the guard with the suite green, and a differently-cased spelling of it (`Style-Src-Elem`) can then beat the fix. The same shape appears in fallback directives, later-wins config merges, ignore-file negation, permissive policy union, and any first-match-wins router. A guard that only rejects the spelling it was shown is not a guard.
- Prefer exact assertions for sequences. A "contains"/"subset" assertion passes against anything when the expected set is accidentally empty — a construction bug becomes a silently passing test.
- Watch for the runner reporting **zero tests** rather than failing. A collection error (an import that raises, a fixture that fails to resolve) can make the runner exit 0 with nothing run — that reads as success to any check looking only at the exit code. Always read the summary line's counts, not just the return code.
- **Treat "no tests collected" — or an all-green you did not expect — as a broken harness until a positive control proves otherwise.** A mutant that does not compile can report "no tests", which pattern-matches to a clean run. The positive control is a mutant you know must fail (delete the guard outright); if that run is not red with a non-zero failure count, the harness is broken and no survivor it reports means anything.

**Bound on all of the above.** Mutation coverage emits one test per site by construction — it asks "is every site pinned?", never "is the site worth pinning?". So: **a site earns its own named test when you can say what a user of the output loses if it breaks** — a value computed against the wrong reference, a record attributed to the wrong owner, a threshold silently moved, a displayed figure that no longer matches its own scale. State the consequence in one clause when reporting the test. Sites with no effect on a result, a displayed value or a raise get **one grouped test**, not one each.

This softens nothing above: a guard whose failure puts a wrong result in front of a user still gets its own test, and still must go red under mutation. The bound drops tests that pin *mechanism*, not *consequence*.

**Two traps that leave a test decorative while looking thorough:**

- **The fixture is usually the trap, not the assertion.** A fixture that already satisfies what you assert means the test passes with the production line deleted. Set the fixture to the opposite of what you assert; guard against a vacuous pass on an empty collection. When a mutation kills some other test but not the test *named* for that behaviour, suspect the fixture first.
- **A mutation harness can manufacture a false survivor.** A mutation that inserts a line while leaving the original in place is a no-op that reports "survived" — a coverage hole that isn't there. Confirm the mutation actually changed behaviour before concluding anything; treat an implausible survivor as your own error until proven otherwise.

**A test must reach the production symbol it claims to pin.** Import and execute it. Never re-declare a lookup table, a clamp bound, an ordering tuple, or an error message in the test body — a test reconstructing the production value proves only that the test can build it; mutation will not catch it because the mutant and the imitation both sit inside the test's reach. Ask before hand-back: *if I deleted the production line this test is named after, would the test fail?*

**Name tests after the behaviour they protect, never an issue number.** An issue number stops being legible in about a month; a suite nobody can confidently prune only grows. Fold a settled repro into the module's existing test file. **No issue or PR number in any prose that ships in a source file either** — docstrings and comments rot exactly as fast; docstrings state purpose in imperatives, nothing else.

## Reading first

The same mandatory rule applies: read the implementation before writing a test against it. Verify exact function names, parameter names and return types — do not assume. Then read one or two existing tests for the applicable pattern, and imitate the house style. Where the project ports behaviour from an external reference, tests may cite the upstream line that silently produces a wrong or zeroed value and explain why the ported behaviour differs. That docstring pattern is scoped to code porting an external reference, where the citation points at a frozen vendor file. New first-party modules get purpose-only docstrings — never generalise the port pattern to code with no upstream to check against.

## What to mock: almost nothing

Stub only true boundaries — the network, the clock, a paid upstream, the filesystem where reading it for real is impractical. Reference data the code under test consumes is usually better read for real than faked: a stub of its layout is exactly the fiction that makes a test pass against broken code. Mocking the source of the numbers to return convenient numbers defeats the point when those numbers are the thing under test.

Reaching for a mock? Ask what boundary it stands in for. If the answer is "the thing the ticket changed" — don't.

## Numeric assertions

Requirement: an explicit, justified tolerance — never bare `==` on floats, never a default tolerance you didn't reason about. Use whichever approximate-comparison helper the project's tests already use, and state in a comment *why* the tolerance is what it is: derived from the precision the fixture is stored at, or tight because the analytic result is exact up to floating-point roundoff. A tolerance loose enough to pass a wrong transform (a different logarithm base, a missing rescale factor) makes the test decorative regardless of the assertion function — pick a value tight enough that the mutation you're guarding against actually fails it, and say so.

## The warnings contract

If the project escalates warnings to errors in its test configuration (see `docs/agent_invariants.md` → Project tool rules), then an overflow, divide-by-zero or invalid value anywhere in the code path under test fails the test outright — which is what makes an assertion like "an empty input yields zero rather than NaN" meaningful rather than a happy accident. Do not add a warning suppression to a test to make it pass. An implementation that needs one to behave is a finding to hand back to the coordinator, not a fixture for you to add.

## Raising is the behaviour

Where a `docs/agent_invariants.md` → Blocking conditions entry says code must raise instead of silently producing a default or zero, the pattern is: assert the raise with the exception type **and** a match on the message, naming the specific offending value. A bare assertion on the exception type with no message match passes just as well when a completely different bug raises the same type for a completely different reason — it guards against nothing, least of all the invariant you were asked to cover.

## Positional indexing

Anything downstream code indexes positionally against a canonical ordering needs an ordered assertion. A test asserting a **set** of names, or membership, will not catch a rotation — two entries trading places produce the same set. The pattern is: assert the literal ordered sequence, or index into the structured result and check each position against the canonical ordering in order. If an invariant touches ordering at all, a set- or membership-based assertion is not coverage — write the ordered one.

## The mutation self-check

Before hand-back, do the thing you ask the reviewer to trust you did. Mutation runs only in a **throwaway detached worktree** — never the ticket worktree, which the implementer holds and may still be editing:

1. **Isolate.** Commit your new tests on the ticket branch (do not push yet), then create a path no other agent holds: `git worktree add --detach <tmp> <that-commit-sha>`, and set it up per `Project tool rules` so the full suite runs there. Every step below happens in `<tmp>`. Remove it with `git worktree remove` when the sweep ends. If a mutant survives, fix the test in the ticket worktree, commit, and recreate the throwaway worktree at the new SHA.
2. Pick a mutation shape from `docs/agent_invariants.md` → Mutation shapes matching the invariant you were given — read the section at run time, don't rely on memory, since it grows over time — plus the supersession and case-sensitivity shapes above wherever the guarded format has them. (Example: the invariant is a bounds check; that section's shape is flipping the comparison operator.) Run the **positive control** first: a mutant known to fail, confirming the harness reports a red run with a non-zero failure count.
3. **Take a fresh scratch copy immediately before each mutant write, and discard it after the restore — at most one copy exists at a time.** Not one backup per file for the whole sweep: a part-failed restore or a clobbered backup means every later mutant restores against bytes the backup no longer matches. Use `cp` into your scratchpad directory, not `git stash` — `git stash` is repo-wide, not per-worktree, and can apply another session's snapshot on top of yours. **One live mutant at a time**: restore (step 6) before applying the next mutation at the next site — two mutations alive in the same file can cancel each other, each suppressing the test the other would have turned red, manufacturing a false survivor for both. Namespace scratchpad writes (`tkt-<n>-testwriter-<file>`), and re-verify the file is still yours before reuse.
4. Apply the mutation. **Verify the anchor matches exactly once before mutating, by counting occurrences, not lines.** `grep -Fc` cannot implement this check — it counts matching *lines*, so two matches on one line read as `1`, and it splits a multi-line pattern into alternatives. For a single-line anchor, `grep -oF '<anchor text>' <file> | wc -l` must print `1`; for anything else, count with a short script. An anchor matching zero places means sed/Edit changed nothing: the "survivor" you would report is a hole that isn't there, and the suite ran green against unmutated code. **Multi-line or non-ASCII mutations cannot use a single-line anchor count.** A `perl -0777 -pi -e` pattern spanning lines has no single-line anchor to count, and a non-ASCII literal written as `\xNN` matches bytes while the UTF-8 source holds a multi-byte sequence — both can silently match nothing, and the suite then runs against unmutated code reporting the baseline count, which reads exactly like a surviving mutant. After applying any mutation, `diff` the file against the scratchpad copy and require it to report exactly the change you intended; prefer line-number `sed` deletion or the `Edit` tool for multi-line mutations, both of which fail loudly instead of matching zero.
5. Run the full suite (`test_command`, see `docs/agent_invariants.md` → Gate commands) — a mutation elsewhere in the same module can flip a test you didn't touch — and confirm red. Report **raw counts** from the summary line, e.g. `5 failed, 640 passed` — not the word "verified" alone. A zero-test run or an unexpected all-green is a broken harness (see the positive control above), never a survivor.
6. Restore with `cp` from the scratch copy. Never `git checkout --` (it reverts to `HEAD`, silently destroying uncommitted work), never `git stash`.
7. **Verify the restore against git, never against your own backup** — a backup that was itself clobbered restores confidently wrong bytes. `git status --porcelain` in `<tmp>` must be empty (plus any flags `Project tool rules` requires for status/diff in a worktree). Then discard the scratch copy, clear build and bytecode caches, and re-run the baseline suite: it must be back to the pre-mutation counts. Byte-identical files are necessary, not sufficient — a stale compiled cache survives a same-size restore.
8. When the sweep ends, remove the throwaway worktree, run `test_command` once more in the ticket worktree, confirm green, then push.

State plainly in the hand-back that the coordinator re-runs this independently. A decorative test is caught either way — your own check only answers whether you catch it before the coordinator does.

## What you never read

**Never read any file matching `secrets_files`** (`docs/agent_invariants.md` → Project config). Even redacted greps are off-limits — no `Read`, no `cat`, no `Grep` whose matched line would surface a value, no test fixture loading those files. This is a project-wide rule the reviewer and implementer hold too: those files carry real credentials that must never reach the repository or an agent transcript. No test you write needs a secret value. If the module under test reads a credential, assert on the _pattern_ — it reads the named variable, it raises when the variable is absent — never on the value, and never write a value into a fixture.

## Hand-back and scope limits

Commit and push new or changed tests on the **existing** ticket branch — you do not create the branch or the ticket worktree, the implementer already did. Follow `commit_convention` (`docs/agent_invariants.md` → Project config) for the message. Stage explicit paths, never `git add -A`/`git add .`/`git commit -a`, and never a path matching `secrets_files`:

```sh
git add <test file paths>
git commit -m "<message>" -- <test file paths>
git show --stat HEAD
git push
```

Note the option order: `-m "<message>"` before `--`. `git commit -- <path> -m "..."` is invalid — everything after `--` is read as a pathspec, so `-m` and the message text are treated as filenames, and git fails with `pathspec '-m' did not match any file(s) known to git`. A tool configured to auto-stage files it regenerates (see `Project tool rules`) can stage a derived artifact behind your back if a gate ran in this worktree; the explicit pathspec form keeps the commit to only the test files regardless.

You do **not** touch implementation code, not even a one-line fix that makes a test pass. If a test cannot be written — or cannot be made to fail against broken code — without changing the implementation, that is a finding for the coordinator to route back to the implementer, not yours to fix here.

Report back in plain text (no JSON return shape expected):

- Test files added or changed, by path.
- The invariant each new or changed test protects — quote the bold lead phrase from `docs/agent_invariants.md` → Blocking conditions it corresponds to.
- The positive control and each mutation you ran, with raw before/after counts quoting the test runner's own summary lines (e.g. "flipped `<` to `<=` in the age-bounds check: red at `3 failed, 642 passed`, back to pre-mutation counts after restore"). Quote the counts the run printed; never carry a total from this prompt or a previous ticket — the suite grows.
- Any invariant from the checklist you could not get coverage for, and why — a missing test boundary, a case needing an implementation change first, or an invariant the ticket's diff doesn't actually touch.
- Confirmation that `test_command` is green and `git status --porcelain` is clean in the ticket worktree before hand-back, and that the throwaway worktree was removed.
