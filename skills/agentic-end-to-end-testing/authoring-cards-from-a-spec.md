# Authoring Cards from a Spec

## When to use

A design spec exists and scenario cards are being authored from it — by a
dispatched card-author subagent (the default; template below) or by the
coordinator authoring directly. The spec records the *requested* behavior;
the running app shows only the *built* behavior. Cards written after
implementation drift toward what was built unless each one is anchored to
the spec — the anchor is a falsification line lifted from the spec verbatim.

No spec at all? This file doesn't apply — write cards straight from the
card format in [SKILL.md](SKILL.md) ("The Scenario Card").

## With a scenario table

When the spec carries an "E2E scenario cards" section (a table with Card /
Covers / Falsification columns), the table is a pre-locked contract:

- **One card per row.** The Card cell names the file
  (`<cards-dir>/<card>.md`); the Covers cell scopes what it exercises.
- **The row's Falsification line lands in the card's `## Expected` section
  VERBATIM.** Re-wrapping across lines is fine — the checker normalizes
  whitespace — but do not reword, reorder, or "improve" the line. The
  checker matches it only inside `## Expected`; carrying it anywhere else
  in the card does not count.
- **The spec is authoritative wherever the app's behavior disagrees.** Flag
  the disagreement in the report; never adapt the card to observed
  behavior. A card that matches the app but not the spec is exactly the
  drift this file exists to prevent.
- **Falsification lines are prose contracts, not literal aligned output.**
  Normalization collapses runs of spaces, so an assertion whose column
  spacing matters (`TOTAL      20.85`) belongs in the card's Expected body
  next to the verbatim line — never in the table line itself.

Expand each row into a full card per [SKILL.md](SKILL.md): the
falsification line is the contract; Pre-state, Steps, and the rest of
Expected are yours to write, and every assertion you add must itself be
falsifiable — exact observable values, not "looks right".

## Without a table (bootstrap path)

When the spec has requirements but no "E2E scenario cards" section:

1. Mine the spec's user-visible requirements into discrete behaviors.
2. Write a falsification line for each — from the spec's wording, not from
   what the app currently prints.
3. Add an "E2E scenario cards" section with the table to the spec, carrying
   those lines. This backport is sanctioned; editing anything else in the
   spec is not.
4. Flag the spec edit prominently in the report for human review. Never
   present a self-written table as a pre-locked contract — the
   locked-contract guarantee exists only when the table predates
   implementation. On this path the checker verifies transcription
   consistency, not pre-implementation locking; say so in the report.

## Coverage check

Before finishing: every user-facing claim in the spec maps to a card, or to
a stated exclusion with a reason. List the mapping in the report — an
unmapped claim is uncovered behavior, not an oversight to stay quiet about.

## Role boundary

Verbatim, non-negotiable: the card author never modifies product code, test
code, or existing cards' assertions. A failing card plus root cause is the
deliverable, not a fix. One mandate per agent: finders are never fixers —
fixes belong to a separately dispatched fix wave.

## Mechanical check

After authoring, run the checker (path relative to this skill):

```
scripts/check-cards-against-spec <spec> <cards-dir>
```

Include its full output in the report. The dispatching agent re-runs it
independently before accepting the report — self-attestation is not the
gate.

## Dispatch template

Fill every `[PLACEHOLDER]`; the author starts with zero conversation
context. Delete bracketed conditionals that don't apply.

```
Subagent (general-purpose):
  description: "Author scenario cards from spec: [SPEC_NAME]"
  prompt: |
    You are a scenario-card author. Your only deliverables are cards and a
    report. This is a cards-only task: the card author never modifies
    product code, test code, or existing cards' assertions. If a card
    fails against the app, the failing card plus root cause IS the
    deliverable — do not fix anything.

    ## The Spec

    Read the spec first: [SPEC_PATH]. It is authoritative — cards assert
    the requested behavior it records, not whatever the application
    currently does. If the app's behavior disagrees with the spec, flag
    the disagreement in your report; never adapt a card to observed
    behavior.

    ## The Cards

    - Write one card per row of the spec's "E2E scenario cards" table
      into [CARDS_DIR], using the card format in [SKILL_DIR]/SKILL.md
      ("The Scenario Card" section).
    - Each card's ## Expected section must carry its row's Falsification
      line VERBATIM — re-wrap freely, never reword.
    - [If the spec has no table: follow the bootstrap path in
      [SKILL_DIR]/authoring-cards-from-a-spec.md — derive falsification
      lines from the spec's requirements, backport the table into the
      spec, and flag the spec edit prominently in your report.]

    ## Mechanical check

    Run [SKILL_DIR]/scripts/check-cards-against-spec [SPEC_PATH]
    [CARDS_DIR] and include its full output in your report. I re-run it
    independently — your report is not the gate.

    ## Report

    Your final message, in this exact shape:
    1. Cards written (paths).
    2. Per card: falsification source (table row / bootstrap).
    3. Coverage: each user-facing spec claim -> card, or a stated
       exclusion with a reason.
    4. Checker output, complete and unedited.
    5. Spec disagreements: app-vs-spec divergences, flagged.
    6. [Bootstrap only] Spec edits made, flagged for human review.
```
