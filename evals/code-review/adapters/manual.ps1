<#
.SYNOPSIS
    Manual reviewer adapter — for smoke-testing the harness only.

    Prints the assembled prompt (SKILL.md + diff + context listing) to
    stderr, then reads pasted review markdown from stdin until EOF
    (Ctrl-Z on Windows / Ctrl-D on Unix).

    DO NOT USE FOR BENCHMARK SCORING. The human pasting the review
    contaminates the experiment — they may unconsciously include hints,
    omit context, or "improve" the review.
#>

param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# The harness pipes the JSON request to our stdin first, then we need a
# second stdin for the human paste. Because we only have one stdin, this
# adapter is interactive-only: invoke it directly, not through the harness.
#
# Usage (smoke test of one case):
#   $req = @{ caseId = 'x'; mode = 'standalone'; diffPath = 'path/to/diff.patch'; contextDir = 'path/to/ctx'; prDescriptionPath = $null; trial = 1; trialsTotal = 1 } | ConvertTo-Json
#   $req | ./manual.ps1
#
# When invoked by Run-DetectionEval.ps1, the harness reads the JSON request
# off stdin (so the second "paste your review now" prompt would have nothing
# to read). That's fine for *demo runs* where you replace stdin in advance
# (see manual-smoke.ps1 helper if you build one).

$req = [Console]::In.ReadToEnd() | ConvertFrom-Json

$skillPath = Join-Path $PSScriptRoot '..' '..' 'SKILL.md' | Resolve-Path
$skill = Get-Content -LiteralPath $skillPath -Raw
$diff  = Get-Content -LiteralPath $req.diffPath -Raw -ErrorAction SilentlyContinue
$prText = ''
if ($req.prDescriptionPath -and (Test-Path -LiteralPath $req.prDescriptionPath)) {
    $prText = Get-Content -LiteralPath $req.prDescriptionPath -Raw
}

$contextListing = ''
if (Test-Path -LiteralPath $req.contextDir -PathType Container) {
    $contextListing = Get-ChildItem -LiteralPath $req.contextDir -File -Recurse |
        ForEach-Object { $_.FullName.Substring($req.contextDir.Length).TrimStart('\','/') } |
        Sort-Object | Out-String
}

[Console]::Error.WriteLine("--- MANUAL ADAPTER ---")
[Console]::Error.WriteLine("Case: $($req.caseId)  Mode: $($req.mode)  Trial: $($req.trial)/$($req.trialsTotal)")
[Console]::Error.WriteLine("Diff path:    $($req.diffPath)")
[Console]::Error.WriteLine("Context dir:  $($req.contextDir)")
if ($req.prDescriptionPath) {
    [Console]::Error.WriteLine("PR doc:       $($req.prDescriptionPath)")
}
[Console]::Error.WriteLine("")
[Console]::Error.WriteLine("Context files:")
[Console]::Error.WriteLine($contextListing)
[Console]::Error.WriteLine("")
[Console]::Error.WriteLine("SKILL.md is at: $skillPath")
[Console]::Error.WriteLine("")
[Console]::Error.WriteLine("Run a reviewer (e.g., open Claude / Copilot CLI with the SKILL prompt + diff)")
[Console]::Error.WriteLine("and paste the resulting review markdown here. Finish with Ctrl-Z + Enter on Windows.")
[Console]::Error.WriteLine("--- end ---")

# In real interactive use, the operator would invoke this with the JSON
# piped from a file, leaving stdin free for the paste. The harness's
# single-pipe model means this adapter is primarily a documentation
# example; production adapters call the LLM directly.

# Echo a tiny placeholder so the harness sees something parseable.
$placeholder = @"
## 🤖 Code Review

### Holistic Assessment

**Motivation**: (manual adapter placeholder — no review was generated)

**Approach**: (manual adapter placeholder)

**Summary**: ⚠️ Needs Human Review — the manual adapter cannot generate a review without an interactive paste step.

### Detailed Findings

(none — replace this adapter with a real one to evaluate the skill)
"@

[Console]::Out.Write($placeholder)
[Console]::Error.WriteLine("META: " + (@{ latency_ms = 0; model = 'manual'; note = 'placeholder review only' } | ConvertTo-Json -Compress))
exit 0
