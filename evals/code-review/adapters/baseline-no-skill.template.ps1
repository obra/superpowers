<#
.SYNOPSIS
    Baseline adapter — invokes the LLM with NO skill, just a generic
    "review this diff" prompt. Establishes a floor for comparison.

    The detection-quality harness should run this in addition to the
    SKILL-enabled adapter. If the SKILL adapter doesn't substantially
    outperform this baseline on the corpus, the skill is not adding
    value.

    Copy this file, rename, and fill in the LLM invocation.
#>

param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$req = [Console]::In.ReadToEnd() | ConvertFrom-Json
$diff = Get-Content -LiteralPath $req.diffPath -Raw

$prSection = ''
if ($req.prDescriptionPath) {
    $prBody = Get-Content -LiteralPath $req.prDescriptionPath -Raw
    $prSection = "PR description:`n$prBody`n---`n"
}

$prompt = @"
Review the following code change. Be specific — for each issue, cite the
file and line, explain why it's a problem, and suggest a fix. Format your
review as Markdown with a Summary line and a Detailed Findings section.

$prSection
Diff:
$diff
"@

$sw = [System.Diagnostics.Stopwatch]::StartNew()

# === REPLACE THIS BLOCK WITH YOUR LLM CALL ===
$review = "## Code Review`n**Summary**: LGTM (baseline placeholder).`n`n### Detailed Findings`n"
# === END LLM CALL ===

$sw.Stop()
[Console]::Out.Write($review)
[Console]::Error.WriteLine("META: " + (@{ latency_ms = $sw.ElapsedMilliseconds; model = 'baseline-TODO' } | ConvertTo-Json -Compress))
exit 0
