<#
.SYNOPSIS
    Wrap a single skill-eval shard's outputs into the publishable JSON
    shapes for the gh-pages dashboard data feed.

.DESCRIPTION
    Reads `<EvalOutDir>/headline-score.json` and `<EvalOutDir>/run-detail.json`
    produced by `evals/<skill>/run-eval.ps1` (both are required for
    `status: "ok"` runs per the run-eval contract — see
    `evals/_docs/run-eval-contract.md`), combines them with run metadata
    (skill, commit, timestamp, etc.), and writes:

      * `<PagesDir>/data/<skill>/history.jsonl` — one JSON object appended
        per run (compressed, UTF-8, LF terminated).
      * `<PagesDir>/data/<skill>/runs/<TimestampSafe>-<ShortSha>.json` —
        the full per-run drill-down record.

    If `<EvalOutDir>/headline-score.json` is missing or unreadable, an
    `status: "error"` row is still emitted so the dashboard shows a gap
    rather than silence. The same demotion applies if `run-detail.json`
    is missing or unparseable on an otherwise-ok run — the contract
    requires both files together, and the publisher refuses to write a
    misleading "ok" row that would link to an empty drill-down.

.PARAMETER Skill
    Skill name (must match `evals/<skill>/`).

.PARAMETER EvalOutDir
    Directory produced by run-eval.ps1, which MUST contain
    headline-score.json AND run-detail.json for a successful run, per
    the run-eval contract. Missing run-detail.json on a status:ok
    headline is treated as a producer bug and demotes the row to error.

.PARAMETER PagesDir
    Root of the gh-pages checkout where data/ lives.

.PARAMETER Commit
    Full commit SHA the eval ran against.

.PARAMETER CommitMessage
    First line of the commit message.

.PARAMETER CommitAuthor
    Author name / email of the commit.

.PARAMETER Timestamp
    ISO-8601 UTC timestamp string (e.g. 2026-05-29T07:30:00Z). Defaults to
    UtcNow if omitted.

.PARAMETER WorkflowRunUrl
    URL to the workflow run that produced the data (for traceability).

.EXAMPLE
    pwsh -File scripts/wrap-eval-output.ps1 `
        -Skill code-review `
        -EvalOutDir _artifacts/eval-output-code-review `
        -PagesDir _pages `
        -Commit $env:GITHUB_SHA `
        -CommitMessage "Fix race condition" `
        -CommitAuthor "alice <alice@example.com>" `
        -WorkflowRunUrl "https://github.com/owner/repo/actions/runs/123"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string] $Skill,
    [Parameter(Mandatory)] [string] $EvalOutDir,
    [Parameter(Mandatory)] [string] $PagesDir,
    [Parameter(Mandatory)] [string] $Commit,
    [string] $CommitMessage = '',
    [string] $CommitAuthor  = '',
    [string] $Timestamp,
    [string] $WorkflowRunUrl = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not $Timestamp) {
    $Timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
}

$shortSha = if ($Commit.Length -ge 7) { $Commit.Substring(0,7) } else { $Commit }
$timestampSafe = $Timestamp -replace ':', '-'

$evalOut = (Resolve-Path -LiteralPath $EvalOutDir -ErrorAction Stop).Path
$pagesRoot = New-Item -ItemType Directory -Path $PagesDir -Force
$pagesRoot = (Resolve-Path -LiteralPath $pagesRoot.FullName).Path

$skillDataDir = Join-Path (Join-Path $pagesRoot "data") $Skill
$runsDir = Join-Path $skillDataDir "runs"
$null = New-Item -ItemType Directory -Path $runsDir -Force

$historyPath = Join-Path $skillDataDir "history.jsonl"
$detailFileRel = "runs/$timestampSafe-$shortSha.json"
$detailPath = Join-Path $runsDir "$timestampSafe-$shortSha.json"

# --- Load contract files (gracefully handle missing/broken) --------------

$headlinePath = Join-Path $evalOut "headline-score.json"
$detailInPath = Join-Path $evalOut "run-detail.json"

$headline = $null
$loadError = $null
if (Test-Path -LiteralPath $headlinePath -PathType Leaf) {
    try {
        $headline = Get-Content -LiteralPath $headlinePath -Raw -Encoding utf8 | ConvertFrom-Json
    } catch {
        $loadError = "Failed to parse headline-score.json: $($_.Exception.Message)"
    }
} else {
    $loadError = "headline-score.json not produced by run-eval.ps1"
}

$detailIn = $null
$detailLoadError = $null
if (Test-Path -LiteralPath $detailInPath -PathType Leaf) {
    try {
        $detailIn = Get-Content -LiteralPath $detailInPath -Raw -Encoding utf8 | ConvertFrom-Json
    } catch {
        $detailLoadError = "Failed to parse run-detail.json: $($_.Exception.Message)"
    }
} else {
    $detailLoadError = "run-detail.json not produced by run-eval.ps1"
}

# Even a parseable run-detail.json must carry a non-null `detail` field
# per the contract; otherwise the drill-down page renders as empty.
if (-not $detailLoadError -and $null -ne $detailIn) {
    $detailHasField = $detailIn.PSObject.Properties.Name -contains 'detail'
    if (-not $detailHasField) {
        $detailLoadError = "run-detail.json is missing required 'detail' field"
    } elseif ($null -eq $detailIn.detail) {
        $detailLoadError = "run-detail.json 'detail' field is null"
    }
}

# --- Build history row ---------------------------------------------------

function Get-Property {
    param($Object, [string] $Name, $Default = $null)
    if ($null -eq $Object) { return $Default }
    if ($Object.PSObject.Properties.Name -contains $Name) { return $Object.$Name }
    return $Default
}

$status = if ($loadError) { 'error' } else { (Get-Property $headline 'status' 'error') }

# Validate contract: a status:"ok" headline MUST have a numeric
# headline_score in [0,100] and a non-null pattern, AND run-detail.json
# must be present and parseable. If any of those is missing, the
# run-eval.ps1 broke its own contract — demote to error so the publisher
# doesn't write a misleading "ok" row that breaks downstream consumers
# (e.g., a drill-down link that resolves to detail:null).
if ($status -eq 'ok') {
    $okPattern = Get-Property $headline 'pattern' $null
    $okScore   = Get-Property $headline 'headline_score' $null
    $violations = @()
    if (-not $okPattern)    { $violations += "pattern is null" }
    if ($null -eq $okScore) { $violations += "headline_score is null" }
    elseif ($okScore -isnot [double] -and $okScore -isnot [int] -and $okScore -isnot [long] -and $okScore -isnot [decimal]) {
        $violations += "headline_score is not numeric (got $($okScore.GetType().Name))"
    }
    elseif ([double]$okScore -lt 0 -or [double]$okScore -gt 100) {
        $violations += "headline_score $okScore is outside [0,100]"
    }
    if ($detailLoadError) {
        $violations += $detailLoadError
    }
    if ($violations) {
        $status = 'error'
        $loadError = "contract violation: status='ok' but " + ($violations -join '; ')
        Write-Warning $loadError
    }
}

$row = [ordered]@{
    commit          = $Commit
    short_sha       = $shortSha
    timestamp       = $Timestamp
    commit_message  = $CommitMessage
    commit_author   = $CommitAuthor
    pattern         = (Get-Property $headline 'pattern' $null)
    adapter         = (Get-Property $headline 'adapter' $null)
    trials          = (Get-Property $headline 'trials' $null)
    headline_score  = $(if ($status -eq 'ok') { Get-Property $headline 'headline_score' $null } else { $null })
    status          = $status
    metrics         = (Get-Property $headline 'metrics' $null)
    detail_file     = if ($status -eq 'ok') { $detailFileRel } else { $null }
}
if ($status -eq 'error') {
    $row['error'] = if ($loadError) { $loadError } else { (Get-Property $headline 'error' 'unknown error') }
}

$rowJson = [PSCustomObject]$row | ConvertTo-Json -Compress -Depth 30

# JSONL: append exactly one line + LF. UTF-8 without BOM.
# Read only the trailing byte of the existing file (if any) to decide
# whether to prepend a newline — avoids rewriting the whole file on
# every publish, which would be O(file size) per run.
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$prefix = ''
if (Test-Path -LiteralPath $historyPath -PathType Leaf) {
    $fi = New-Object System.IO.FileInfo $historyPath
    if ($fi.Length -gt 0) {
        $fs = [System.IO.File]::Open($historyPath, 'Open', 'Read', 'ReadWrite')
        try {
            [void]$fs.Seek(-1, [System.IO.SeekOrigin]::End)
            $lastByte = $fs.ReadByte()
            if ($lastByte -ne 0x0A) { $prefix = "`n" }
        } finally {
            $fs.Dispose()
        }
    }
}
[System.IO.File]::AppendAllText($historyPath, ($prefix + $rowJson + "`n"), $utf8NoBom)

# --- Build per-run drill-down record (only for ok runs) -----------------

if ($status -eq 'ok') {
    $detail = [ordered]@{
        schema_version    = 1
        skill             = $Skill
        pattern           = (Get-Property $headline 'pattern' $null)
        commit            = $Commit
        short_sha         = $shortSha
        commit_message    = $CommitMessage
        commit_author     = $CommitAuthor
        timestamp         = $Timestamp
        workflow_run_url  = $WorkflowRunUrl
        adapter           = (Get-Property $headline 'adapter' $null)
        trials            = (Get-Property $headline 'trials' $null)
        headline_score    = (Get-Property $headline 'headline_score' $null)
        metrics           = (Get-Property $headline 'metrics' $null)
        detail            = (Get-Property $detailIn 'detail' $null)
    }
    $detailJson = [PSCustomObject]$detail | ConvertTo-Json -Depth 50
    [System.IO.File]::WriteAllText($detailPath, $detailJson, $utf8NoBom)
}

# --- Echo what we wrote --------------------------------------------------

Write-Host "Wrote history row to $historyPath ($status)"
if ($status -eq 'ok') {
    Write-Host "Wrote run detail to $detailPath"
}
