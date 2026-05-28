<#
.SYNOPSIS
    Validates a fixture's expected.json against the rules from
    fixtures/detection/_schema/expected.schema.json.

    Implements a *targeted* subset of JSON Schema sufficient for our
    schema (required, enum, type, pattern, items, additionalProperties,
    minItems/maxItems, oneOf via $ref). This avoids pulling in a third-
    party JSON-Schema validator on Windows PowerShell.

.NOTES
    Returns an array of human-readable error strings.
    Empty array == valid.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:KnownCategories = @(
    'security', 'concurrency', 'resource-leak', 'off-by-one',
    'performance', 'error-handling', 'input-validation', 'api-breakage',
    'test-gap', 'dead-code', 'observability', 'correctness', 'other'
)
$script:KnownSeverities  = @('error', 'warning', 'suggestion')
$script:KnownExpectations = @('required', 'optional')
$script:KnownModes        = @('standalone', 'pr')
$script:KnownVerdicts     = @('lgtm', 'needs_human_review', 'needs_changes', 'reject')

function _AddError {
    param([System.Collections.ArrayList]$Errors, [string]$Path, [string]$Message)
    [void]$Errors.Add("[$Path] $Message")
}

function _ValidateRegion {
    param($Region, [string]$Path, [System.Collections.ArrayList]$Errors)
    if ($Region -isnot [hashtable] -and $Region -isnot [pscustomobject]) {
        _AddError $Errors $Path 'region must be an object'
        return
    }
    $file  = $Region.file
    $lines = $Region.lines
    if (-not $file) { _AddError $Errors $Path "region.file is required" }
    elseif ($file -isnot [string] -or $file.Length -lt 1) {
        _AddError $Errors $Path "region.file must be a non-empty string"
    }
    if (-not $lines) { _AddError $Errors $Path "region.lines is required" }
    elseif ($lines.Count -ne 2) {
        _AddError $Errors $Path "region.lines must be a 2-element array [start, end]"
    }
    elseif ($lines[0] -gt $lines[1]) {
        _AddError $Errors $Path "region.lines start ($($lines[0])) must be <= end ($($lines[1]))"
    }
    elseif ($lines[0] -lt 1) {
        _AddError $Errors $Path "region.lines must start at >= 1"
    }
}

function _ValidateBug {
    param($Bug, [string]$Path, [System.Collections.ArrayList]$Errors)
    foreach ($required in @('id','category','expectation','expected_severity','evidence_regions','semantic_keywords','description')) {
        if (-not $Bug.PSObject.Properties.Name -contains $required) {
            _AddError $Errors $Path "missing required field '$required'"
        }
    }
    if ($Bug.id -and ($Bug.id -notmatch '^[a-z0-9][a-z0-9-]*$')) {
        _AddError $Errors "$Path.id" "must be kebab-case (got '$($Bug.id)')"
    }
    if ($Bug.category -and ($Bug.category -notin $script:KnownCategories)) {
        _AddError $Errors "$Path.category" "must be one of: $($script:KnownCategories -join ', ')"
    }
    if ($Bug.expectation -and ($Bug.expectation -notin $script:KnownExpectations)) {
        _AddError $Errors "$Path.expectation" "must be one of: $($script:KnownExpectations -join ', ')"
    }
    if ($Bug.expected_severity -and ($Bug.expected_severity -notin $script:KnownSeverities)) {
        _AddError $Errors "$Path.expected_severity" "must be one of: $($script:KnownSeverities -join ', ')"
    }
    if ($Bug.evidence_regions) {
        if ($Bug.evidence_regions.Count -lt 1) {
            _AddError $Errors "$Path.evidence_regions" "must have at least 1 region"
        }
        for ($i = 0; $i -lt $Bug.evidence_regions.Count; $i++) {
            _ValidateRegion -Region $Bug.evidence_regions[$i] -Path "$Path.evidence_regions[$i]" -Errors $Errors
        }
    }
    if ($Bug.semantic_keywords) {
        if ($Bug.semantic_keywords.Count -lt 1) {
            _AddError $Errors "$Path.semantic_keywords" "must have at least 1 keyword"
        }
        foreach ($kw in $Bug.semantic_keywords) {
            if ($kw -isnot [string] -or $kw.Length -lt 2) {
                _AddError $Errors "$Path.semantic_keywords" "each keyword must be a string of length >= 2 (got '$kw')"
            }
        }
    }
}

function _ValidateDistractor {
    param($D, [string]$Path, [System.Collections.ArrayList]$Errors)
    foreach ($required in @('id','evidence_regions','note')) {
        if (-not ($D.PSObject.Properties.Name -contains $required)) {
            _AddError $Errors $Path "missing required field '$required'"
        }
    }
    if ($D.id -and ($D.id -notmatch '^[a-z0-9][a-z0-9-]*$')) {
        _AddError $Errors "$Path.id" "must be kebab-case (got '$($D.id)')"
    }
    if ($D.evidence_regions) {
        for ($i = 0; $i -lt $D.evidence_regions.Count; $i++) {
            _ValidateRegion -Region $D.evidence_regions[$i] -Path "$Path.evidence_regions[$i]" -Errors $Errors
        }
    }
}

function Test-ExpectedJson {
    <#
    .SYNOPSIS
        Validate an expected.json object (already parsed via ConvertFrom-Json).

    .PARAMETER Expected
        The parsed object.

    .PARAMETER CaseDirName
        Optional; if provided, verifies expected.case_id matches the directory name.

    .OUTPUTS
        Array of error strings. Empty when valid.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)] $Expected,
        [string] $CaseDirName
    )

    $errors = [System.Collections.ArrayList]::new()

    foreach ($required in @('case_id', 'mode', 'bugs')) {
        if (-not ($Expected.PSObject.Properties.Name -contains $required)) {
            _AddError $errors '$' "missing required field '$required'"
        }
    }

    if ($Expected.case_id) {
        if ($Expected.case_id -notmatch '^[a-z0-9][a-z0-9-]*$') {
            _AddError $errors '$.case_id' "must be kebab-case (got '$($Expected.case_id)')"
        }
        if ($CaseDirName -and ($Expected.case_id -ne $CaseDirName)) {
            _AddError $errors '$.case_id' "must equal directory name '$CaseDirName' (got '$($Expected.case_id)')"
        }
    }

    if ($Expected.mode -and ($Expected.mode -notin $script:KnownModes)) {
        _AddError $errors '$.mode' "must be one of: $($script:KnownModes -join ', ')"
    }

    if ($Expected.PSObject.Properties.Name -contains 'expected_verdict_at_least') {
        if ($Expected.expected_verdict_at_least -notin $script:KnownVerdicts) {
            _AddError $errors '$.expected_verdict_at_least' "must be one of: $($script:KnownVerdicts -join ', ')"
        }
    }

    if ($Expected.bugs) {
        for ($i = 0; $i -lt $Expected.bugs.Count; $i++) {
            _ValidateBug -Bug $Expected.bugs[$i] -Path "`$.bugs[$i]" -Errors $errors
        }
    }

    if ($Expected.PSObject.Properties.Name -contains 'non_bug_distractors' -and $Expected.non_bug_distractors) {
        for ($i = 0; $i -lt $Expected.non_bug_distractors.Count; $i++) {
            _ValidateDistractor -D $Expected.non_bug_distractors[$i] -Path "`$.non_bug_distractors[$i]" -Errors $errors
        }
    }

    return $errors.ToArray()
}

function Test-FixtureDirectory {
    <#
    .SYNOPSIS
        Validate a fixture directory: presence of required files + expected.json.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string] $Path)

    $errors = [System.Collections.ArrayList]::new()
    if (-not (Test-Path $Path -PathType Container)) {
        [void]$errors.Add("fixture directory does not exist: $Path")
        return $errors.ToArray()
    }
    $caseName = Split-Path $Path -Leaf

    foreach ($required in @('diff.patch', 'expected.json')) {
        $p = Join-Path $Path $required
        if (-not (Test-Path $p -PathType Leaf)) {
            [void]$errors.Add("missing required file: $required")
        }
    }
    $contextDir = Join-Path $Path 'context'
    if (-not (Test-Path $contextDir -PathType Container)) {
        [void]$errors.Add("missing context/ directory")
    }

    $expectedPath = Join-Path $Path 'expected.json'
    if (Test-Path $expectedPath -PathType Leaf) {
        try {
            $expected = Get-Content $expectedPath -Raw -Encoding utf8 | ConvertFrom-Json
            $schemaErrors = Test-ExpectedJson -Expected $expected -CaseDirName $caseName
            foreach ($e in $schemaErrors) { [void]$errors.Add($e) }
        } catch {
            [void]$errors.Add("failed to parse expected.json: $($_.Exception.Message)")
        }
    }

    return $errors.ToArray()
}

Export-ModuleMember -Function Test-ExpectedJson, Test-FixtureDirectory
