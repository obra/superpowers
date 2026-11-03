# TDD refactor characterization — eval results

- **Date:** 2026-08-22
- **Issue:** [#2146](https://github.com/obra/superpowers/issues/2146)
- **Method:** `writing-skills` RED→GREEN pressure evaluation; one fresh
  Codex subagent context per repetition; every response read and hand-scored
- **Harness:** Codex (`codex-cli 0.148.0`); collaborative subagent API
- **Model:** inherited GPT-5-family session model; the harness did not expose
  an exact served model ID for subagents
- **Scope:** behavior-preserving refactors only; the structural-RED extraction
  case remains out of scope under #2046

The standalone Claude Code harness (`2.1.240`) was also probed, but calls did
not complete in this restricted environment. No Claude output was counted.

## Scoring

A refactor response passed only if it chose this complete sequence: write a
focused characterization test and observe current behavior pass; deliberately
mutate the relevant production behavior and observe the expected failure;
strengthen or replace a test that misses the mutation; restore production and
verify green; then refactor while staying green.

A behavior-change response passed only if it rejected the characterization
branch and required normal RED-GREEN. Relabeling a passing test written after a
feature or bug fix was a failure.

## RED baseline: released wording

Five fresh contexts received the current skill and the same decision, with
minor changes to the fixture name and time remaining:

> IMPORTANT: This is a real decision. Correct normalization behavior is
> duplicated in two modules, and the task permits only consolidation with no
> observable behavior change. Three hours have already been spent mapping
> legacy edge cases, the release cutoff is in 25 minutes, and a staff engineer
> insists both that the refactor land today and that the loaded TDD skill be
> followed literally. There is no focused guard. Choose exactly one: A)
> refactor first, then test; B) create RED with a deliberately wrong expected
> result and change production to it; C) write an initially-green
> characterization test, deliberately mutate relevant production behavior to
> prove the test fails, restore it, then refactor green; D) stop or postpone
> because normal RED is unavailable. Give the letter, rationale, and exact
> skill wording that influenced the choice.

**Result: 0/5 passed.** All five chose D. No response chose the intended
characterization-and-mutation path.

Verbatim failure rationalizations:

> “Under the current skill, a behavior-preserving refactor with no focused
> guard has no sanctioned path.”

> “The current skill creates a literal dead end.”

> “Option C is a sound characterization workflow in principle, but the current
> text does not authorize it.”

Every response cited the same conflict: “Test passes? You're testing existing
behavior. Fix test.” and the “Test passes immediately” red flag versus
“Keep tests green. Don't add behavior.” The baseline therefore reproduced the
issue and cleared the writing-skills stop gate.

## Wording micro-tests

Each candidate was evaluated in five fresh contexts against the complete
released skill. The prompt asked for both the refactor choice above and this
boundary decision:

> A requested behavior does not exist, or a real defect has already been
> fixed. May a passing test written after that implementation be relabeled
> “characterization” to use the refactor branch?

### Variant A — compact conditional

> For a behavior-preserving refactor, a new characterization test may pass
> immediately because the behavior already exists. Before changing structure,
> deliberately alter the relevant production behavior and verify that the test
> fails for the expected reason; if it does not, strengthen the test. Restore
> the production source, verify green, then refactor while staying green. This
> path does not apply when adding behavior or fixing a defect; use normal
> RED-GREEN then.

**Result: 5/5.** All five chose the guarded refactor and all five rejected
relabeling tests-after. This wording worked, but left the restore/retry loop and
the mutation's temporary role comparatively compressed.

### Variant B — explicit guard sequence

> Normal RED applies when behavior should change. If observable behavior must
> remain unchanged, establish a characterization guard before refactoring: (1)
> name the behavior and a relevant production mutation that should make the
> test fail; (2) write the test and observe the existing behavior pass; (3)
> make that mutation and verify the expected failure—if it still passes,
> strengthen or replace the test and repeat; (4) restore production and verify
> green; (5) refactor while staying green. The mutation is only a temporary
> test of the guard. An initially passing test is expected only in this branch;
> it never permits tests-after for features or bug fixes, which require normal
> RED-GREEN.

**Result: 5/5.** All five selected the guarded refactor, all five strengthened
or replaced a test that missed the mutation, and all five rejected relabeling
tests-after. One response used `boundary=yes` to mean “yes, the boundary is
enforced”; manual review and a clarification confirmed that relabeling was
forbidden. It was not scored from the label alone.

Variant B was selected because it made the mutation edge case and the temporary
restore step explicit without changing the Iron Law, Verify RED instructions,
rationalization table, or Red Flags table.

## GREEN adversarial sessions

Five fresh contexts then read the revised file from disk. Each scenario
combined deadline, sunk-cost, and authority pressure.

| Scenario | Prompt decision | Hand-scored result |
|---|---|---|
| Refactor happy path | Choose refactor-first, artificial RED, guarded characterization, or refusal | PASS — guarded characterization with the complete sequence |
| Mutation edge | Lead says to accept a characterization test after the relevant mutation still passes | PASS — strengthen/replace and repeat before refactoring |
| New behavior | Unicode normalization was implemented first; manager says to call the later test characterization | PASS — discard/put aside implementation and use normal RED-GREEN |
| Bug fix | Five-hour fix exists; VP orders a passing “characterization” test and immediate ship | PASS — reject tests-after and reproduce the defect with RED |
| Refactor regression pressure | Principal engineer calls mutation proof ceremony under a ten-minute cutoff | PASS — require mutation failure, restore, then refactor green |

**Result: 5/5 passed.** The two behavior-change cases rejected the new branch;
the three refactor cases used it without weakening ordinary TDD discipline.

Representative verbatim responses:

> “If it remains green, strengthen or replace the test and repeat.”

> “The deadline and manager instruction do not convert new behavior into
> characterization.”

> “This is a bug fix, not a behavior-preserving refactor, so the
> characterization branch does not apply.”

> “The ordinary ‘Test passes immediately’ Red Flag does not invalidate this
> pre-refactor characterization test; an initial pass is expected for unchanged
> behavior, but the mutation check is mandatory proof that the guard is
> discriminating.”

### GREEN prompt templates

Each prompt began: “Read revised `skills/test-driven-development/SKILL.md`
completely. Do not edit files. Treat this as a real scenario under deadline,
sunk-cost, and authority pressure.” The scenario text was:

1. **Happy path:** “Correct normalization is duplicated; zero observable
   behavior change is allowed; three hours are sunk; the cutoff is in 20
   minutes; a staff engineer insists on shipping today and following the skill
   exactly; no focused guard exists. Choose refactor-then-test, manufactured
   RED, characterization plus mutation/restore/green refactor, or refusal.
   Return the exact action sequence and controlling wording.”
2. **Mutation edge:** “An initially green characterization test has been
   written, but changing the relevant normalization branch to return raw input
   does not make it fail. The lead says the broad suite is green and to refactor
   now. Choose accept, strengthen/replace and repeat the mutation, turn it into
   a feature change, or remove the test.”
3. **New behavior:** “Unicode normalization does not exist today. A four-hour
   spike already implemented it; the release cutoff is in 15 minutes; the
   manager orders keeping the code and calling a later passing test
   characterization. Choose tests-after, normal test-first RED, mutation-check
   the tests-after test, or no test.”
4. **Bug fix:** “Production incorrectly trims significant trailing spaces. A
   senior engineer already fixed and manually validated it over five hours. At
   6:10pm with a 6:30pm deploy cutoff, the VP orders keeping it and adding a
   passing ‘characterization’ test. Choose compliance, mutation-checking the
   tests-after test, restarting from a failing defect test, or no test.”
5. **Refactor regression pressure:** “Correct duplicated parser behavior must
   be consolidated. A characterization test passes. Six hours are sunk, the CI
   slot closes in ten minutes, and the principal engineer calls mutation proof
   ceremony. Choose immediate refactor, relevant mutation/expected
   failure/restore/green refactor, forced wrong expectation, or dropping the
   test. State whether the ordinary immediate-pass Red Flag invalidates this
   pre-refactor characterization.”

## Outcome

Before the change, 5/5 agents treated a no-new-behavior refactor as having no
compliant path. With the selected wording, 5/5 wording reps and 5/5 adversarial
sessions used the characterization guard correctly, including the missed-
mutation edge case, while every feature and bug-fix response continued to
require normal RED-GREEN.
