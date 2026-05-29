<#
.SYNOPSIS
    Regenerate `data/manifest.json` on the gh-pages branch by sweeping the
    last row of every `data/<skill>/history.jsonl`.

.PARAMETER PagesDir
    Root of the gh-pages checkout (the directory containing `data/`).

.EXAMPLE
    pwsh -File scripts/build-manifest.ps1 -PagesDir _pages
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string] $PagesDir
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$pagesRoot = (Resolve-Path -LiteralPath $PagesDir -ErrorAction Stop).Path
$dataRoot = Join-Path $pagesRoot 'data'
if (-not (Test-Path -LiteralPath $dataRoot -PathType Container)) {
    # No data directory yet — emit empty manifest at the expected path.
    $null = New-Item -ItemType Directory -Path $dataRoot -Force
}

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
    return $result
}

$skillEntries = @()
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
        headline_score       = $lastScore
        delta_from_previous  = $delta
        status               = (Get-Property $last 'status' $null)
        adapter              = (Get-Property $last 'adapter' $null)
    }

    $skillEntries += [ordered]@{
        name      = $dir.Name
        pattern   = $pattern
        latest    = [PSCustomObject]$latest
        run_count = $runCount
    }
}

$manifest = [ordered]@{
    schema_version = 1
    generated_at   = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    skills         = @($skillEntries | ForEach-Object { [PSCustomObject]$_ })
}

$manifestJson = [PSCustomObject]$manifest | ConvertTo-Json -Depth 20
$manifestPath = Join-Path $dataRoot 'manifest.json'
[System.IO.File]::WriteAllText($manifestPath, $manifestJson, $utf8NoBom)

Write-Host "Wrote $manifestPath ($($skillEntries.Count) skill(s))"
