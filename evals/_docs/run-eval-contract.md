# `run-eval.ps1` — per-skill contract

Every skill that wants a per-commit score in the eval dashboard ships a
single entry-point script:

```
evals/<skill>/run-eval.ps1
```

The CI workflow invokes it with:

```powershell
pwsh -File evals/<skill>/run-eval.ps1 -OutDir <path>
```

The script is responsible for running whatever harness/judge/trace-recorder
is appropriate for the skill's testing pattern and producing **exactly two
output files** in `$OutDir`, in the schemas below. The publishing workflow
does not inspect *how* the score is computed — only the contract files.

## Required outputs

### `OutDir/headline-score.json`

```jsonc
{
  "schema_version": 1,
  "pattern": "A",
  "headline_score": 87.5,
  "status": "ok",
  "trials": 3,
  "adapter": "claude-code",
  "metrics": {
    "tp": 21, "fn": 3,
    "fp_distractor": 0, "fp_unmatched": 1,
    "case_count": 8, "required_bug_count": 24
  }
}
```

Required fields:

- `schema_version` — integer `1` in this version.
- `pattern` — one of `"A"`, `"B"`, `"C"`, `"D"`, `"E"`, `"F"` when
  `status == "ok"`. May be `null` when `status == "error"` and the
  failure happened before a pattern could be determined (e.g., the
  workflow synthesizes an error contract when `run-eval.ps1` itself
  crashed). See [`headline-score.md`](headline-score.md). When the
  publisher encounters a `null` pattern on an error row, it carries
  forward the most recent non-null pattern from the skill's history so
  the dashboard can still render the correct chart type.
- `headline_score` — a number 0–100 when `status == "ok"`; `null` when
  `status == "error"`.
- `status` — `"ok"` or `"error"`.

Optional fields:

- `trials` — integer, number of trials per case (Pattern A/D etc.).
- `adapter` — short string naming the reviewer/judge used (free-form;
  conventionally e.g. `"smoke"`, `"copilot"`, `"claude-code"`).
- `metrics` — freeform key/value map. Schema is **pattern-specific**; the
  per-pattern sub-doc spells it out. The dashboard renders whatever's there.
- `error` — required when `status == "error"`; short human-readable string.

On error, set `status: "error"`, `error: "<message>"`, and either omit or
`null` the other optional fields. `headline_score` MUST be `null`.

### `OutDir/run-detail.json`

```jsonc
{
  "schema_version": 1,
  "pattern": "A",
  "detail": { /* freeform, pattern-specific */ }
}
```

The `detail` blob is rendered as the per-run drill-down on the dashboard.
What goes in it is up to the pattern's sub-doc, but it should:

- Be self-contained (a future viewer reading just this file can understand
  the run).
- Avoid embedding the raw `expected.json` ground-truth files for cases that
  haven't shipped publicly — write IDs and summaries instead.
- Stay bounded in size; the dashboard treats the whole `runs/<…>.json` as a
  single fetch.

## Behavior

- `run-eval.ps1` should always produce *both* files when it exits 0, even if
  the eval found regressions (a low headline score is `status: "ok"`).
- `run-eval.ps1` may exit non-zero on catastrophic harness failures
  (couldn't find fixtures, library import failed, etc.). The workflow
  synthesizes an `error` row in `history.jsonl` if `headline-score.json` is
  missing.
- The workflow runs the script with `PWD = <repo root>` and passes
  `-OutDir <runner.temp>/eval-out`. Scripts should not rely on the current
  working directory beyond that.

## CI environment

The workflow exposes secrets and repo variables to the eval step via
`env:`. Authors should:

- Make their script work with a **free / deterministic** default (e.g., a
  smoke adapter) so the workflow remains green even without API keys.
- Accept env-var overrides for the adapter, model, trial count, etc., so a
  human can re-run a real eval out-of-band when needed.
- Document any extra secrets/variables the script reads in CLAUDE.md so
  consumers know what to configure.

The `code-review` reference implementation honors `$env:EVAL_ADAPTER`
(adapter name, defaults to `smoke`) and `$env:EVAL_TRIALS` (integer,
defaults to `1`). When `EVAL_ADAPTER` resolves to `copilot`, the
workflow also installs the GitHub Copilot CLI on the runner and
authenticates via `secrets.COPILOT_PAT` (a user-owned fine-grained
PAT). See CLAUDE.md § "Configuring the CI workflow" for the full
configuration table.

### Workflow-wide env contract

Every `run-eval.ps1` script MUST honor the following env vars when set,
so the CI workflow can switch all skills' adapters with a single repo
variable instead of per-skill configuration:

| Env var | Meaning |
|---|---|
| `EVAL_ADAPTER` | Short adapter name (e.g. `smoke`, `copilot`) OR an absolute path to an adapter script. When a short name, the script resolves it to `adapters/<name>.ps1` under its own skill directory. |
| `EVAL_TRIALS`  | Integer number of trials per case (for patterns where the concept applies). |

Scripts MAY support their own additional env-var knobs (e.g. for
pattern-specific options), but the two above are the cross-skill
contract that the workflow controls.

## Reference

See [`evals/code-review/run-eval.ps1`](../code-review/run-eval.ps1) for the
reference Pattern-A implementation.
