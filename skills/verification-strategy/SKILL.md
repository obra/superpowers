---
name: verification-strategy
description: Use when deciding what verification would provide meaningful evidence that a change is correct — before running tests or claiming a task is verified. Matches verification effort to the type and risk of the change instead of defaulting to the full test suite or skipping verification.
---

# Verification Strategy

## Central Rule

> What verification would actually provide meaningful evidence that this specific change is correct — not verification in general, and not verification for its own sake?

This skill decides *what* to verify. `superpowers:verification-before-completion` governs the separate discipline of never claiming success without evidence, once the right evidence is known. Use both together: this skill picks the check; that one enforces actually running it before any claim of success.

---

## The Core Questions

Before verifying a change, answer:

1. What changed?
2. What behaviour should now be different?
3. What existing behaviour must remain unchanged?
4. What could realistically regress because of this change?
5. What verification would provide meaningful evidence the task is complete?

The answer to (5) should follow from (1)-(4), not from a default habit ("run the tests," "run the full suite").

---

## Proportional Verification

Verification effort should scale with the nature of the change, not follow a fixed default:

* **Documentation-only change** — review the resulting documentation for accuracy; there's no behaviour to test.
* **UI change** — inspect the affected UI, and run whatever tests/build checks are relevant to what changed.
* **API change** — run the unit/integration tests that exercise the changed contract, plus checks that existing callers/behaviour aren't broken.
* **Configuration change** — validate the configuration itself and exercise the affected service with it.
* **Refactor with no intended behaviour change** — verification should be *stronger* here, not weaker: the goal is proving behaviour didn't change, which existing tests may not have been written to catch.

These are illustrative, not an exhaustive lookup table — reason from the actual change in front of you.

Do not default to running the full test suite as a substitute for thinking about what's relevant, and do not skip verification because "it's a small change" without checking whether something meaningful could regress.

---

## Four States, Not Two

Verification isn't binary (done / not done). Distinguish:

* **Verification performed** — you ran it, in this session, and observed the result.
* **Verification appropriate but not yet performed** — something should be checked and hasn't been; say so plainly, don't imply it's done.
* **Verification unavailable** — no meaningful check exists (no test harness for this path, can't run the affected service, etc.); say so, and say what that means for confidence in the change.
* **Verification unnecessary for this type of change** — genuinely nothing to check (e.g. a comment-only or doc-only change); state this rather than manufacturing a check.

---

## Do Not Manufacture Verification

* Do not invent a test merely to be able to say "a test was written" — a test that doesn't exercise the changed behaviour is not evidence.
* Do not equate "tests passed" with "the task is verified" when the tests don't actually exercise the changed behaviour — check what the passing tests actually cover before treating a green run as confirmation.
* Do not require the full test suite automatically. Running everything is sometimes the right call, but it should be a decision, not a reflex.

---

## Reporting

When verification can't be fully performed, or is intentionally skipped as unnecessary, say so explicitly:

* what was verified, and how
* what was not verified, and why (unavailable vs. unnecessary vs. not yet done)
* what that leaves uncertain

This is the same evidence-before-claims standard `superpowers:verification-before-completion` requires — a proportionality judgement should never quietly read as an implied claim of full verification.

---

## Primary Agent Performs This

Choosing a verification strategy is reasoning the primary agent does directly, as part of its own testing, checkpoint review, and final-verification work — not a separate verification agent. Do not spawn a subagent for this by default. Independent review remains available per `superpowers:requesting-code-review` when it would add real value, same as elsewhere in the workflow.

---

## Relationship to Existing Testing Steps

This skill doesn't replace the testing steps already in `superpowers:subagent-driven-development`, `superpowers:executing-plans`, or `superpowers:test-driven-development` — it's the judgement call that decides what those steps should actually run for a given change, especially at checkpoints and final verification, where "just run the tests" stops being a sufficient answer on its own.
