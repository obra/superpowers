# Headline Score (umbrella)

Every skill that ships an eval suite produces a single **headline score**
between 0 and 100 — a coarse, comparable number whose only job is to make
regressions visible at a glance in CI history.

The headline score is intentionally lossy. The *interesting* metrics for any
given skill (recall slices, false-positive rates, severity calibration, win
rate vs. baseline, assertion pass counts, …) live in the freeform `metrics`
map on `headline-score.json` and in `run-detail.json`. The headline score is
just the single number that gets plotted over time.

## Why one number?

Many numbers don't move the same way. If a `SKILL.md` change boosts recall
by 5% and FP rate by 1%, is that better or worse? Different skills answer
that question differently. Forcing each skill to define its own headline
formula keeps the *shape* of the answer skill-appropriate while keeping the
*type* of the answer (a 0–100 number, higher is better) universally
comparable.

## Patterns

Each eval suite declares its **pattern** (a letter A–F) on
`headline-score.json`. Patterns correspond to the six bucket-tracking issues
(#1–#6) that codify the testing strategies the repository uses:

| Pattern | Strategy | Headline-score doc |
|---|---|---|
| A | Catch-in-any on required bugs (detection harness) | [headline-score-pattern-a.md](headline-score-pattern-a.md) |
| B | _reserved — see issue #2_ | _ships with first B-pattern eval suite_ |
| C | Process-compliance assertions over a recorded trace | _ships with first C-pattern eval suite_ |
| D | Win rate vs. baseline (judge-pair) | _ships with first D-pattern eval suite_ |
| E | _reserved — see issue #5_ | _ships with first E-pattern eval suite_ |
| F | _reserved — see issue #6_ | _ships with first F-pattern eval suite_ |

Only Pattern A has a documented formula in v1. The other patterns add their
own sub-doc when their first eval suite lands; the umbrella is updated at
the same time.

## Contract

The bridge between an eval suite and the publishing workflow is
[`run-eval-contract.md`](run-eval-contract.md). Every skill author who adds
an eval suite implements that contract; the workflow does not care which
pattern the skill uses.
