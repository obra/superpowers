# Dimension 1 — Detection Quality

> **Question:** Given a diff with one or more known issues, does the skill
> find them? Given a clean / distractor diff, does it avoid making things up?

This is the primary dimension and the one with the runnable harness in v1.

## Definitions

- **Required bug** — a planted defect the reviewer **must** flag to score
  recall. Missing it counts as a false negative.
- **Optional bug** — a real but minor issue. Finding it is a bonus
  (`optional_caught`); missing it is not penalized.
- **Distractor** — code that *looks* suspicious but is correct in context
  (e.g., apparent missing validation that the caller already enforces).
  A finding on a distractor region counts as a false positive.
- **Clean control** — a diff with no planted bugs at all. Any finding is a
  candidate FP (subject to adjudication on immature cases).

## Fixture format

Each case is one directory:

```
fixtures/detection/<split>/<case-id>/
├── diff.patch          # the diff under review (unified diff format)
├── context/            # repo snapshot the reviewer is given access to
│   └── ...
├── pr.md               # (optional) PR description — present ⇒ PR mode
└── expected.json       # ground truth — NEVER given to the adapter
```

Splits: `dev/`, `regression/`, `holdout/`. The `holdout/` split is reserved
for evaluating finished `SKILL.md` changes — do not iterate on the prompt
while looking at holdout results.

### `expected.json` schema (informal)

```jsonc
{
  "case_id": "ssrf-fetch-no-allowlist",
  "mode": "standalone",                          // "standalone" | "pr"
  "mature": false,                               // see § Maturity
  "description": "Short prose for human readers.",
  "expected_verdict_at_least": "needs_changes", // optional gate
  "bugs": [
    {
      "id": "missing-host-allowlist",
      "category": "security",
      "expectation": "required",                 // required | optional
      "expected_severity": "error",              // error | warning | suggestion
      "evidence_regions": [
        { "file": "src/fetch.ts", "lines": [12, 18] },
        { "file": "src/fetch.ts", "lines": [42, 45] }
      ],
      "semantic_keywords": ["allowlist", "ssrf", "host", "validate"],
      "description": "User-controlled URL reaches fetch() with no host check."
    }
  ],
  "non_bug_distractors": [
    {
      "id": "looks-like-cmd-injection-but-array",
      "evidence_regions": [{ "file": "src/exec.ts", "lines": [30, 40] }],
      "note": "args passed as array — exec is safe."
    }
  ]
}
```

See `fixtures/detection/_schema/expected.schema.json` for the strict schema.

## Matching rules

For each finding `F` parsed from the reviewer output:

1. **Distractor match** — if `F.file` matches a `non_bug_distractors[].file`
   and `F.line` is within range ± window ⇒ **false positive (distractor)**.
2. **Bug match** — `F` matches expected bug `B` if **either**:
   - **Location match**: `F.file == region.file` and `F.line` is within
     `region.lines` ± `LINE_WINDOW` (default 8), for any region in `B`,
     AND (when `B.semantic_keywords` is non-empty) at least
     `LOCATION_KEYWORD_MIN` (default 1) of those keywords appear in
     `F.title + " " + F.body`. The keyword corroboration prevents two bugs
     whose `evidence_regions` overlap on the same lines from both claiming
     a finding that only addresses one of them. Set
     `LOCATION_KEYWORD_MIN=0` to restore pure-location matching.
   - **Semantic match**: `F.file == region.file` (file-level only) AND at
     least `SEMANTIC_THRESHOLD` (default 2) of `B.semantic_keywords` appear
     in `F.title + " " + F.body` (case-insensitive whole-word match). Used
     when the reviewer reports a stale or approximate line number.
3. **Unmatched** — `F` matches no bug and no distractor.
   - If `mature: true` ⇒ **false positive (unmatched)**.
   - If `mature: false` ⇒ added to the **adjudication queue** (not scored).
4. **Duplicates** — multiple findings matching the same `B` count as 1 TP
   plus N duplicates (reported separately, not penalized as FP).

## Metrics

Per case:
- `tp`, `fn`, `optional_caught`, `fp_distractor`, `fp_unmatched`,
  `duplicates`, `adjudication_queue` (count).

Aggregate (per split, per category):
- **Recall** = TP / (TP + FN) over required bugs.
- **Recall@k** across N trials (`caught_in_any`, `caught_in_all`).
- **FP rate per review** = FP / number of reviews.
- **Class recall** — recall sliced by `category`.
- **Cost** (if adapter emits `meta.json`) — mean latency, tokens in/out,
  tool calls per review.

Reports are emitted as JSON to `results/<run-id>/` plus a human summary
table to stdout.

## Severity calibration (parallel metric)

For each TP, compute `severity_delta = severity_rank(predicted) -
severity_rank(expected)` where rank is `suggestion=1, warning=2, error=3`.
Per-run output:

- `exact_severity_rate` — fraction of TPs with `delta == 0`.
- `over_severity_rate` — `delta > 0`.
- `under_severity_rate` — `delta < 0`.
- `severe_underlabel_rate` — `predicted == suggestion AND expected == error`.

**Severity does not affect TP/FN.** A bug found at the wrong severity is
still a bug found.

## Reviewer-adapter contract

The adapter is invoked once per review. The harness writes a JSON request
to stdin and expects review markdown on stdout, exit code 0.

```jsonc
// stdin
{
  "caseId": "ssrf-fetch-no-allowlist",
  "mode": "standalone",
  "diffPath": "C:/tmp/eval-xxxx/diff.patch",
  "contextDir": "C:/tmp/eval-xxxx/context",
  "prDescriptionPath": null,    // string or null
  "trial": 1,
  "trialsTotal": 3
}
```

**Adapter MUST NOT** access `expected.json`. The harness stages each case
into a temp directory containing only `diff.patch`, `context/`, `pr.md`,
and never `expected.json`.

The adapter MAY emit a sidecar `meta.json` to stderr in a single line
prefixed with `META:` for cost / model metadata:

```
META: {"latency_ms": 12340, "tokens_in": 1820, "tokens_out": 540, "tool_calls": 12, "model": "claude-opus-4.7"}
```

Bundled adapters (see `adapters/README.md`):

- `manual.ps1` — prints the prompt, reads the review from stdin (smoke only).
- `template.ps1` — annotated skeleton.
- `baseline-no-skill.template.ps1` — example baseline adapter that omits
  SKILL.md and uses only a generic "review this diff" prompt.

## Authoring a new case

1. Pick a single bug class. Don't pile multiple unrelated bugs into one case
   unless you're testing whether the reviewer flags them all.
2. Make `context/` realistic — include callers, helpers, related tests.
   Tiny isolated snippets overestimate reviewer skill.
3. Add 2–3 `semantic_keywords` per bug. Be specific (`allowlist`, `SSRF`)
   not generic (`security`, `bug`).
4. Include `evidence_regions` for **all** reasonable places the bug could be
   flagged (root cause AND symptom site).
5. Start with `mature: false`. After 2–3 reviewer runs reveal what
   legitimate-but-unplanted findings look like, decide whether to:
   - Mark the case `mature: true` (your fixture covers all real issues), OR
   - Add the surfaced issues as `optional` bugs.
6. Generate a metamorphic variant if you can — same bug class, different
   shape — and put it in a different split.

## Known failure modes

- **Stale line numbers.** LLMs report approximate lines. Mitigate via
  `LINE_WINDOW` and semantic-keyword fallback.
- **Reviewer flags the *missing* code.** A planted bug for "no input
  validation" may be flagged at the call site that depends on validation,
  not at the missing-helper site. Both sites must be in `evidence_regions`.
- **Synthetic clean controls aren't clean.** Real bugs sneak in. Hence
  `mature: false` and the adjudication queue.
- **Overfitting `SKILL.md` to fixtures.** Mitigated by `holdout/`.
- **Cross-case correlation.** A poorly worded `SKILL.md` change might
  improve one case and silently regress 5 others. The harness reports
  per-case deltas across runs.
