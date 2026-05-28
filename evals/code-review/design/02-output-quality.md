# Dimension 2 — Severity & Output Quality

> **Question:** Are reviews well-formed, severities calibrated, and verdicts
> consistent with the findings?

This dimension is **about the artifact**, not whether the review is right.
A review can detect every bug and still violate format rules; another can
miss bugs but be perfectly structured. We measure each independently.

**v1 status:** Severity scoring is implemented as part of the detection
harness (see `01-detection-quality.md` § Severity calibration). Other checks
are designed here; no separate harness yet.

## Checks

### 1. Format conformance (hard fail)

Parse the review and verify the structure required by `SKILL.md` § Review
Output Format:

- Title `## 🤖 Code Review` present.
- `### Holistic Assessment` section present.
- `**Motivation**`, `**Approach**`, `**Summary**` lines present.
- Summary line begins with one of: `✅ LGTM`, `⚠️ Needs Human Review`,
  `⚠️ Needs Changes`, `❌ Reject`.
- `### Detailed Findings` section present (may be empty if LGTM).
- Each finding starts with `#### ` then one of `❌`, `⚠️`, `💡`.

A review that cannot be parsed is itself a failure — log as `unparseable`.

### 2. Verdict-vs-severity consistency (hard fail)

Rules from `SKILL.md` § Verdict Rules:

| Violation | Rule |
|-----------|------|
| `LGTM` with any `⚠️` or `❌` finding | Verdict cannot be LGTM if any non-suggestion findings exist. |
| `Needs Changes` with **only** `💡` findings | Suggestion-only diffs should not block merge unless prose explicitly says so. |
| `Reject` without an `❌` finding | Reject requires a fundamental defect. |
| `Needs Human Review` with no stated uncertainty | Must name which findings are uncertain. |

### 3. Finding actionability (soft / heuristic)

For each finding, check the body for:

- a file reference (path or `path:line`),
- "why it matters" content (verb-based phrasing — `because`, `causes`,
  `risks`, `breaks`, `leaks`, `races`, `corrupts`, etc.),
- a fix direction or decision point (`should`, `consider`, `replace with`,
  `prefer`, `need to decide`, etc.),
- absence of pure praise / non-actionable commentary.

Reported as a per-review **actionability score** 0..1, not pass/fail.

### 4. No-praise rule

`SKILL.md` § Severity Classification:
> "Only surface actionable findings. Do not include positive confirmations,
> 'looks good' notes, or commentary praising correct code."

Heuristic: flag findings whose body matches `^\s*(looks good|nice|great|
well done|correctly|good job)` etc.

### 5. Severity calibration (cross-references Dimension 1)

For TPs in the detection harness, compute `severity_delta`. See
`01-detection-quality.md`.

## Fixtures

`fixtures/output/` will hold **labeled review markdown files** — the
artifacts to score against. Format:

```
fixtures/output/<case-id>/
├── review.md           # the review to grade
└── expected.json       # what to assert
```

`expected.json` example:

```json
{
  "case_id": "lgtm-with-warning-violation",
  "should_parse": true,
  "expected_violations": ["lgtm_with_warning"],
  "expected_findings_count": 1,
  "expected_verdict": "lgtm"
}
```

## Harness sketch (deferred to v2)

```powershell
./harness/Score-Output.ps1 -Fixtures ./fixtures/output -OutDir ./results/output
```

- Walk fixtures.
- For each: parse `review.md` via the shared parser
  (`harness/lib/Parse-Review.ps1`).
- Run the five checks above.
- Diff against `expected.json`.
- Aggregate.

The parser library is built in v1 (needed by detection scoring), so adding
this harness is a thin wrapper.

## Known failure modes

- **Verdict-icon mojibake.** Adapters may strip emoji. Parser must accept
  both `⚠️` and the literal string `Warning`/`Needs Changes` as fallback.
- **Headers as decoration.** A review with all the right headers but empty
  sections will pass format checks. The actionability heuristic partially
  catches this; full validation requires content checks deferred to v2.
- **Multi-finding headings.** A single `####` heading may discuss multiple
  related issues. The parser keeps them as one finding by default; cases
  testing finding-count should be authored carefully.
