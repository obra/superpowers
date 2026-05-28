#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Reviewer adapter that runs GitHub Copilot CLI as the LLM.

.DESCRIPTION
    Reads the harness adapter-request JSON from stdin, builds a review
    prompt that points Copilot at SKILL.md / the diff / the context
    directory, invokes `copilot -p ... --output-format json
    --allow-all-tools` non-interactively, extracts the final assistant
    message as the review markdown, and emits a META line with timing /
    token / tool-call counts on stderr.

    The adapter does NOT inline file contents into the prompt — it grants
    Copilot file-system access via --add-dir and instructs it to read the
    files itself. This matches the skill's "read whole files, not just
    the diff" expectation and keeps the prompt tiny.

    Environment overrides:
      COPILOT_REVIEW_MODEL    Passed through as --model (e.g. claude-opus-4.7,
                              gpt-5.3-codex). Defaults to the CLI default.
      COPILOT_REVIEW_EFFORT   Passed through as --effort (none|low|medium|
                              high|xhigh|max). Defaults to the CLI default.

    Prerequisites:
      - `copilot` on PATH (GitHub Copilot CLI).
      - User signed in (`copilot` interactive once is enough).

.NOTES
    The adapter MUST NOT read the case's expected.json. The harness stages
    each case into a sandbox that excludes it, so file-system access via
    --add-dir is safe.
#>

param()
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ----- 1. Parse adapter request from stdin -----
$req = [Console]::In.ReadToEnd() | ConvertFrom-Json

# ----- 2. Resolve absolute paths the model will read -----
# evals/code-review/adapters/copilot.ps1 -> repo-root/skills/code-review/SKILL.md
$skillPath = (Join-Path $PSScriptRoot '..' '..' '..' 'skills' 'code-review' 'SKILL.md' | Resolve-Path).Path
$diffAbs   = (Resolve-Path -LiteralPath $req.diffPath).Path
$ctxAbs    = (Resolve-Path -LiteralPath $req.contextDir).Path
$prAbs     = $null
if ($req.prDescriptionPath) {
    $prAbs = (Resolve-Path -LiteralPath $req.prDescriptionPath).Path
}

# ----- 3. Build the review prompt -----
$prSection = if ($prAbs) {
    "  - PR description: $prAbs (use it for Step 3 of the skill)"
} else {
    "  - No PR description; this is a standalone diff (skip the PR-mode steps)."
}

$prompt = @"
You are performing a code review by literally following a skill specification.

REQUIRED INPUTS — read these files yourself before writing anything:
  - Skill spec (the rubric you must follow): $skillPath
  - Diff to review: $diffAbs
  - Whole-file context (post-change files): $ctxAbs
$prSection

INSTRUCTIONS:
  1. Read the skill spec end-to-end and follow its multi-step process and
     output format exactly.
  2. Read the diff file end-to-end.
  3. Read whole files under the context directory whenever you need them.
     Do NOT rely on diff hunks alone — the skill explicitly requires
     whole-file understanding.
  4. Produce your review using the markdown structure the skill prescribes:
     '## ' H2 title, '### Holistic Assessment' with a '**Summary**:' line,
     '### Detailed Findings' with '#### ' H4 entries per finding, using the
     documented emoji severity markers.
  5. Your FINAL assistant message must contain ONLY the review markdown.
     No preamble, no meta-commentary, no narration of what you did, no
     trailing remarks — nothing outside the review itself.

Case ID: $($req.caseId)  (mode: $($req.mode), trial: $($req.trial)/$($req.trialsTotal))
"@

# ----- 4. Assemble copilot arguments -----
$copilotArgs = @(
    '-p', $prompt
    '--output-format', 'json'
    '--allow-all-tools'
    '--add-dir', (Split-Path -Parent $skillPath)
    '--add-dir', $ctxAbs
    '--add-dir', (Split-Path -Parent $diffAbs)
    '--no-color'
    '--log-level', 'none'
)
if ($env:COPILOT_REVIEW_MODEL)  { $copilotArgs += @('--model',  $env:COPILOT_REVIEW_MODEL) }
if ($env:COPILOT_REVIEW_EFFORT) { $copilotArgs += @('--effort', $env:COPILOT_REVIEW_EFFORT) }

# ----- 5. Invoke copilot, capturing JSONL stdout -----
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$rawOutput = & copilot @copilotArgs
$copilotExit = $LASTEXITCODE
$sw.Stop()

# ----- 6. Parse the JSONL event stream -----
$events = foreach ($line in $rawOutput) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    try { $line | ConvertFrom-Json } catch { continue }
}

$assistantMessages = @($events | Where-Object { $_.type -eq 'assistant.message' })
if ($assistantMessages.Count -eq 0) {
    [Console]::Error.WriteLine("copilot adapter: no assistant.message events (copilot exit=$copilotExit). Raw output follows:")
    [Console]::Error.WriteLine(($rawOutput -join "`n"))
    if ($copilotExit -ne 0) { exit $copilotExit } else { exit 1 }
}

$finalMessage = $assistantMessages[-1]
$review = [string]$finalMessage.data.content
[Console]::Out.Write($review)

# ----- 7. Aggregate META on stderr -----
$model = [string]$finalMessage.data.model

$tokensOut = 0
$tokenSamples = @($assistantMessages | ForEach-Object {
    if ($_.data.PSObject.Properties['outputTokens'] -and $_.data.outputTokens) {
        [int]$_.data.outputTokens
    }
})
if ($tokenSamples.Count -gt 0) {
    $tokensOut = [int](($tokenSamples | Measure-Object -Sum).Sum)
}

$toolCalls = 0
$toolCallSamples = @($assistantMessages | ForEach-Object {
    if ($_.data.PSObject.Properties['toolRequests'] -and $_.data.toolRequests) {
        @($_.data.toolRequests).Count
    } else { 0 }
})
if ($toolCallSamples.Count -gt 0) {
    $toolCalls = [int](($toolCallSamples | Measure-Object -Sum).Sum)
}

$apiMs = $null
$resultEvent = @($events | Where-Object { $_.type -eq 'result' }) | Select-Object -Last 1
if ($resultEvent -and $resultEvent.PSObject.Properties['usage'] -and $resultEvent.usage `
        -and $resultEvent.usage.PSObject.Properties['totalApiDurationMs']) {
    $apiMs = [int]$resultEvent.usage.totalApiDurationMs
}

$meta = [ordered]@{
    adapter     = 'copilot'
    model       = $model
    latency_ms  = [int]$sw.ElapsedMilliseconds
    api_ms      = $apiMs
    tokens_out  = $tokensOut
    tool_calls  = $toolCalls
} | ConvertTo-Json -Compress
[Console]::Error.WriteLine("META: $meta")

exit 0
