<#
.SYNOPSIS
    Match parsed reviewer findings against expected.json ground truth and
    score detection quality + severity calibration for a single case.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:SeverityRank = @{
    'suggestion' = 1
    'warning'    = 2
    'error'      = 3
    'unknown'    = 0
}

function _NormalizePath {
    param([string] $Path)
    if (-not $Path) { return '' }
    return ($Path -replace '\\', '/').Trim().TrimStart('./')
}

function _MatchesRegion {
    param(
        [PSCustomObject] $FindingRef,
        [PSCustomObject] $Region,
        [int] $LineWindow
    )
    $regionFile = _NormalizePath $Region.file
    $refFile    = _NormalizePath $FindingRef.File
    # File match: equal, or one ends with the other (handles partial-path references).
    $fileMatch = ($regionFile -eq $refFile) -or
                 $regionFile.EndsWith('/' + $refFile) -or
                 $refFile.EndsWith('/' + $regionFile)
    if (-not $fileMatch) { return $false }
    if ($null -eq $FindingRef.Line) { return $false }  # location match requires a line
    $start = $Region.lines[0] - $LineWindow
    $end   = $Region.lines[1] + $LineWindow
    return ($FindingRef.Line -ge $start -and $FindingRef.Line -le $end)
}

function _CountSemanticMatches {
    param(
        [string[]] $Keywords,
        [string] $Text
    )
    if (-not $Text) { return 0 }
    $count = 0
    foreach ($kw in $Keywords) {
        $escaped = [regex]::Escape($kw)
        # Word-boundary, case-insensitive
        if ([regex]::IsMatch($Text, "(?i)\b$escaped\b")) { $count++ }
    }
    return $count
}

function _FindingMatchesBugFile {
    param([PSCustomObject] $Finding, [PSCustomObject] $Bug)
    $bugFiles = @($Bug.evidence_regions | ForEach-Object { _NormalizePath $_.file } | Sort-Object -Unique)
    foreach ($ref in $Finding.FileRefs) {
        $refFile = _NormalizePath $ref.File
        foreach ($bf in $bugFiles) {
            if (($bf -eq $refFile) -or $bf.EndsWith('/' + $refFile) -or $refFile.EndsWith('/' + $bf)) {
                return $true
            }
        }
    }
    return $false
}

function Test-FindingMatchesBug {
    <#
    .SYNOPSIS
        Return $true if a parsed finding matches an expected bug per the
        rules in design/01-detection-quality.md.

    .DESCRIPTION
        Two-tier matching:
        - Location match: finding ref falls within evidence_region ± LineWindow.
          When `semantic_keywords` are defined, this branch additionally
          requires at least `$LocationKeywordMin` keyword hits in the
          finding's title+body. This prevents two bugs with overlapping
          evidence_regions from both claiming a finding that only addresses
          one of them.
        - File-level semantic match: same file, ≥ `$SemanticThreshold`
          keyword hits. Used when the reviewer's line number is stale.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)] [PSCustomObject] $Finding,
        [Parameter(Mandatory)] [PSCustomObject] $Bug,
        [int] $LineWindow = 8,
        [int] $SemanticThreshold = 2,
        [int] $LocationKeywordMin = 1
    )
    $keywords = @()
    if ($Bug.PSObject.Properties.Name -contains 'semantic_keywords' -and $Bug.semantic_keywords) {
        $keywords = @($Bug.semantic_keywords)
    }
    $combined = "$($Finding.Title) $($Finding.Body)"
    $keywordHits = if ($keywords.Count -gt 0) {
        _CountSemanticMatches -Keywords $keywords -Text $combined
    } else { 0 }

    # 1. Location match (+ keyword corroboration when keywords exist)
    foreach ($region in $Bug.evidence_regions) {
        foreach ($ref in $Finding.FileRefs) {
            if (_MatchesRegion -FindingRef $ref -Region $region -LineWindow $LineWindow) {
                if ($keywords.Count -eq 0 -or $keywordHits -ge $LocationKeywordMin) {
                    return $true
                }
            }
        }
    }
    # 2. Semantic match (file-level)
    if ($keywords.Count -gt 0 -and (_FindingMatchesBugFile -Finding $Finding -Bug $Bug)) {
        if ($keywordHits -ge $SemanticThreshold) { return $true }
    }
    return $false
}

function Test-FindingMatchesDistractor {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)] [PSCustomObject] $Finding,
        [Parameter(Mandatory)] [PSCustomObject] $Distractor,
        [int] $LineWindow = 8
    )
    foreach ($region in $Distractor.evidence_regions) {
        foreach ($ref in $Finding.FileRefs) {
            if (_MatchesRegion -FindingRef $ref -Region $region -LineWindow $LineWindow) {
                return $true
            }
        }
    }
    return $false
}

function _SeverityDelta {
    param([string] $Predicted, [string] $Expected)
    $p = $script:SeverityRank[$Predicted]
    $e = $script:SeverityRank[$Expected]
    if (-not $p -or -not $e) { return $null }
    return ($p - $e)
}

function Get-VerdictRank {
    [CmdletBinding()]
    param([string] $Verdict)
    switch ($Verdict) {
        'lgtm'               { return 0 }
        'needs_human_review' { return 1 }
        'needs_changes'      { return 2 }
        'reject'             { return 3 }
        default              { return -1 }
    }
}

function Invoke-DetectionScore {
    <#
    .SYNOPSIS
        Score a single review against a single expected.json.

    .OUTPUTS
        PSCustomObject with detection + severity + verdict metrics, plus
        per-finding and per-bug assignment trails for debugging.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)] [PSCustomObject] $Review,    # output of ConvertFrom-ReviewMarkdown
        [Parameter(Mandatory)] [PSCustomObject] $Expected,  # parsed expected.json
        [int] $LineWindow = 8,
        [int] $SemanticThreshold = 2,
        [int] $LocationKeywordMin = 1
    )

    # Track which findings have been claimed (for duplicate detection).
    $findingClaim = @{}
    for ($i = 0; $i -lt $Review.Findings.Count; $i++) {
        $findingClaim[$i] = @{ MatchedBugIds = New-Object System.Collections.Generic.List[string]; MatchedDistractorIds = New-Object System.Collections.Generic.List[string] }
    }

    $bugResults = @()
    $tpRequired = 0
    $fnRequired = 0
    $optionalCaught = 0
    $optionalTotal = 0
    $severityDeltas = New-Object System.Collections.Generic.List[object]

    foreach ($bug in $Expected.bugs) {
        $matchedFindingIndices = New-Object System.Collections.Generic.List[int]
        for ($i = 0; $i -lt $Review.Findings.Count; $i++) {
            if (Test-FindingMatchesBug -Finding $Review.Findings[$i] -Bug $bug -LineWindow $LineWindow -SemanticThreshold $SemanticThreshold -LocationKeywordMin $LocationKeywordMin) {
                $matchedFindingIndices.Add($i)
                $findingClaim[$i].MatchedBugIds.Add($bug.id)
            }
        }
        $caught = $matchedFindingIndices.Count -gt 0
        if ($bug.expectation -eq 'required') {
            if ($caught) { $tpRequired++ } else { $fnRequired++ }
        } else { # optional
            $optionalTotal++
            if ($caught) { $optionalCaught++ }
        }
        # Severity calibration on first matched finding
        if ($caught) {
            $primary = $Review.Findings[$matchedFindingIndices[0]]
            $delta = _SeverityDelta -Predicted $primary.Severity -Expected $bug.expected_severity
            if ($null -ne $delta) {
                $severityDeltas.Add([PSCustomObject]@{
                    BugId = $bug.id
                    Predicted = $primary.Severity
                    Expected  = $bug.expected_severity
                    Delta     = $delta
                })
            }
        }
        $bugResults += [PSCustomObject]@{
            Id          = $bug.id
            Category    = $bug.category
            Expectation = $bug.expectation
            Caught      = $caught
            DuplicateCount = [Math]::Max(0, $matchedFindingIndices.Count - 1)
            MatchedFindings = $matchedFindingIndices.ToArray()
        }
    }

    # Distractor matching
    $fpDistractor = 0
    $distractorResults = @()
    if ($Expected.PSObject.Properties.Name -contains 'non_bug_distractors' -and $Expected.non_bug_distractors) {
        foreach ($d in $Expected.non_bug_distractors) {
            $matched = New-Object System.Collections.Generic.List[int]
            for ($i = 0; $i -lt $Review.Findings.Count; $i++) {
                if (Test-FindingMatchesDistractor -Finding $Review.Findings[$i] -Distractor $d -LineWindow $LineWindow) {
                    $matched.Add($i)
                    $findingClaim[$i].MatchedDistractorIds.Add($d.id)
                }
            }
            if ($matched.Count -gt 0) { $fpDistractor++ }
            $distractorResults += [PSCustomObject]@{
                Id = $d.id
                FlaggedFindings = $matched.ToArray()
            }
        }
    }

    # Unmatched findings
    $unmatched = @()
    for ($i = 0; $i -lt $Review.Findings.Count; $i++) {
        $claim = $findingClaim[$i]
        if ($claim.MatchedBugIds.Count -eq 0 -and $claim.MatchedDistractorIds.Count -eq 0) {
            $unmatched += $i
        }
    }

    $mature = $false
    if ($Expected.PSObject.Properties.Name -contains 'mature') { $mature = [bool]$Expected.mature }

    if ($mature) {
        $fpUnmatched = $unmatched.Count
        $adjudicationQueue = @()
    } else {
        $fpUnmatched = 0
        $adjudicationQueue = $unmatched
    }

    # Verdict floor
    $verdictGateViolation = $false
    $verdictGateReason = $null
    if ($Expected.PSObject.Properties.Name -contains 'expected_verdict_at_least' -and $Expected.expected_verdict_at_least) {
        $floor = Get-VerdictRank $Expected.expected_verdict_at_least
        $got   = Get-VerdictRank $Review.Verdict
        if ($got -lt $floor) {
            $verdictGateViolation = $true
            $verdictGateReason = "expected verdict >= $($Expected.expected_verdict_at_least), got $($Review.Verdict)"
        }
    }

    # Severity calibration aggregates
    $exact = 0; $over = 0; $under = 0; $severeUnder = 0
    foreach ($s in $severityDeltas) {
        if     ($s.Delta -eq 0) { $exact++ }
        elseif ($s.Delta -gt 0) { $over++ }
        else { $under++; if ($s.Predicted -eq 'suggestion' -and $s.Expected -eq 'error') { $severeUnder++ } }
    }
    $sdTotal = $severityDeltas.Count
    if ($sdTotal -eq 0) { $sdTotal = 1 }  # avoid div-by-zero in caller

    $requiredTotal = $tpRequired + $fnRequired
    $recall = if ($requiredTotal -gt 0) { [math]::Round($tpRequired / $requiredTotal, 4) } else { $null }

    return [PSCustomObject]@{
        CaseId      = $Expected.case_id
        Mature      = $mature
        Detection = [PSCustomObject]@{
            RequiredTotal = $requiredTotal
            TP            = $tpRequired
            FN            = $fnRequired
            Recall        = $recall
            OptionalCaught = $optionalCaught
            OptionalTotal  = $optionalTotal
            FPDistractor  = $fpDistractor
            FPUnmatched   = $fpUnmatched
            Duplicates    = $(
                if ($bugResults -and @($bugResults).Count -gt 0) {
                    [int]((@($bugResults) | Measure-Object -Property DuplicateCount -Sum).Sum)
                } else { 0 }
            )
            AdjudicationQueue = $adjudicationQueue
        }
        Severity = [PSCustomObject]@{
            Total     = $severityDeltas.Count
            Exact     = $exact
            Over      = $over
            Under     = $under
            SevereUnder = $severeUnder
            Deltas    = $severityDeltas.ToArray()
        }
        Verdict = [PSCustomObject]@{
            Produced       = $Review.Verdict
            ExpectedFloor  = if ($Expected.PSObject.Properties.Name -contains 'expected_verdict_at_least') { $Expected.expected_verdict_at_least } else { $null }
            Violation      = $verdictGateViolation
            Reason         = $verdictGateReason
        }
        Bugs        = $bugResults
        Distractors = $distractorResults
        Findings    = $Review.Findings
    }
}

Export-ModuleMember -Function Invoke-DetectionScore, Test-FindingMatchesBug, Test-FindingMatchesDistractor, Get-VerdictRank
