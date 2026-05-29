# Pattern A — Catch-in-any on required bugs

**Pattern A** is the headline-score formula used by skills whose evaluation
follows the **detection-quality** strategy: a corpus of fixtures, each with
known planted bugs, where the reviewer's job is to find them.

> The reference implementation lives at
> [`evals/code-review/run-eval.ps1`](../code-review/run-eval.ps1).

## Inputs

For a fixture set across N trials, the harness produces, per case:

- `required_bug_count` — how many bugs in `expected.json` are marked
  `expectation: "required"`.
- `caught_in_any` — for each required bug, did **any** trial's review
  contain a finding that matched it? (`true`/`false`).

We also track, for observability only:

- `fp_distractor` — findings that landed on a non-bug distractor region.
- `fp_unmatched` — for `mature: true` cases, findings that matched neither a
  planted bug nor a distractor. (For `mature: false` cases this counts goes
  to the adjudication queue and does not influence the score.)

## Formula

Aggregate across every required bug in every case:

```
tp                  = sum over cases of (count of required bugs whose caught_in_any == true)
required_bug_count  = sum over cases of (count of required bugs)
headline_score      = round( 100 * tp / required_bug_count , 2 )
```

False positives are **reported** in `metrics` but **not subtracted**. The
headline number is recall-of-the-best-trial-per-bug. Quality dimensions that
penalize FPs (or weight by severity, or compare against a baseline) belong
in the rich metrics and detail outputs the dashboard renders alongside the
headline.

### Why catch-in-any (not catch-in-all)?

LLMs are non-deterministic. A bug that gets caught 2 out of 3 trials still
demonstrates the skill *can* catch it. The dashboard separately surfaces
per-bug catch rate (e.g., "2/3") for stability inspection. The headline is
"does the skill in principle catch this bug" — strong enough that a single
clean run can prove a regression fix without re-running every trial.

### Edge case: zero required bugs

If the fixture set has zero required bugs across all cases (e.g., a
distractor-only suite), the formula divides by zero. In that case
`run-eval.ps1` MUST emit:

```json
{ "schema_version": 1, "pattern": "A", "headline_score": null,
  "status": "error", "error": "no required bugs across fixture set",
  "metrics": { "tp": 0, "fn": 0, "fp_distractor": ..., "fp_unmatched": ...,
               "case_count": ..., "required_bug_count": 0 } }
```

This keeps the publisher from charting a meaningless `0/0`.

## `metrics` block (Pattern A)

```jsonc
{
  "tp":                 21,   // required bugs caught_in_any across trials
  "fn":                  3,   // required_bug_count - tp
  "fp_distractor":       0,   // findings on distractor regions, summed over trials
  "fp_unmatched":        1,   // mature-case unmatched findings, summed over trials
  "case_count":          8,   // number of cases evaluated
  "required_bug_count": 24    // sum of required bugs across cases
}
```

The dashboard renders these fields verbatim. New fields can be added without
a schema bump — consumers must ignore unknown keys.

## What lives in `run-detail.json`

The `detail` object is the harness's per-case summary (verbatim). For
Pattern A specifically it contains:

```jsonc
{
  "schema_version": 1,
  "pattern": "A",
  "detail": {
    "cases": [
      {
        "case_id": "ssrf-fetch-no-allowlist",
        "mode": "standalone",
        "mature": false,
        "trials": [
          { "trial": 1, "status": "ok", "duration_ms": 12340,
            "detection": { "tp": 1, "fn": 0, "fp_distractor": 0,
                           "fp_unmatched": 0 },
            "bugs": [{ "id": "missing-host-allowlist", "caught": true }] }
        ],
        "caught_in_any": [{ "id": "missing-host-allowlist", "caught": true }]
      }
      // ...
    ]
  }
}
```

This is what the dashboard renders under the per-run drill-down view.
