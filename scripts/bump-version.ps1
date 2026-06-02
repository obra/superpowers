# bump-version.ps1 вЂ” bump version numbers across all declared files,
# with drift detection and repo-wide audit for missed files.
#
# Usage:
#   .\bump-version.ps1 <new-version>   Bump all declared files to new version
#   .\bump-version.ps1 -Check           Report current versions (detect drift)
#   .\bump-version.ps1 -Audit           Check + grep repo for old version strings

param(
    [switch]$Check,
    [switch]$Audit,
    [switch]$Help,
    [string]$NewVersion = ""
)

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir '..')
$Config = Join-Path $RepoRoot '.version-bump.json'

if (-not (Test-Path $Config)) {
    Write-Error "error: .version-bump.json not found at $Config"
    exit 1
}

# --- helpers ---

function Read-JsonField {
    param($File, $Field)
    $json = Get-Content $File -Raw | ConvertFrom-Json
    $parts = $Field -split '\.'
    $current = $json
    foreach ($p in $parts) {
        $current = $current.$p
    }
    return $current
}

function Write-JsonField {
    param($File, $Field, $Value)
    $json = Get-Content $File -Raw | ConvertFrom-Json -AsHashtable
    $parts = $Field -split '\.'
    $ref = [ref]$json
    for ($i = 0; $i -lt $parts.Count - 1; $i++) {
        $ref = [ref]$ref.Value[$parts[$i]]
    }
    $ref.Value[$parts[-1]] = $Value
    $json | ConvertTo-Json -Depth 10 | Set-Content $File -Encoding UTF8
}

function Get-DeclaredFiles {
    $cfg = Get-Content $Config -Raw | ConvertFrom-Json
    return $cfg.files
}

function Get-AuditExcludes {
    $cfg = Get-Content $Config -Raw | ConvertFrom-Json
    if ($cfg.audit -and $cfg.audit.exclude) {
        return $cfg.audit.exclude
    }
    return @()
}

# --- commands ---

function Invoke-Check {
    $hasDrift = $false
    $versions = @()

    Write-Output "Version check:"
    Write-Output ""

    $declared = Get-DeclaredFiles
    foreach ($entry in $declared) {
        $fullPath = Join-Path $RepoRoot $entry.path
        if (-not (Test-Path -LiteralPath $fullPath)) {
            Write-Output ("  {0,-45}  MISSING" -f "$($entry.path) ($($entry.field))")
            $hasDrift = $true
            continue
        }
        try {
            $ver = Read-JsonField -File $fullPath -Field $entry.field
            Write-Output ("  {0,-45}  {1}" -f "$($entry.path) ($($entry.field))", $ver)
            $versions += $ver
        } catch {
            Write-Output ("  {0,-45}  READ_ERROR" -f "$($entry.path) ($($entry.field))")
            $hasDrift = $true
        }
    }

    Write-Output ""

    $unique = $versions | Sort-Object -Unique
    if ($unique.Count -gt 1) {
        Write-Output "DRIFT DETECTED вЂ” versions are not in sync:"
        $versions | Group-Object | Select-Object Count, Name | Sort-Object Count -Descending | ForEach-Object {
            $msg = "  {0} ({1} files)" -f $_.Name, $_.Count
            Write-Output $msg
        }
        $hasDrift = $true
    } elseif ($unique.Count -eq 1) {
        Write-Output "All declared files are in sync at $($unique[0])"
    } else {
        Write-Output "No versions found"
        $hasDrift = $true
    }

    return $hasDrift
}

function Invoke-Audit {
    $drift = Invoke-Check
    Write-Output ""

    $declared = Get-DeclaredFiles
    $currentVersion = $null
    $versionCounts = @{}
    foreach ($entry in $declared) {
        $fullPath = Join-Path $RepoRoot $entry.path
        if (Test-Path -LiteralPath $fullPath) {
            try {
                $v = Read-JsonField -File $fullPath -Field $entry.field
                if (-not $versionCounts.ContainsKey($v)) { $versionCounts[$v] = 0 }
                $versionCounts[$v]++
            } catch { }
        }
    }
    $currentVersion = ($versionCounts.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1).Key

    if (-not $currentVersion) {
        Write-Error "error: could not determine current version"
        return 1
    }

    Write-Output "Audit: scanning repo for version string '$currentVersion'..."
    Write-Output ""

    $excludes = Get-AuditExcludes
    $excludeDirs = @('.git', 'node_modules')
    foreach ($e in $excludes) { $excludeDirs += $e }

    $declaredPaths = $declared | ForEach-Object { $_.path }

    $foundUndeclared = $false
    Get-ChildItem -LiteralPath $RepoRoot -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object {
            $rel = $_.FullName.Substring($RepoRoot.ToString().Length).TrimStart('\')
            foreach ($ed in $excludeDirs) {
                if ($rel -match "(^|\\)$([regex]::Escape($ed))(\\)") { return $false }
            }
            return $true
        } |
        ForEach-Object {
            try {
                $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
                if ($content -and $content.Contains($currentVersion)) {
                    return $_
                }
            } catch { }
            return $null
        } |
        Where-Object { $_ -ne $null } |
        ForEach-Object {
            $relPath = $_.FullName.Substring($RepoRoot.ToString().Length + 1)
            $isDeclared = $declaredPaths -contains $relPath
            if (-not $isDeclared) {
                if (-not $foundUndeclared) {
                    Write-Output "UNDECLARED files containing '$currentVersion':"
                    $foundUndeclared = $true
                }
                Write-Output "  ${relPath}:$currentVersion"
            }
        }

    if (-not $foundUndeclared) {
        Write-Output "No undeclared files contain the version string. All clear."
    } else {
        Write-Output ""
        Write-Output "Review the above files вЂ” if they should be bumped, add them to .version-bump.json"
        Write-Output "If they should be skipped, add them to the audit.exclude list."
    }
}

function Invoke-Bump {
    param($NewVer)

    if ($NewVer -notmatch '^\d+\.\d+\.\d+') {
        Write-Error "error: '$NewVer' doesn't look like a version (expected X.Y.Z)"
        exit 1
    }

    Write-Output "Bumping all declared files to $NewVer..."
    Write-Output ""

    $declared = Get-DeclaredFiles
    foreach ($entry in $declared) {
        $fullPath = Join-Path $RepoRoot $entry.path
        if (-not (Test-Path -LiteralPath $fullPath)) {
            Write-Output "  SKIP (missing): $($entry.path)"
            continue
        }
        $oldVer = Read-JsonField -File $fullPath -Field $entry.field
        Write-JsonField -File $fullPath -Field $entry.field -Value $NewVer
        Write-Output ("  {0,-45}  {1} -> {2}" -f "$($entry.path) ($($entry.field))", $oldVer, $NewVer)
    }

    Write-Output ""
    Write-Output "Done. Running audit to check for missed files..."
    Write-Output ""
    Invoke-Audit
}

# --- main ---

if ($Help) {
    Write-Output "Usage: bump-version.ps1 <new-version> | -Check | -Audit"
    Write-Output ""
    Write-Output "  <new-version>  Bump all declared files to the given version"
    Write-Output "  -Check         Show current versions, detect drift"
    Write-Output "  -Audit         Check + scan repo for undeclared version references"
    exit 0
}

if ($Check) {
    $result = Invoke-Check
    if ($result) { exit 1 }
    exit 0
}

if ($Audit) {
    Invoke-Audit
    exit $LASTEXITCODE
}

if ($NewVersion) {
    Invoke-Bump -NewVer $NewVersion
    exit 0
}

Write-Output "Usage: bump-version.ps1 <new-version> | -Check | -Audit"
Write-Output "Run with -Help for more details."
exit 0
