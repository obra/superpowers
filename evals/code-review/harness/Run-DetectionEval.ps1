<#
.SYNOPSIS
    Run the detection-quality evaluation: walk fixture directories,
    invoke a reviewer adapter for each case (optionally N trials),
    score the output, and write per-case + summary results.

.PARAMETER Adapter
    Path to a reviewer adapter script. The adapter receives a JSON request
    on stdin and must return review markdown on stdout (exit code 0).
    See adapters/README.md for the contract.

.PARAMETER Fixtures
    Either a directory of cases (each subdirectory is a case) or a single
    case directory. The harness auto-detects.

.PARAMETER OutDir
    Directory to write results into. Created if missing. Defaults to
    ./results/run-<timestamp>.

.PARAMETER Trials
    How many times to run the adapter per case. Default 1.

.PARAMETER LineWindow
    Line-proximity window for matching. Default 8.

.PARAMETER SemanticThreshold
    Minimum semantic-keyword hits for a file-level (no-line) match. Default 2.

.PARAMETER LocationKeywordMin
    Minimum semantic-keyword hits required when matching by location.
    Prevents two bugs with overlapping evidence_regions from collapsing onto
    the same finding. Default 1; set 0 to restore location-only matching.

.PARAMETER TimeoutSeconds
    Per-trial adapter timeout. Default 600.

.EXAMPLE
    ./Run-DetectionEval.ps1 -Adapter ./adapters/manual.ps1 `
                            -Fixtures ./fixtures/detection/dev `
                            -Trials 1
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string] $Adapter,
    [Parameter(Mandatory)] [string] $Fixtures,
    [string] $OutDir,
    [int]    $Trials = 1,
    [int]    $LineWindow = 8,
    [int]    $SemanticThreshold = 2,
    [int]    $LocationKeywordMin = 1,
    [int]    $TimeoutSeconds = 600
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$libRoot = Join-Path $PSScriptRoot 'lib'
Import-Module (Join-Path $libRoot 'Parse-Review.psm1')   -Force
Import-Module (Join-Path $libRoot 'Match-Findings.psm1') -Force
Import-Module (Join-Path $libRoot 'Schema.psm1')         -Force

# --- Resolve paths -------------------------------------------------------

$adapterPath = (Resolve-Path -LiteralPath $Adapter).Path
$fixturesPath = (Resolve-Path -LiteralPath $Fixtures).Path

if (-not $OutDir) {
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $OutDir = Join-Path $PSScriptRoot ".." "results" "run-$stamp"
}
$null = New-Item -ItemType Directory -Path $OutDir -Force
$OutDir = (Resolve-Path -LiteralPath $OutDir).Path

# --- Discover cases ------------------------------------------------------

function Find-Cases {
    param([string] $Path)
    # A "case directory" contains expected.json + diff.patch.
    if (Test-Path (Join-Path $Path 'expected.json') -PathType Leaf) {
        return ,(Get-Item $Path)
    }
    Get-ChildItem -LiteralPath $Path -Directory -Recurse |
        Where-Object {
            (Test-Path (Join-Path $_.FullName 'expected.json') -PathType Leaf) -and
            (Test-Path (Join-Path $_.FullName 'diff.patch')    -PathType Leaf)
        }
}

$cases = @(Find-Cases -Path $fixturesPath)
if ($cases.Count -eq 0) {
    Write-Error "No fixture cases found under $fixturesPath"
    exit 2
}

Write-Host "Discovered $($cases.Count) case(s) under $fixturesPath" -ForegroundColor Cyan
Write-Host "Adapter: $adapterPath" -ForegroundColor Cyan
Write-Host "Trials per case: $Trials" -ForegroundColor Cyan
Write-Host "Results: $OutDir" -ForegroundColor Cyan

# --- Adapter invocation --------------------------------------------------

function Invoke-Adapter {
    param(
        [string] $AdapterPath,
        [hashtable] $Request,
        [int] $TimeoutSeconds
    )
    $requestJson = $Request | ConvertTo-Json -Depth 10 -Compress
    $stderrFile  = [IO.Path]::GetTempFileName()
    $stdoutFile  = [IO.Path]::GetTempFileName()
    $startTime   = Get-Date

    try {
        # Pipe stdin via cmd echo: use a temp file instead to avoid quoting hell.
        $stdinFile = [IO.Path]::GetTempFileName()
        Set-Content -LiteralPath $stdinFile -Value $requestJson -Encoding utf8

        $isPs = $AdapterPath.EndsWith('.ps1', [System.StringComparison]::OrdinalIgnoreCase)
        if ($isPs) {
            $psi = [System.Diagnostics.ProcessStartInfo]::new()
            $psi.FileName = 'pwsh'
            $psi.ArgumentList.Add('-NoProfile')
            $psi.ArgumentList.Add('-File')
            $psi.ArgumentList.Add($AdapterPath)
            $psi.RedirectStandardInput  = $true
            $psi.RedirectStandardOutput = $true
            $psi.RedirectStandardError  = $true
            $psi.UseShellExecute = $false
            # Fall back to Windows PowerShell if pwsh missing
            if (-not (Get-Command pwsh -ErrorAction SilentlyContinue)) {
                $psi.FileName = 'powershell'
            }
        } else {
            $psi = [System.Diagnostics.ProcessStartInfo]::new()
            $psi.FileName = $AdapterPath
            $psi.RedirectStandardInput  = $true
            $psi.RedirectStandardOutput = $true
            $psi.RedirectStandardError  = $true
            $psi.UseShellExecute = $false
        }

        $proc = [System.Diagnostics.Process]::Start($psi)
        $proc.StandardInput.Write($requestJson)
        $proc.StandardInput.Close()

        # Read async
        $stdoutTask = $proc.StandardOutput.ReadToEndAsync()
        $stderrTask = $proc.StandardError.ReadToEndAsync()

        if (-not $proc.WaitForExit($TimeoutSeconds * 1000)) {
            try { $proc.Kill($true) } catch {}
            return [PSCustomObject]@{
                ExitCode   = -1
                Stdout     = ''
                Stderr     = "ADAPTER TIMEOUT after $TimeoutSeconds seconds"
                DurationMs = ($TimeoutSeconds * 1000)
                Meta       = $null
                TimedOut   = $true
            }
        }
        $stdout = $stdoutTask.GetAwaiter().GetResult()
        $stderr = $stderrTask.GetAwaiter().GetResult()
        $duration = ((Get-Date) - $startTime).TotalMilliseconds

        # Look for META: line in stderr
        $meta = $null
        foreach ($line in ($stderr -split "(`r`n|`n)")) {
            if ($line -match '^\s*META:\s*(\{.*\})\s*$') {
                try { $meta = $matches[1] | ConvertFrom-Json } catch {}
                break
            }
        }

        return [PSCustomObject]@{
            ExitCode   = $proc.ExitCode
            Stdout     = $stdout
            Stderr     = $stderr
            DurationMs = [int]$duration
            Meta       = $meta
            TimedOut   = $false
        }
    } finally {
        Remove-Item $stdinFile,$stdoutFile,$stderrFile -ErrorAction SilentlyContinue
    }
}

# --- Stage a case into a sandbox (exclude expected.json) ----------------

function New-CaseSandbox {
    param([string] $CaseDir)
    $sandbox = Join-Path ([IO.Path]::GetTempPath()) ("codereview-eval-" + [Guid]::NewGuid().ToString('N').Substring(0,8))
    New-Item -ItemType Directory -Path $sandbox -Force | Out-Null
    # Copy everything except expected.json
    Get-ChildItem -LiteralPath $CaseDir -Force | Where-Object { $_.Name -ne 'expected.json' } | ForEach-Object {
        if ($_.PSIsContainer) {
            Copy-Item -LiteralPath $_.FullName -Destination $sandbox -Recurse -Force
        } else {
            Copy-Item -LiteralPath $_.FullName -Destination $sandbox -Force
        }
    }
    return $sandbox
}

# --- Run cases ----------------------------------------------------------

$allResults = New-Object System.Collections.Generic.List[object]

foreach ($case in $cases) {
    $caseId = $case.Name
    Write-Host ""
    Write-Host "=== Case: $caseId ===" -ForegroundColor Yellow

    $expectedPath = Join-Path $case.FullName 'expected.json'
    $expected = Get-Content -LiteralPath $expectedPath -Raw -Encoding utf8 | ConvertFrom-Json

    # Validate
    $schemaErrors = @(Test-ExpectedJson -Expected $expected -CaseDirName $caseId)
    if ($schemaErrors.Count -gt 0) {
        Write-Warning "  Schema errors:"
        $schemaErrors | ForEach-Object { Write-Warning "    $_" }
        $allResults.Add([PSCustomObject]@{
            CaseId = $caseId
            Status = 'schema_error'
            Errors = $schemaErrors
        })
        continue
    }

    $prPath = Join-Path $case.FullName 'pr.md'
    $hasPr  = Test-Path -LiteralPath $prPath -PathType Leaf
    $mode   = if ($hasPr) { 'pr' } else { 'standalone' }
    if ($expected.mode -and $expected.mode -ne $mode) {
        Write-Warning "  expected.json declares mode=$($expected.mode) but pr.md presence implies $mode"
    }

    $trialResults = @()
    for ($t = 1; $t -le $Trials; $t++) {
        $sandbox = New-CaseSandbox -CaseDir $case.FullName
        try {
            $request = @{
                caseId            = $caseId
                mode              = $mode
                diffPath          = (Join-Path $sandbox 'diff.patch')
                contextDir        = (Join-Path $sandbox 'context')
                prDescriptionPath = if ($hasPr) { Join-Path $sandbox 'pr.md' } else { $null }
                trial             = $t
                trialsTotal       = $Trials
            }
            Write-Host "  Trial $t/$Trials..." -ForegroundColor DarkGray
            $invocation = Invoke-Adapter -AdapterPath $adapterPath -Request $request -TimeoutSeconds $TimeoutSeconds

            $review = $null
            $score  = $null
            $status = 'ok'
            $err    = $null

            if ($invocation.TimedOut)        { $status = 'timeout';   $err = $invocation.Stderr }
            elseif ($invocation.ExitCode -ne 0) { $status = 'adapter_error'; $err = "exit=$($invocation.ExitCode); $($invocation.Stderr)" }
            elseif (-not $invocation.Stdout.Trim()) { $status = 'empty_review' }
            else {
                $review = ConvertFrom-ReviewMarkdown -Markdown $invocation.Stdout
                if (-not $review.Parseable) {
                    $status = 'unparseable'
                } else {
                    $score = Invoke-DetectionScore -Review $review -Expected $expected `
                                                    -LineWindow $LineWindow `
                                                    -SemanticThreshold $SemanticThreshold `
                                                    -LocationKeywordMin $LocationKeywordMin
                }
            }

            # Write per-trial artifacts
            $caseOutDir = Join-Path $OutDir $caseId
            $null = New-Item -ItemType Directory -Path $caseOutDir -Force
            $trialBase = Join-Path $caseOutDir "trial-$t"
            Set-Content -LiteralPath "$trialBase.review.md" -Value $invocation.Stdout -Encoding utf8
            if ($invocation.Stderr) {
                Set-Content -LiteralPath "$trialBase.stderr.log" -Value $invocation.Stderr -Encoding utf8
            }
            if ($score) {
                $score | ConvertTo-Json -Depth 30 | Set-Content -LiteralPath "$trialBase.score.json" -Encoding utf8
            }

            $trialResults += [PSCustomObject]@{
                Trial      = $t
                Status     = $status
                Error      = $err
                DurationMs = $invocation.DurationMs
                Meta       = $invocation.Meta
                Score      = $score
            }

            if ($score) {
                $det = $score.Detection
                Write-Host ("    detection: TP={0} FN={1} FP-distractor={2} FP-unmatched={3} verdict={4}" -f `
                    $det.TP, $det.FN, $det.FPDistractor, $det.FPUnmatched, $score.Verdict.Produced) -ForegroundColor Green
            } else {
                Write-Host "    status=$status" -ForegroundColor Red
            }
        } finally {
            Remove-Item -LiteralPath $sandbox -Recurse -Force -ErrorAction SilentlyContinue
        }
    }

    $allResults.Add([PSCustomObject]@{
        CaseId  = $caseId
        Mode    = $mode
        Trials  = $trialResults
    })
}

# --- Summary -------------------------------------------------------------

$summaryPath = Join-Path $OutDir 'summary.json'
$allResults | ConvertTo-Json -Depth 30 | Set-Content -LiteralPath $summaryPath -Encoding utf8

# Aggregate stability metrics
$rows = @()
foreach ($caseResult in $allResults) {
    if (-not $caseResult.PSObject.Properties.Name.Contains('Trials')) { continue }
    $caughtPerBug = @{}
    $totalTP = 0; $totalFN = 0; $totalFP = 0
    $okTrials = 0
    foreach ($t in $caseResult.Trials) {
        if (-not $t.Score) { continue }
        $okTrials++
        $totalTP += $t.Score.Detection.TP
        $totalFN += $t.Score.Detection.FN
        $totalFP += ($t.Score.Detection.FPDistractor + $t.Score.Detection.FPUnmatched)
        foreach ($b in $t.Score.Bugs) {
            if (-not $caughtPerBug.ContainsKey($b.Id)) { $caughtPerBug[$b.Id] = 0 }
            if ($b.Caught) { $caughtPerBug[$b.Id]++ }
        }
    }
    foreach ($bugId in $caughtPerBug.Keys) {
        $rows += [PSCustomObject]@{
            Case        = $caseResult.CaseId
            Bug         = $bugId
            CatchRate   = "$($caughtPerBug[$bugId])/$okTrials"
        }
    }
}

Write-Host ""
Write-Host "=== Stability (catch rate per bug across trials) ===" -ForegroundColor Cyan
$rows | Format-Table -AutoSize | Out-Host

Write-Host ""
Write-Host "Done. Per-case results in: $OutDir" -ForegroundColor Cyan
Write-Host "Summary JSON: $summaryPath" -ForegroundColor Cyan
