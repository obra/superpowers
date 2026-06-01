<#
.SYNOPSIS
    Copy dashboard files from `dashboard/` (on main) onto the gh-pages
    checkout, scoped so the existing `data/`, `.nojekyll`, and `README.md`
    are never touched.

.DESCRIPTION
    The skill-eval workflow runs this from its `publish` job after
    `wrap-eval-output.ps1` has written the per-skill JSON. The script:

      1. Mirrors `<SourceDir>/index.html` and `<SourceDir>/skill.html` onto
         `<PagesDir>/`.
      2. Mirrors `<SourceDir>/assets/` onto `<PagesDir>/assets/` and
         removes any files inside `<PagesDir>/assets/` that no longer exist
         in source.
      3. Leaves `<PagesDir>/data/`, `<PagesDir>/.nojekyll`, and any other
         pages-owned files untouched.

    Files in `<SourceDir>` that are clearly developer docs (e.g. README.md)
    are NOT copied — they would shadow the gh-pages README seeded by
    `init-gh-pages.ps1`.

.PARAMETER SourceDir
    Path to the dashboard source on the working branch (typically
    `dashboard/`).

.PARAMETER PagesDir
    Path to the gh-pages checkout root.

.EXAMPLE
    pwsh -File scripts/sync-dashboard.ps1 -SourceDir ./dashboard -PagesDir _pages
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string] $SourceDir,
    [Parameter(Mandatory)] [string] $PagesDir
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$src = (Resolve-Path -LiteralPath $SourceDir -ErrorAction Stop).Path
$dst = (Resolve-Path -LiteralPath $PagesDir   -ErrorAction Stop).Path

# Files at the top level of <SourceDir> that this script is willing to
# copy. Anything else (e.g. README.md, design notes) is treated as dev
# documentation and skipped so the gh-pages README is not clobbered.
$topLevelAllow = @('index.html', 'skill.html')

# Directories whose contents are fully owned by the dashboard. Files
# present in the destination but absent in the source are deleted.
$ownedDirs = @('assets')

foreach ($name in $topLevelAllow) {
    $s = Join-Path $src $name
    $d = Join-Path $dst $name
    if (Test-Path -LiteralPath $s -PathType Leaf) {
        Copy-Item -LiteralPath $s -Destination $d -Force
        Write-Host "copied $name"
    } else {
        Write-Verbose "skip (missing in source): $name"
    }
}

foreach ($dirName in $ownedDirs) {
    $sDir = Join-Path $src $dirName
    $dDir = Join-Path $dst $dirName
    if (-not (Test-Path -LiteralPath $sDir -PathType Container)) {
        # Source directory absent → leave destination alone.
        continue
    }
    if (-not (Test-Path -LiteralPath $dDir -PathType Container)) {
        $null = New-Item -ItemType Directory -Path $dDir -Force
    }

    # Mirror files from source into destination.
    $srcFiles = @(Get-ChildItem -LiteralPath $sDir -Recurse -File)
    $srcRelSet = New-Object System.Collections.Generic.HashSet[string]
    foreach ($f in $srcFiles) {
        $rel = $f.FullName.Substring($sDir.Length).TrimStart('\','/')
        [void]$srcRelSet.Add($rel.Replace('\','/'))
        $target = Join-Path $dDir $rel
        $parent = Split-Path $target -Parent
        if (-not (Test-Path -LiteralPath $parent -PathType Container)) {
            $null = New-Item -ItemType Directory -Path $parent -Force
        }
        Copy-Item -LiteralPath $f.FullName -Destination $target -Force
        Write-Host "copied $dirName/$rel"
    }

    # Prune stale files inside the owned destination subtree.
    $dstFiles = @(Get-ChildItem -LiteralPath $dDir -Recurse -File -ErrorAction SilentlyContinue)
    foreach ($f in $dstFiles) {
        $rel = $f.FullName.Substring($dDir.Length).TrimStart('\','/').Replace('\','/')
        if (-not $srcRelSet.Contains($rel)) {
            Remove-Item -LiteralPath $f.FullName -Force
            Write-Host "removed stale $dirName/$rel"
        }
    }

    # Clean up now-empty directories inside the owned subtree.
    $dstDirs = @(Get-ChildItem -LiteralPath $dDir -Recurse -Directory -ErrorAction SilentlyContinue |
                 Sort-Object FullName -Descending)
    foreach ($d in $dstDirs) {
        if (-not (Get-ChildItem -LiteralPath $d.FullName -Force -ErrorAction SilentlyContinue)) {
            Remove-Item -LiteralPath $d.FullName -Force
        }
    }
}

Write-Host "Dashboard sync complete."
