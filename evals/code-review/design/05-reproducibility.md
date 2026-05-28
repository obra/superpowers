# Dimension 5 — Reproducibility / Operational Reliability

> **Question:** How stable are the results across runs, how sensitive is
> the skill to context limits, and what does it cost?

An LLM-based reviewer is non-deterministic. A skill that catches a bug
1-in-5 times is materially different from one that catches it 5-in-5 — yet
a single-trial harness would score both identically on that case. This
dimension exists so we never make that mistake.

**v1 status:** Built into the detection harness (`-Trials N` is supported
from day one, and cost metadata is aggregated when adapters emit it).

## What we measure

### Stability

For each case, across N trials:

- `caught_in_any` — required bug found in **at least one** trial.
- `caught_in_all` — required bug found in **every** trial.
- `catch_rate` — `(trials caught) / N`.
- `finding_variance` — stdev of total findings per trial.

Reported per case and aggregated per category. **`caught_in_any` is the
optimistic recall; `caught_in_all` is the pessimistic recall.**

A skill where `caught_in_any` is high but `caught_in_all` is low is
fragile — it knows the bug exists in its training distribution but won't
reliably surface it.

### Cost

When the adapter emits `META: { ... }` on stderr (see
`01-detection-quality.md` § Reviewer-adapter contract), the harness
aggregates per run:

- mean / p50 / p95 latency
- mean tokens in / out
- mean tool calls per review
- model identity (must match across trials of the same run)

A skill that adds 30% recall at 10× the tokens is not always a win —
this surfaces the tradeoff explicitly.

### Failure modes

Tracked per run:

- `unparseable_review` count — the review didn't conform to the format
  (charged against the skill / adapter, not the corpus).
- `adapter_error` count — non-zero exit, timeout, crash.
- `empty_review` count — adapter returned no content.

Failure rates above a threshold (default: 5%) should block declaring the
skill "improved", even if recall went up on successful runs.

## Recommended trial counts

| Use case | Trials |
|----------|--------|
| Smoke during local development | 1 |
| PR validating a `SKILL.md` edit | 3–5 |
| Release / authoritative scoring | 10 |

Higher trial counts on the `holdout/` split give the best confidence
intervals but cost the most.

## Confidence intervals

The harness reports a Wilson 95% confidence interval on recall when
N ≥ 3, computed per category. The interval matters more than the point
estimate for small corpora.

## Why no separate harness?

Reproducibility is a *property of the detection harness's output*, not a
separate kind of test. Implementing `-Trials N` in
`Run-DetectionEval.ps1` plus a `report-stability` sub-mode that
post-processes a run directory is enough.
