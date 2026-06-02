# sync-to-codex-plugin.ps1
#
# Sync this superpowers checkout в†’ prime-radiant-inc/openai-codex-plugins.
# Clones the fork fresh into a temp dir, copies tracked upstream plugin content
# (including committed Codex files under .codex-plugin/ and assets/), preserves
# OpenAI-owned marketplace metadata already in the destination plugin, commits,
# pushes a sync branch, and opens a PR.
#
# Usage:
#   .\sync-to-codex-plugin.ps1                              # full run
#   .\sync-to-codex-plugin.ps1 -DryRun                      # dry run
#   .\sync-to-codex-plugin.ps1 -Yes                         # skip confirm
#   .\sync-to-codex-plugin.ps1 -Local PATH                  # existing checkout
#   .\sync-to-codex-plugin.ps1 -Base BRANCH                 # default: main
#   .\sync-to-codex-plugin.ps1 -Bootstrap                   # create plugin dir if missing
#
# Requires: git, gh (authenticated), robocopy (built into Windows).

param(
    [switch]$DryRun,
    [switch]$Yes,
    [string]$Local = "",
    [string]$Base = "main",
    [switch]$Bootstrap,
    [switch]$Help
)

$ErrorActionPreference = 'Stop'

if ($Help) {
    @"
Usage: sync-to-codex-plugin.ps1 [-DryRun] [-Yes] [-Local PATH] [-Base BRANCH] [-Bootstrap]

  -DryRun      Preview changes without applying
  -Yes         Skip all confirmation prompts
  -Local PATH  Use an existing local checkout instead of cloning fresh
  -Base BRANCH Base branch for PR (default: main)
  -Bootstrap   Create plugins/superpowers/ directory when absent
"@
    exit 0
}

# =============================================================================
# Config
# =============================================================================

$Fork = "prime-radiant-inc/openai-codex-plugins"
$DestRel = "plugins/superpowers"

$Excludes = @(
    "/.claude/", "/.claude-plugin/", "/.codex/", "/.cursor-plugin/",
    "/.git/", "/.gitattributes", "/.github/", "/.gitignore",
    "/.opencode/", "/.version-bump.json", "/.worktrees/", ".DS_Store",
    "/AGENTS.md", "/CHANGELOG.md", "/CLAUDE.md", "/GEMINI.md",
    "/RELEASE-NOTES.md", "/gemini-extension.json", "/package.json",
    "/commands/", "/docs/", "/hooks/", "/lib/", "/scripts/", "/tests/", "/tmp/"
)

# =============================================================================
# Helpers
# =============================================================================

function Die([string]$msg) { Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }

function Confirm-User([string]$prompt) {
    if ($Yes) { return $true }
    $ans = Read-Host "$prompt [y/N]"
    return ($ans -eq 'y' -or $ans -eq 'Y')
}

function Invoke-Robocopy($Source, $Dest, [array]$ExtraArgs = @()) {
    $args = @($Source, $Dest, '/MIR', '/R:0', '/W:0', '/NJH', '/NJS', '/NP', '/NDL', '/NFL')
    if ($ExtraArgs) { $args += $ExtraArgs }
    $result = & robocopy @args
    # robocopy exit codes: 0=no changes, 1=files copied, 2-7=success with extras
    if ($LASTEXITCODE -ge 8) { throw "robocopy failed with exit code $LASTEXITCODE" }
}

function New-TempDir {
    $path = Join-Path $env:TEMP "codex-sync-$([System.IO.Path]::GetRandomFileName())"
    New-Item -ItemType Directory -Force -Path $path | Out-Null
    return $path
}

function Get-GitIgnoredDirs($Repo) {
    Push-Location $Repo
    try {
        $dirs = git ls-files --others --ignored --exclude-standard --directory -z 2>$null
        if (-not $dirs) { return @() }
        $dirs -split "`0" | Where-Object { $_ -and $_.EndsWith('/') -and $_ -ne '' }
    } finally { Pop-Location }
}

function Get-GitIgnoredFiles($Repo) {
    Push-Location $Repo
    try {
        $files = git ls-files --others --ignored --exclude-standard -z 2>$null
        if (-not $files) { return @() }
        $files -split "`0" | Where-Object { $_ -and $_ -ne '' }
    } finally { Pop-Location }
}

function Has-GitDir($Path) { return (Test-Path (Join-Path $Path '.git')) }

# =============================================================================
# Init
# =============================================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Upstream = (Resolve-Path (Join-Path $ScriptDir '..')).Path

# Check requirements
foreach ($cmd in @('git', 'gh')) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Die "$cmd not found in PATH"
    }
}
# robocopy is built into Windows, always available

gh auth status 2>$null
if ($LASTEXITCODE -ne 0) { Die "gh not authenticated вЂ” run 'gh auth login'" }

if (-not (Has-GitDir $Upstream)) { Die "upstream '$Upstream' is not a git checkout" }
if (-not (Test-Path (Join-Path $Upstream '.codex-plugin\plugin.json'))) {
    Die "committed Codex manifest missing at $Upstream\.codex-plugin\plugin.json"
}

# Read upstream version from Codex manifest (use PowerShell JSON, no Python needed)
$manifest = Get-Content (Join-Path $Upstream '.codex-plugin\plugin.json') -Raw | ConvertFrom-Json
$UpstreamVersion = $manifest.version
if (-not $UpstreamVersion) { Die "could not read 'version' from committed Codex manifest" }

Push-Location $Upstream
$UpstreamBranch = git branch --show-current
$UpstreamSha = git rev-parse HEAD
$UpstreamShort = git rev-parse --short HEAD
Pop-Location

if ($UpstreamBranch -ne 'main') {
    Write-Warning "upstream is on '$UpstreamBranch', not 'main'"
    if (-not (Confirm-User "Sync from '$UpstreamBranch' anyway?")) { exit 1 }
}

Push-Location $Upstream
$status = git status --porcelain
Pop-Location
if ($status) {
    Write-Warning "upstream has uncommitted changes:"
    Write-Warning $status
    Write-Warning "Sync will use working-tree state, not HEAD ($UpstreamShort)."
    if (-not (Confirm-User "Continue anyway?")) { exit 1 }
}

# =============================================================================
# Prepare destination
# =============================================================================

$CleanupDir = ""
$LocalMode = ($Local -ne "")

if ($LocalMode) {
    $CleanupDir = New-TempDir
    $DestRepo = (Resolve-Path $Local).Path
    if (-not (Has-GitDir $DestRepo)) { Die "--local path '$DestRepo' is not a git checkout" }
} else {
    Write-Host "Cloning $Fork..."
    $CleanupDir = New-TempDir
    $DestRepo = Join-Path $CleanupDir 'openai-codex-plugins'
    gh repo clone $Fork $DestRepo 2>$null
    if ($LASTEXITCODE -ne 0) { Die "failed to clone $Fork" }
}

$Dest = Join-Path $DestRepo $DestRel
$PreviewRepo = $DestRepo
$PreviewDest = $Dest

$Timestamp = (Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmmss')
if ($Bootstrap) {
    $SyncBranch = "bootstrap/superpowers-${UpstreamShort}-${Timestamp}"
} else {
    $SyncBranch = "sync/superpowers-${UpstreamShort}-${Timestamp}"
}

# =============================================================================
# Build exclude args for robocopy
# =============================================================================

function Build-RobocopyExcludes($Repo, [string[]]$BaseExcludes) {
    $allExcludes = [System.Collections.ArrayList]@()
    foreach ($e in $BaseExcludes) { $null = $allExcludes.Add($e.TrimStart('/')) }
    
    $ignoredDirs = Get-GitIgnoredDirs $Repo
    $ignoredFiles = Get-GitIgnoredFiles $Repo
    
    foreach ($d in $ignoredDirs) {
        $clean = $d.TrimEnd('/')
        # Check if any tracked files exist under this directory
        Push-Location $Repo
        $hasTracked = (git ls-files --cached -- "$clean/" 2>$null)
        Pop-Location
        if (-not $hasTracked) {
            $null = $allExcludes.Add($d)
        }
    }
    
    foreach ($f in $ignoredFiles) {
        if ($f -and -not ($ignoredDirs | Where-Object { $f.StartsWith($_) })) {
            $null = $allExcludes.Add($f)
        }
    }
    
    return $allExcludes
}

function Copy-PreservedMetadata($Destination, $Source) {
    $skillsDir = Join-Path $Destination 'skills'
    if (-not (Test-Path $skillsDir)) { return }
    
    Get-ChildItem -Path $skillsDir -Directory -Recurse -ErrorAction SilentlyContinue |
        Where-Object { Test-Path (Join-Path $_.FullName 'agents\openai.yaml') } |
        ForEach-Object {
            $rel = $_.FullName.Substring($Destination.Length).TrimStart('\')
            $destMeta = Join-Path $Source $rel
            New-Item -ItemType Directory -Force -Path (Split-Path $destMeta) | Out-Null
            Copy-Item -Path (Join-Path $_.FullName 'agents\openai.yaml') -Destination $destMeta -Force
        }
}

# =============================================================================
# Prepare sync source
# =============================================================================

function Build-SyncSource($Dest) {
    $syncSource = Join-Path $CleanupDir 'source-overlay'
    if (Test-Path $syncSource) { Remove-Item -Recurse -Force $syncSource }
    New-Item -ItemType Directory -Force -Path $syncSource | Out-Null
    
    $excludeList = Build-RobocopyExcludes -Repo $Upstream -BaseExcludes $Excludes
    $robocopyArgs = @($Upstream, $syncSource)
    foreach ($e in $excludeList) {
        $robocopyArgs += "/XF:$e"
        $robocopyArgs += "/XD:$e"
    }
    Invoke-Robocopy @robocopyArgs
    Copy-PreservedMetadata -Destination $Dest -Source $syncSource
    
    return $syncSource
}

# =============================================================================
# Prepare preview checkout
# =============================================================================

function Prepare-PreviewCheckout {
    if ($LocalMode) {
        $script:PreviewRepo = Join-Path $CleanupDir 'preview'
        git clone -q --no-local $DestRepo $PreviewRepo 2>$null
        $script:PreviewDest = Join-Path $PreviewRepo $DestRel
    }
    
    Push-Location $PreviewRepo
    git checkout -q $Base 2>$null
    if ($LASTEXITCODE -ne 0) { Die "base branch '$Base' doesn't exist in $Fork" }
    Pop-Location
    
    if ($LocalMode) {
        # Copy any local destination changes into preview
        Copy-Item -Path $Dest -Destination (Join-Path $PreviewRepo $DestRel) -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    if (-not $Bootstrap) {
        if (-not (Test-Path $PreviewDest)) {
            Die "base branch '$Base' has no '$DestRel/' вЂ” use -Bootstrap, or pass -Base <branch>"
        }
    }
}

function Prepare-ApplyCheckout {
    Push-Location $DestRepo
    git checkout -q $Base 2>$null
    if ($LASTEXITCODE -ne 0) { Die "base branch '$Base' doesn't exist in $Fork" }
    Pop-Location
    
    if (-not $Bootstrap) {
        if (-not (Test-Path $Dest)) {
            Die "base branch '$Base' has no '$DestRel/' вЂ” use -Bootstrap, or pass -Base <branch>"
        }
    }
}

function Apply-ToPreview($SyncSource) {
    if ($Bootstrap) {
        New-Item -ItemType Directory -Force -Path $PreviewDest | Out-Null
    }
    Invoke-Robocopy -Source $SyncSource -Dest $PreviewDest
}

function Has-PreviewChanges {
    Push-Location $PreviewRepo
    $status = git status --porcelain $DestRel 2>$null
    Pop-Location
    return ($status -ne $null -and $status.Trim() -ne '')
}

# =============================================================================
# Execute
# =============================================================================

Prepare-PreviewCheckout

# Build sync source
$SyncSource = Build-SyncSource -Dest $PreviewDest

# =============================================================================
# Dry run preview (always shown)
# =============================================================================

Write-Host ""
Write-Host "Upstream: $Upstream ($UpstreamBranch @ $UpstreamShort)"
Write-Host "Version:  $UpstreamVersion"
Write-Host "Fork:     $Fork"
Write-Host "Base:     $Base"
Write-Host "Branch:   $SyncBranch"
if ($Bootstrap) { Write-Host "Mode:     BOOTSTRAP (creating plugins/superpowers/ when absent)" }
Write-Host ""
Write-Host "=== Preview (robocopy /L) ==="
$previewExcludes = Build-RobocopyExcludes -Repo $Upstream -BaseExcludes $Excludes
$previewArgs = @($SyncSource, $PreviewDest, '/MIR', '/L', '/R:0', '/W:0')
foreach ($e in $previewExcludes) {
    $previewArgs += "/XF:$e"
    $previewArgs += "/XD:$e"
}
& robocopy @previewArgs
Write-Host "=== End preview ==="
Write-Host ""

if ($DryRun) {
    Write-Host "Dry run only. Nothing was changed or pushed."
    exit 0
}

# =============================================================================
# Apply
# =============================================================================

Write-Host ""
if (-not (Confirm-User "Apply changes, push branch, and open PR?")) {
    Write-Host "Aborted."
    exit 1
}

Write-Host ""

if ($LocalMode) {
    Apply-ToPreview -SyncSource $SyncSource
    if (-not (Has-PreviewChanges)) {
        Write-Host "No changes вЂ” embedded plugin was already in sync with upstream $UpstreamShort (v$UpstreamVersion)."
        exit 0
    }
}

Prepare-ApplyCheckout
Push-Location $DestRepo
git checkout -q -b $SyncBranch
Pop-Location

Write-Host "Syncing upstream content..."
if ($Bootstrap) {
    New-Item -ItemType Directory -Force -Path $Dest | Out-Null
}
$applyExcludes = Build-RobocopyExcludes -Repo $Upstream -BaseExcludes $Excludes
$applyArgs = @($SyncSource, $Dest)
foreach ($e in $applyExcludes) {
    $applyArgs += "/XF:$e"
    $applyArgs += "/XD:$e"
}
Invoke-Robocopy @applyArgs

# Bail early if nothing changed
Push-Location $DestRepo
$changes = git status --porcelain $DestRel 2>$null
Pop-Location
if (-not $changes -or $changes.Trim() -eq '') {
    Write-Host "No changes вЂ” embedded plugin was already in sync with upstream $UpstreamShort (v$UpstreamVersion)."
    exit 0
}

# =============================================================================
# Commit, push, open PR
# =============================================================================

Push-Location $DestRepo
git add $DestRel

if ($Bootstrap) {
    $commitTitle = "bootstrap superpowers v$UpstreamVersion from upstream main @ $UpstreamShort"
    $prBody = @"
Initial bootstrap of the superpowers plugin from upstream `main` @ `$UpstreamShort` (v$UpstreamVersion).

Creates `plugins/superpowers/` by copying the tracked plugin files from upstream, including `.codex-plugin/plugin.json` and `assets/`.

Run via: `scripts/sync-to-codex-plugin.ps1 -Bootstrap`
Upstream commit: https://github.com/obra/superpowers/commit/$UpstreamSha

This is a one-time bootstrap. Subsequent syncs will be normal (non-bootstrap) runs using the same tracked upstream plugin files.
"@
} else {
    $commitTitle = "sync superpowers v$UpstreamVersion from upstream main @ $UpstreamShort"
    $prBody = @"
Automated sync from superpowers upstream `main` @ `$UpstreamShort` (v$UpstreamVersion).

Copies the tracked plugin files from upstream, including the committed Codex manifest and assets.

Run via: `scripts/sync-to-codex-plugin.ps1`
Upstream commit: https://github.com/obra/superpowers/commit/$UpstreamSha

Running the sync tool again against the same upstream SHA should produce a PR with an identical diff вЂ” use that to verify the tool is behaving.
"@
}

git commit --quiet -m "$commitTitle

Automated sync via scripts/sync-to-codex-plugin.ps1
Upstream: https://github.com/obra/superpowers/commit/$UpstreamSha
Branch:   $SyncBranch"

Write-Host "Pushing $SyncBranch to $Fork..."
git push -u origin $SyncBranch --quiet

Write-Host "Opening PR..."
$prUrl = gh pr create `
    --repo $Fork `
    --base $Base `
    --head $SyncBranch `
    --title $commitTitle `
    --body $prBody 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "PR opened: $prUrl"
} else {
    Write-Host "Branch pushed. Create PR manually at https://github.com/$Fork"
}

Pop-Location
