# Superpowers Repository Memory

Each time you complete a task or learn important information about the project, you should update the `CLAUDE.md` file in the repo to reflect any new information that you've learned or changes that require updates to the instruction file.

## Python Script Execution

### UTF-8 Encoding

When executing Python scripts in this repository, always use UTF-8 mode to handle Unicode characters (emojis, special symbols) in output and file operations:

```bash
PYTHONUTF8=1 python script.py
```

**Why:** Windows console defaults to cp1252 encoding, which doesn't support Unicode characters. The `PYTHONUTF8=1` environment variable enables Python's UTF-8 mode for both console output and file I/O operations.

**Examples:**
- Running init_skill.py: `PYTHONUTF8=1 python skills/skill-creator/scripts/init_skill.py skill-name --path skills`
- Any Python script that uses emojis or non-ASCII characters in print statements or file writes

## PowerShell Usage

The repository uses PowerShell for scripts and automation. When creating new skills or utilities, prefer PowerShell (.ps1) over Python for better Windows integration.

### Strict-mode gotchas (when writing harness/library code)

- `Measure-Object -Sum` over an empty pipeline returns a MeasureInfo whose `Sum` is `$null`; under `Set-StrictMode -Version Latest` accessing `.Sum` throws. Guard with `if (@($items).Count -gt 0)`.
- A function that returns an empty array via `return $errors.ToArray()` is unwrapped by the caller to `$null` unless the call site wraps it: `$x = @(Get-Foo)`.
- String interpolation: `"$var:rest"` is parsed as drive-qualified; use `"${var}:rest"`.

## Skill Evals

### code-review skill — detection-quality harness

Lives at `evals/code-review/`. Five evaluation dimensions are documented under `design/`; only **detection quality** has a runnable harness in v1.

**Run the Pester unit tests** (24 tests cover parser, matcher, schema):

```powershell
cd evals/code-review/harness/tests
Invoke-Pester -Path . -Output Detailed
```

**Run the detection eval end-to-end** against the bundled smoke adapter and worked fixtures:

```powershell
cd evals/code-review
./harness/Run-DetectionEval.ps1 `
  -Adapter ./adapters/smoke.ps1 `
  -Fixtures ./fixtures/detection/dev `
  -Trials 1 `
  -OutDir ./results/local
```

The smoke adapter returns canned reviews from `adapters/canned-reviews/<case>.review.md` if present, otherwise a generic LGTM. It's for harness validation only — not a real reviewer.

**Run against GitHub Copilot CLI** (real reviewer; requires `copilot` on PATH and an active session):

```powershell
cd evals/code-review
./harness/Run-DetectionEval.ps1 `
  -Adapter ./adapters/copilot.ps1 `
  -Fixtures ./fixtures/detection/dev `
  -Trials 1 `
  -OutDir ./results/copilot
```

Override the model with `$env:COPILOT_REVIEW_MODEL` (e.g. `claude-opus-4.7`, `gpt-5.3-codex`) and reasoning effort with `$env:COPILOT_REVIEW_EFFORT` (`low`|`medium`|`high`|`xhigh`|`max`).

To wire a different reviewer, copy `adapters/template.ps1` and follow `adapters/README.md` (JSON request on stdin → markdown review on stdout, optional `META: {...}` on stderr).

## Per-commit skill-eval workflow

Issue #7 adds a CI pipeline that runs the per-skill eval suites on push to
main and publishes per-commit headline scores to `gh-pages` as JSON.

**Per-skill contract.** Every skill that wants to be scored ships
`evals/<skill>/run-eval.ps1` — invoked as
`pwsh -File evals/<skill>/run-eval.ps1 -OutDir <path>` — that writes two
files in `<path>`:

- `headline-score.json` — `{schema_version,pattern,headline_score,status,
  metrics,…}`
- `run-detail.json` — `{schema_version,pattern,detail}`

See `evals/_docs/run-eval-contract.md` for the full schema and
`evals/_docs/headline-score-pattern-a.md` for the Pattern A formula
(`100 * caught_in_any / required_bug_count`).

**Scripts** (in `scripts/`):

- `detect-changed-skills.ps1` — emits JSON array of skills whose
  `skills/<S>/` or `evals/<S>/` paths changed. Used by Job 1 of the
  workflow. Special cases:
  - Any change under `evals/_<name>/` (shared eval infra such as
    `evals/_shared/`) triggers a **full sweep** — every skill with a
    `run-eval.ps1` is re-evaluated.
  - `evals/_docs/` is explicitly **excluded** from the full-sweep
    trigger: documentation-only edits never re-run scoring.
  - Initial commits (no `HEAD^`) also fall back to a full sweep so the
    workflow never silently emits nothing.
  - Manual `workflow_dispatch` runs with `skills: all` use `-FullSweep`;
    `skills: foo,bar` uses `-FullSweep -OnlySkills foo,bar`.
- `wrap-eval-output.ps1` — wraps a shard's contract files + git metadata
  into the publishable `history.jsonl` row and `runs/<ts>-<sha>.json`.
- `build-manifest.ps1` — sweeps `data/<skill>/history.jsonl` last lines
  into `data/manifest.json`.
- `init-gh-pages.ps1` — one-shot helper to create the empty `gh-pages`
  orphan branch (must be run once per fresh repo before the workflow can
  publish anything).

**Workflow:** `.github/workflows/skill-eval.yml` (three jobs:
detect-changed-skills → eval matrix → publish).

**Run the Pester tests for the workflow scripts:**

```powershell
Invoke-Pester -Path tests/skill-eval/SkillEval.Tests.ps1 -Output Detailed
```

**Locally exercise the code-review reference run-eval (smoke adapter):**

```powershell
pwsh -File evals/code-review/run-eval.ps1 -OutDir ./tmp/eval-out
# Then wrap + publish into a local pages dir:
pwsh -File scripts/wrap-eval-output.ps1 `
  -Skill code-review `
  -EvalOutDir ./tmp/eval-out `
  -PagesDir ./tmp/pages `
  -Commit (git rev-parse HEAD)
pwsh -File scripts/build-manifest.ps1 -PagesDir ./tmp/pages
```

Set `$env:EVAL_ADAPTER=copilot` (or any bundled-adapter name) to switch
the reference run-eval to a real reviewer. Set `$env:EVAL_TRIALS=N` to
override the per-case trial count. Both env vars are honored by every
skill's `run-eval.ps1` per the contract in
`evals/_docs/run-eval-contract.md`.

### Configuring the CI workflow

The workflow defaults to the smoke adapter for every skill (free,
deterministic, **not a regression signal**). To switch all skills to a
real reviewer, set a single repo variable:

| Setting | Type | Value |
|---|---|---|
| `vars.EVAL_ADAPTER` | Repo variable | `copilot` (or `smoke`) — applies to every skill's `run-eval.ps1` |
| `vars.EVAL_TRIALS`  | Repo variable (optional) | Integer, e.g. `3` — trials per case where the pattern supports it |
| `secrets.COPILOT_PAT` | Repo secret | User-owned fine-grained PAT (see below) |

**Adapter resolution.** Each skill's `run-eval.ps1` reads
`$env:EVAL_ADAPTER` as a short name (e.g. `smoke`, `copilot`) and
resolves it to `adapters/<name>.ps1` under its own skill directory. So
`EVAL_ADAPTER=copilot` selects `evals/code-review/adapters/copilot.ps1`
today, and `evals/<future-skill>/adapters/copilot.ps1` once a future
skill ships its own copilot adapter. This is intentional: one
workflow-wide knob, one adapter naming convention per skill.

**Manual override.** The workflow's `workflow_dispatch` trigger
exposes an `adapter` input that takes precedence over `vars.EVAL_ADAPTER`
for that one run — useful for testing a real adapter before flipping
the repo-wide default, or for one-off backfills.

**Authentication for the Copilot adapter.** When `EVAL_ADAPTER`
resolves to `copilot`, the workflow installs the Copilot CLI and
exports `COPILOT_GITHUB_TOKEN` + `GH_TOKEN` from `secrets.COPILOT_PAT`
(those are the two env vars the CLI reads, with `COPILOT_GITHUB_TOKEN`
taking precedence). The fine-grained PAT just provides a GitHub
identity for the CLI to authenticate as — your account's Copilot
subscription is what gates Copilot access. For the bundled `copilot.ps1`
adapter the token needs no repo or API permissions; if you later extend
the adapter to fetch GitHub data, add the matching permissions then.

Create the PAT at
https://github.com/settings/personal-access-tokens/new and save it as
`COPILOT_PAT` under **Settings → Secrets and variables → Actions**.

When `EVAL_ADAPTER` does NOT contain `copilot`, the install steps are
skipped to keep CI fast and free.

