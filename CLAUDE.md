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

