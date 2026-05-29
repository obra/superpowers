<#
.SYNOPSIS
    Detect which skills need to be re-evaluated based on changed files.

.DESCRIPTION
    Given a base ref and head ref (default: HEAD^..HEAD), enumerate changed
    paths and apply the change-detection rule from the skill-eval workflow
    contract:

      * `skills/<S>/**` or `evals/<S>/**` ⇒ skill `<S>` re-evals.
      * Any path matching `evals/_*/**` (shared eval infrastructure) ⇒
        re-eval every skill that has a `run-eval.ps1` (a "full sweep").
        The single exception is `evals/_docs/**`, which is explicitly
        **excluded** from the full-sweep trigger so documentation-only
        edits never re-run every skill's eval.

    A skill is only emitted if `evals/<skill>/run-eval.ps1` exists at HEAD.

    Emits a JSON array of skill names on stdout, e.g. `["code-review"]`.
    The array is always a JSON array even for 0 or 1 elements (important
    for GitHub Actions `fromJson` matrix consumers).

.PARAMETER FullSweep
    If set, skip git entirely and emit every skill that has a
    `run-eval.ps1` (useful for `workflow_dispatch` manual reruns and for
    repos in pre-history state where `HEAD^` does not exist).

.PARAMETER BaseRef
    The base git ref. Default is `HEAD^`. Ignored when `-FullSweep` is set.

.PARAMETER HeadRef
    The head git ref. Default is `HEAD`. Ignored when `-FullSweep` is set.

.PARAMETER RepoRoot
    Repo root. Defaults to the closest ancestor containing an `evals/`
    directory.

.PARAMETER OnlySkills
    Optional comma-separated allow-list. If provided, only these skill
    names are emitted (after filtering by `run-eval.ps1` existence).
    Useful for `workflow_dispatch` with a `skills: foo,bar` input.

.EXAMPLE
    pwsh -File scripts/detect-changed-skills.ps1
    # ["code-review"]

.EXAMPLE
    pwsh -File scripts/detect-changed-skills.ps1 -OnlySkills "code-review,brainstorming"

.EXAMPLE
    pwsh -File scripts/detect-changed-skills.ps1 -FullSweep
    # all skills with run-eval.ps1
#>

[CmdletBinding()]
param(
    [string] $BaseRef = 'HEAD^',
    [string] $HeadRef = 'HEAD',
    [string] $RepoRoot,
    [string] $OnlySkills,
    [switch] $FullSweep
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Find-RepoRoot {
    param([string] $Start)
    # Keep $cur as a string throughout — Resolve-Path returns PathInfo
    # but under strict mode the second loop iteration would throw on
    # $cur.Path access against a string. Use [IO.Path]::GetDirectoryName
    # for parent navigation: Split-Path's -LiteralPath parameter set
    # does not allow -Parent, and -Path expands wildcards (which can
    # mangle paths containing literal brackets/spaces on some systems).
    $cur = (Resolve-Path -LiteralPath $Start).Path
    while ($cur) {
        if (Test-Path -LiteralPath (Join-Path $cur 'evals') -PathType Container) {
            return $cur
        }
        $parent = [System.IO.Path]::GetDirectoryName($cur)
        if (-not $parent -or $parent -eq $cur) { break }
        $cur = $parent
    }
    throw "Could not locate repo root containing an 'evals/' directory above '$Start'."
}

if (-not $RepoRoot) {
    $RepoRoot = Find-RepoRoot -Start (Get-Location).Path
}
$RepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path

function Get-SkillsWithEval {
    param([string] $Root)
    $evalsDir = Join-Path $Root 'evals'
    if (-not (Test-Path -LiteralPath $evalsDir -PathType Container)) { return @() }
    $skills = New-Object System.Collections.Generic.List[string]
    Get-ChildItem -LiteralPath $evalsDir -Directory | ForEach-Object {
        if ($_.Name.StartsWith('_')) { return }  # shared infra, not a skill
        $runEval = Join-Path $_.FullName 'run-eval.ps1'
        if (Test-Path -LiteralPath $runEval -PathType Leaf) {
            $skills.Add($_.Name)
        }
    }
    return $skills.ToArray()
}

function ConvertTo-JsonArray {
    param([Parameter(ValueFromPipeline)] $InputObject)
    end {
        # Always emit a JSON array, even for 0 or 1 elements. ConvertTo-Json
        # collapses a single string to a JSON string, so we force the shape.
        $items = @($input)
        if ($items.Count -eq 0) { return '[]' }
        $escaped = $items | ForEach-Object {
            ($_ | ConvertTo-Json -Compress)
        }
        return '[' + ($escaped -join ',') + ']'
    }
}

# --- Resolve allow-list --------------------------------------------------

$allowList = $null
if ($OnlySkills) {
    $allowList = @($OnlySkills -split '[,;\s]+' | Where-Object { $_ })
}

# --- Decide what changed --------------------------------------------------

$allSkills = @(Get-SkillsWithEval -Root $RepoRoot)
$resultSet = New-Object System.Collections.Generic.HashSet[string]

function Add-FullSweep {
    foreach ($s in $allSkills) { [void]$resultSet.Add($s) }
}

if ($FullSweep -or $BaseRef -ieq '--full-sweep' -or $HeadRef -ieq '--full-sweep') {
    Add-FullSweep
} else {
    Push-Location $RepoRoot
    try {
        $hasBase = $false
        try {
            & git rev-parse --verify --quiet "$BaseRef^{commit}" *>$null
            if ($LASTEXITCODE -eq 0) { $hasBase = $true }
        } catch { $hasBase = $false }

        if (-not $hasBase) {
            # No parent commit (initial commit, shallow clone): safer to
            # sweep everything than to silently emit nothing.
            Write-Verbose "BaseRef '$BaseRef' not resolvable; falling back to full sweep."
            Add-FullSweep
        } else {
            $diffOutput = & git diff --name-only "$BaseRef" "$HeadRef" 2>$null
            if ($LASTEXITCODE -ne 0) {
                Write-Verbose "git diff failed; falling back to full sweep."
                Add-FullSweep
            } else {
                $changed = @($diffOutput | Where-Object { $_ })
                foreach ($path in $changed) {
                    $norm = $path -replace '\\', '/'
                    # Shared eval infrastructure ⇒ full sweep. `_docs/` is
                    # explicitly excluded because doc-only edits never
                    # affect scoring.
                    if ($norm -match '^evals/_[^/]+/' -and $norm -notmatch '^evals/_docs/') {
                        Add-FullSweep
                        break
                    }
                }
                if ($resultSet.Count -lt $allSkills.Count) {
                    foreach ($path in $changed) {
                        $norm = $path -replace '\\', '/'
                        if ($norm -match '^skills/([^/]+)/') {
                            [void]$resultSet.Add($matches[1])
                        } elseif ($norm -match '^evals/([^/_][^/]*)/') {
                            [void]$resultSet.Add($matches[1])
                        }
                    }
                }
            }
        }
    } finally {
        Pop-Location
    }
}

# --- Filter to skills that actually have run-eval.ps1 and allow-list -----

$skillSet = New-Object System.Collections.Generic.HashSet[string]
foreach ($s in $allSkills) { [void]$skillSet.Add($s) }
$filtered = @($resultSet | Where-Object { $skillSet.Contains($_) })
if ($null -ne $allowList) {
    $allowSet = New-Object System.Collections.Generic.HashSet[string]
    foreach ($s in $allowList) { [void]$allowSet.Add($s) }
    $filtered = @($filtered | Where-Object { $allowSet.Contains($_) })
}

# Stable sort for deterministic matrix order.
$filtered = @($filtered | Sort-Object)

$filtered | ConvertTo-JsonArray
