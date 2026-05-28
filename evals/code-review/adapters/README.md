# Reviewer Adapters

The harness is decoupled from any specific LLM/CLI by the **adapter
contract**. An adapter is a single executable script that turns a JSON
request into review markdown.

## Contract

The harness writes one JSON object to the adapter's **stdin**:

```jsonc
{
  "caseId":            "ssrf-fetch-no-allowlist",
  "mode":              "standalone",            // "standalone" | "pr"
  "diffPath":          "C:/tmp/.../diff.patch",
  "contextDir":        "C:/tmp/.../context",
  "prDescriptionPath": null,                    // string or null
  "trial":             1,
  "trialsTotal":       3
}
```

The adapter must:

1. Read and parse stdin.
2. Construct a review prompt that incorporates `SKILL.md` (or whatever skill
   you are evaluating) and the diff + context.
3. Invoke its LLM / CLI / API of choice.
4. Write the **review markdown** to **stdout**.
5. Exit 0 on success; non-zero on failure.

**The adapter MUST NOT read `expected.json`.** The harness stages each
case into a temporary directory excluding it, so accidental reads are
impossible — but adapters that try to crawl the project tree should still
honor this contract.

### Optional: cost / model metadata

The adapter MAY emit one line to **stderr** in the form:

```
META: {"latency_ms": 12340, "tokens_in": 1820, "tokens_out": 540, "tool_calls": 12, "model": "claude-opus-4.7"}
```

The harness parses this and aggregates it into the run summary.

## Bundled adapters

| File | Purpose |
|------|---------|
| `copilot.ps1` | Real adapter that drives [GitHub Copilot CLI](https://docs.github.com/copilot/cli) (`copilot -p ... --output-format json --allow-all-tools`). Override model via `COPILOT_REVIEW_MODEL`, reasoning effort via `COPILOT_REVIEW_EFFORT`. |
| `manual.ps1` | Prints the request + the SKILL prompt and reads a pasted review from stdin. Smoke tests only — **never use for benchmark scoring** (human contamination). |
| `template.ps1` | Annotated skeleton — copy and customize for a real LLM CLI. |
| `baseline-no-skill.template.ps1` | Skeleton baseline that omits SKILL.md and asks the LLM to "review this diff". Establishes a floor. |

## Writing an adapter

```powershell
# adapters/my-cli.ps1
param()
$ErrorActionPreference = 'Stop'
$req = [Console]::In.ReadToEnd() | ConvertFrom-Json

$skill = Get-Content -LiteralPath (Join-Path $PSScriptRoot '..' '..' 'SKILL.md') -Raw
$diff  = Get-Content -LiteralPath $req.diffPath -Raw
$pr    = if ($req.prDescriptionPath) { Get-Content -LiteralPath $req.prDescriptionPath -Raw } else { '' }

$prompt = @"
You are a code reviewer following this skill spec:

$skill

Review the following diff. Files referenced in the diff can be inspected
under: $($req.contextDir)

$(if ($pr) { "PR description:`n$pr`n`n---`n" })

Diff:
$diff
"@

$sw = [System.Diagnostics.Stopwatch]::StartNew()
$review = my-llm-cli --prompt $prompt    # or: invoke the API of your choice
$sw.Stop()

[Console]::Out.Write($review)
[Console]::Error.WriteLine(("META: " + (@{ latency_ms = $sw.ElapsedMilliseconds; model = 'my-model' } | ConvertTo-Json -Compress)))
exit 0
```

## Notes on PR-mode vs standalone-mode

The harness sets `mode` based on whether the case includes `pr.md`. In
standalone mode `prDescriptionPath` is `null`. Adapters should pass the
PR description to the model only when it's provided — `SKILL.md`'s Step 3
is explicitly conditional on PR mode.

## Adapter context discipline

The skill assumes the reviewer can read **whole files**, not just the diff.
The harness gives you `contextDir` for exactly that purpose. A faithful
adapter:

- exposes `contextDir` to the LLM as a readable workspace,
- does NOT silently truncate large files,
- documents in `META:` whether it gave the LLM tool access (`tool_calls`).

Adapters that secretly hide context from the model will produce worse
reviews and bias the harness against the skill, not against the adapter.
