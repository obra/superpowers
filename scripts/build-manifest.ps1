<#
.SYNOPSIS
    Regenerate `data/manifest.json` on the gh-pages branch by sweeping every
    `data/<skill>/history.jsonl`.

.DESCRIPTION
    Output schema (excerpt):

      schema_version    : 1
      generated_at      : ISO-8601 UTC
      repository        : "owner/name" (for commit-URL construction)
      sparkline_length  : int (count of trailing points emitted per skill)
      regression_window : int (count of trailing ok-to-ok transitions scanned)
      worst_recent_drop : { skill, from, to, delta, commit, short_sha, ... } or null
      skills[*]         :
        name                 : string
        pattern              : "A".."F" or null
        latest               : last-row summary (includes commit_message)
        run_count            : int
        sparkline            : [{short_sha,timestamp,status,headline_score}, ...]
        biggest_drop_last_10 : drop summary or null

    The dashboard renders this manifest directly on the landing page and uses
    it to avoid N+1 fetches of every skill's full `history.jsonl`.

.PARAMETER PagesDir
    Root of the gh-pages checkout (the directory containing `data/`).

.PARAMETER Repository
    Optional override for the "owner/name" repo identifier. Defaults to
    $env:GITHUB_REPOSITORY, then to parsing `git config remote.origin.url`.

.PARAMETER SparklineLength
    Number of trailing history rows to emit per skill for the landing-page
    sparkline. Default: 20.

.PARAMETER RegressionWindow
    Number of trailing ok-to-ok score transitions to scan when computing
    the biggest recent drop per skill (and globally). Default: 10.

.EXAMPLE
    pwsh -File scripts/build-manifest.ps1 -PagesDir _pages

.EXAMPLE
    pwsh -File scripts/build-manifest.ps1 -PagesDir _pages -Repository owner/repo
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string] $PagesDir,
    [string] $Repository,
    [int] $SparklineLength = 20,
    [int] $RegressionWindow = 10
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$pagesRoot = (Resolve-Path -LiteralPath $PagesDir -ErrorAction Stop).Path
$dataRoot = Join-Path $pagesRoot 'data'
if (-not (Test-Path -LiteralPath $dataRoot -PathType Container)) {
    # No data directory yet — emit empty manifest at the expected path.
    $null = New-Item -ItemType Directory -Path $dataRoot -Force
}

# Resolve the repository ("owner/name") so the dashboard can build commit
# URLs without inferring them from window.location (which breaks for custom
# domains, user-pages sites, and renamed repos). Precedence: explicit
# parameter > $env:GITHUB_REPOSITORY (CI) > parse of `origin` remote.
function Resolve-Repository {
    param([string] $Explicit)
    if ($Explicit) { return $Explicit }
    if ($env:GITHUB_REPOSITORY) { return $env:GITHUB_REPOSITORY }
    try {
        $remoteUrl = (& git config --get remote.origin.url 2>$null)
        if ($remoteUrl) {
            # Match both git@host:owner/name(.git)? and https://host/owner/name(.git)?
            if ($remoteUrl -match '[:/]([^:/]+)/([^/]+?)(?:\.git)?\s*$') {
                return "$($Matches[1])/$($Matches[2])"
            }
        }
    } catch { }
    return $null
}

$resolvedRepository = Resolve-Repository -Explicit $Repository

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Get-Property {
    param($Object, [string] $Name, $Default = $null)
    if ($null -eq $Object) { return $Default }
    if ($Object.PSObject.Properties.Name -contains $Name) { return $Object.$Name }
    return $Default
}

# Read history.jsonl ONCE per skill and return a structured summary.
# Avoids the O(file_size * lookups_per_skill) cost of repeatedly
# ReadAllText-ing the same file for last row, second-last row, last
# non-null pattern, and run count.
function Read-HistorySummary {
    param([string] $Path)
    $result = [PSCustomObject]@{
        RunCount        = 0
        Last            = $null
        Previous        = $null
        LastNonNullPattern = $null
        AllRows         = @()
    }
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $result }
    $rawLines = [System.IO.File]::ReadAllLines($Path, $utf8NoBom)
    $parsed = New-Object System.Collections.Generic.List[object]
    foreach ($line in $rawLines) {
        if (-not $line.Trim()) { continue }
        try {
            $obj = $line | ConvertFrom-Json
            [void]$parsed.Add($obj)
        } catch {
            Write-Warning "Skipping unparseable line in $Path : $($_.Exception.Message)"
        }
    }
    $result.RunCount = $parsed.Count
    if ($parsed.Count -ge 1) {
        $result.Last = $parsed[$parsed.Count - 1]
    }
    if ($parsed.Count -ge 2) {
        $result.Previous = $parsed[$parsed.Count - 2]
    }
    # Walk back for the most recent non-null pattern.
    for ($i = $parsed.Count - 1; $i -ge 0; $i--) {
        $p = Get-Property $parsed[$i] 'pattern' $null
        if ($p) { $result.LastNonNullPattern = $p; break }
    }
    $result.AllRows = $parsed.ToArray()
    return $result
}

# Build the per-skill sparkline payload: the trailing N rows, with score +
# status + short_sha + timestamp. The dashboard renders nulls as gaps.
function Build-Sparkline {
    param([object[]] $Rows, [int] $Length)
    if (-not $Rows -or $Rows.Count -eq 0) { return @() }
    $start = [Math]::Max(0, $Rows.Count - $Length)
    $tail = $Rows[$start..($Rows.Count - 1)]
    $points = @()
    foreach ($row in $tail) {
        $points += [ordered]@{
            short_sha      = (Get-Property $row 'short_sha' $null)
            timestamp      = (Get-Property $row 'timestamp' $null)
            status         = (Get-Property $row 'status' $null)
            headline_score = (Get-Property $row 'headline_score' $null)
        }
    }
    return ,@($points | ForEach-Object { [PSCustomObject]$_ })
}

# Find the worst drop in the last $Window successful-to-successful
# transitions. Error rows are ignored (they're surfaced separately as
# "latest run failed"). Returns $null when there are fewer than 2 ok rows.
function Find-BiggestDrop {
    param([object[]] $Rows, [int] $Window)
    if (-not $Rows -or $Rows.Count -lt 2) { return $null }
    # Filter to successful, numerically-scored rows, preserving order.
    $okRows = @()
    foreach ($row in $Rows) {
        $score = Get-Property $row 'headline_score' $null
        $status = Get-Property $row 'status' $null
        if ($status -eq 'ok' -and $null -ne $score) {
            $okRows += $row
        }
    }
    if ($okRows.Count -lt 2) { return $null }

    # Build transitions = adjacent (prev, curr) pairs in the ok-only sequence.
    $transitions = @()
    for ($i = 1; $i -lt $okRows.Count; $i++) {
        $prev = $okRows[$i - 1]
        $curr = $okRows[$i]
        $delta = [math]::Round([double](Get-Property $curr 'headline_score' 0) - [double](Get-Property $prev 'headline_score' 0), 2)
        $transitions += [PSCustomObject]@{
            From          = [double](Get-Property $prev 'headline_score' 0)
            To            = [double](Get-Property $curr 'headline_score' 0)
            Delta         = $delta
            Commit        = (Get-Property $curr 'commit' $null)
            ShortSha      = (Get-Property $curr 'short_sha' $null)
            Timestamp     = (Get-Property $curr 'timestamp' $null)
            CommitMessage = (Get-Property $curr 'commit_message' $null)
        }
    }
    if ($transitions.Count -eq 0) { return $null }

    $start = [Math]::Max(0, $transitions.Count - $Window)
    $recent = $transitions[$start..($transitions.Count - 1)]

    $worst = $null
    foreach ($t in $recent) {
        if ($t.Delta -ge 0) { continue }
        if (-not $worst -or $t.Delta -lt $worst.Delta) { $worst = $t }
    }
    if (-not $worst) { return $null }
    return [ordered]@{
        from           = $worst.From
        to             = $worst.To
        delta          = $worst.Delta
        commit         = $worst.Commit
        short_sha      = $worst.ShortSha
        timestamp      = $worst.Timestamp
        commit_message = $worst.CommitMessage
    }
}

$skillEntries = @()
$worstGlobal = $null
$skillDirs = @(Get-ChildItem -LiteralPath $dataRoot -Directory -ErrorAction SilentlyContinue)
foreach ($dir in ($skillDirs | Sort-Object Name)) {
    $historyPath = Join-Path $dir.FullName 'history.jsonl'
    $summary = Read-HistorySummary -Path $historyPath
    $last = $summary.Last
    if (-not $last) { continue }
    $prev = $summary.Previous
    $lastScore = Get-Property $last 'headline_score' $null
    $prevScore = Get-Property $prev 'headline_score' $null
    $delta = $null
    if ($null -ne $lastScore -and $null -ne $prevScore) {
        $delta = [math]::Round([double]$lastScore - [double]$prevScore, 2)
    }

    $runCount = $summary.RunCount

    # When the latest row is an error and has no pattern, carry forward
    # the most recent known pattern so the dashboard can still render the
    # correct chart type for the skill.
    $pattern = Get-Property $last 'pattern' $null
    if (-not $pattern) {
        $pattern = $summary.LastNonNullPattern
    }

    $latest = [ordered]@{
        commit               = (Get-Property $last 'commit' $null)
        short_sha            = (Get-Property $last 'short_sha' $null)
        timestamp            = (Get-Property $last 'timestamp' $null)
        commit_message       = (Get-Property $last 'commit_message' $null)
        headline_score       = $lastScore
        delta_from_previous  = $delta
        status               = (Get-Property $last 'status' $null)
        adapter              = (Get-Property $last 'adapter' $null)
    }

    $sparkline = Build-Sparkline -Rows $summary.AllRows -Length $SparklineLength
    $biggestDrop = Find-BiggestDrop -Rows $summary.AllRows -Window $RegressionWindow

    if ($biggestDrop) {
        # Promote per-skill drops to the global "worst recent drop" if
        # they're more severe than what we've seen so far.
        if (-not $worstGlobal -or $biggestDrop.delta -lt $worstGlobal.delta) {
            $globalDrop = [ordered]@{
                skill          = $dir.Name
                from           = $biggestDrop.from
                to             = $biggestDrop.to
                delta          = $biggestDrop.delta
                commit         = $biggestDrop.commit
                short_sha      = $biggestDrop.short_sha
                timestamp      = $biggestDrop.timestamp
                commit_message = $biggestDrop.commit_message
            }
            $worstGlobal = $globalDrop
        }
    }

    $skillEntries += [ordered]@{
        name                  = $dir.Name
        pattern               = $pattern
        latest                = [PSCustomObject]$latest
        run_count             = $runCount
        sparkline             = $sparkline
        biggest_drop_last_10  = $(if ($biggestDrop) { [PSCustomObject]$biggestDrop } else { $null })
    }
}

$manifest = [ordered]@{
    schema_version     = 1
    generated_at       = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    repository         = $resolvedRepository
    sparkline_length   = $SparklineLength
    regression_window  = $RegressionWindow
    worst_recent_drop  = $(if ($worstGlobal) { [PSCustomObject]$worstGlobal } else { $null })
    skills             = @($skillEntries | ForEach-Object { [PSCustomObject]$_ })
}

$manifestJson = [PSCustomObject]$manifest | ConvertTo-Json -Depth 20
$manifestPath = Join-Path $dataRoot 'manifest.json'
[System.IO.File]::WriteAllText($manifestPath, $manifestJson, $utf8NoBom)

Write-Host "Wrote $manifestPath ($($skillEntries.Count) skill(s))"
