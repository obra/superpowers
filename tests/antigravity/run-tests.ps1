# Validate the Antigravity integration on Windows via PowerShell.
# Mirrors tests/antigravity/run-tests.sh and its child test scripts:
#   - test-antigravity-tools.sh
#   - test-logo.sh
#   - test-plugin-manifest.sh
#
# CI-safe: runs with standard Windows PowerShell (5.1+) and PowerShell 7+.

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot  = (Resolve-Path "$ScriptDir\..\..").Path

Write-Host "=== Antigravity integration tests (PowerShell/Windows) ===" -ForegroundColor Cyan

function Fail([string]$Message) {
    Write-Host "FAIL: $Message" -ForegroundColor Red
    exit 1
}

function Pass([string]$Message) {
    Write-Host "PASS: $Message" -ForegroundColor Green
}

function Skip([string]$Message) {
    Write-Host "SKIP: $Message" -ForegroundColor Yellow
}

# ==============================================================================
# TEST 1: Antigravity Tool Mapping (mirrors test-antigravity-tools.sh)
# ==============================================================================
Write-Host "`n>>> test-antigravity-tools: checking Antigravity tool mapping" -ForegroundColor White

$MappingFile = Join-Path $RepoRoot "skills\using-superpowers\references\antigravity-tools.md"
$SkillFile   = Join-Path $RepoRoot "skills\using-superpowers\SKILL.md"

if (-not (Test-Path $MappingFile)) {
    Fail "tool mapping missing at $MappingFile"
}

$MappingContent = Get-Content -Raw -Encoding UTF8 $MappingFile
$SkillContent   = Get-Content -Raw -Encoding UTF8 $SkillFile

# Core action -> tool mappings
foreach ($tool in @("write_to_file", "replace_file_content", "invoke_subagent")) {
    if ($MappingContent -notmatch [regex]::Escape($tool)) {
        Fail "mapping does not document the '$tool' tool"
    }
}

# Subagent built-in types
if ($MappingContent -notmatch '`self`') {
    Fail "mapping does not document the built-in 'self' subagent type"
}
if ($MappingContent -notmatch '`research`') {
    Fail "mapping does not document the built-in 'research' subagent type"
}

# Task tracking artifact
if ($MappingContent -notmatch "ArtifactType.*task|task.\s*artifact") {
    Fail "mapping does not document task tracking as a 'task' artifact"
}

# SKILL.md Platform Adaptation reference
if ($SkillContent -notmatch "antigravity-tools\.md") {
    Fail "SKILL.md Platform Adaptation does not reference antigravity-tools.md"
}

Pass "Antigravity tool mapping valid (subagent dispatch, task artifact, SKILL.md link)"

# ==============================================================================
# TEST 2: Antigravity Logo Validation (mirrors test-logo.sh)
# ==============================================================================
Write-Host "`n>>> test-logo: checking Antigravity logo" -ForegroundColor White

$LogoFile = Join-Path $RepoRoot "assets\antigravity-logo.png"
if (-not (Test-Path $LogoFile)) {
    Fail "logo missing at $LogoFile"
}

$bytes = [System.IO.File]::ReadAllBytes($LogoFile)
if ($bytes.Length -lt 26) {
    Fail "logo file is too small to be a valid PNG"
}

# Check PNG magic bytes: \x89PNG\r\n\x1a\n
$expectedHeader = @(0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)
for ($i = 0; $i -lt 8; $i++) {
    if ($bytes[$i] -ne $expectedHeader[$i]) {
        Fail "logo is not a valid PNG"
    }
}

# Read width, height, color_type from IHDR chunk (big-endian)
$wBytes = [byte[]]$bytes[16..19]
[Array]::Reverse($wBytes)
$width = [System.BitConverter]::ToInt32($wBytes, 0)

$hBytes = [byte[]]$bytes[20..23]
[Array]::Reverse($hBytes)
$height = [System.BitConverter]::ToInt32($hBytes, 0)
$colorType = $bytes[25]

if ($width -ne $height) {
    Fail "logo is not square ($width x $height)"
}
if ($width -lt 128) {
    Fail "logo is smaller than 128x128 ($width x $height)"
}
if ($colorType -ne 6) {
    Fail "logo is not RGBA (PNG color type $colorType, expected 6)"
}

Pass "Antigravity logo valid ($width x $height RGBA)"

# ==============================================================================
# TEST 3: Plugin Manifest & Repo Layout (mirrors test-plugin-manifest.sh)
# ==============================================================================
Write-Host "`n>>> test-plugin-manifest: checking Antigravity plugin manifest" -ForegroundColor White

$ManifestPath = Join-Path $RepoRoot ".antigravity-plugin\plugin.json"
if (-not (Test-Path $ManifestPath)) {
    Fail "manifest missing at $ManifestPath"
}

try {
    $manifest = Get-Content -Raw -Encoding UTF8 $ManifestPath | ConvertFrom-Json
} catch {
    Fail "manifest is not valid JSON: $_"
}

# Required fields
$requiredFields = @("name", "description", "displayName", "logo", "suggestedPrompts", "version", "author")
foreach ($field in $requiredFields) {
    $val = $manifest.$field
    if ($null -eq $val -or "$val".Trim() -eq "") {
        Fail "manifest field '$field' is missing or empty"
    }
}

if ($manifest.name -ne "superpowers") {
    Fail "name must be 'superpowers', got '$($manifest.name)'"
}
if ($manifest.name -notmatch "^[a-z0-9]+(-[a-z0-9]+)*$") {
    Fail "name is not kebab-case"
}

if ($manifest.description.Length -gt 160) {
    Fail "description is $($manifest.description.Length) characters; Marketplace cards fit at most 160"
}

$prompts = $manifest.suggestedPrompts
if ($prompts.Count -lt 1 -or $prompts.Count -gt 3) {
    Fail "suggestedPrompts must contain 1-3 prompts"
}

# Check parity with .claude-plugin/plugin.json
$ClaudeManifestPath = Join-Path $RepoRoot ".claude-plugin\plugin.json"
if (Test-Path $ClaudeManifestPath) {
    $claudeManifest = Get-Content -Raw -Encoding UTF8 $ClaudeManifestPath | ConvertFrom-Json
    if ($manifest.version -ne $claudeManifest.version) {
        Fail "version '$($manifest.version)' does not match .claude-plugin version '$($claudeManifest.version)'"
    }
    if ($manifest.author.name -ne $claudeManifest.author.name -or $manifest.author.email -ne $claudeManifest.author.email) {
        Fail "author does not match .claude-plugin/plugin.json"
    }
}

# Version bumps registration (.version-bump.json)
$VersionBumpPath = Join-Path $RepoRoot ".version-bump.json"
if (Test-Path $VersionBumpPath) {
    $versionConfig = Get-Content -Raw -Encoding UTF8 $VersionBumpPath | ConvertFrom-Json
    $registered = $false
    foreach ($entry in $versionConfig.files) {
        if ($entry.path -eq ".antigravity-plugin/plugin.json" -and $entry.field -eq "version") {
            $registered = $true
            break
        }
    }
    if (-not $registered) {
        Fail ".version-bump.json does not register .antigravity-plugin/plugin.json"
    }
}

# Bootstrap check: using-superpowers description
$SkillFile = Join-Path $RepoRoot "skills\using-superpowers\SKILL.md"
$SkillContent = Get-Content -Raw -Encoding UTF8 $SkillFile
if ($SkillContent -notmatch "(?ms)^---\s*\n(.*?)\n---") {
    Fail "SKILL.md frontmatter not found"
}
$frontmatter = $Matches[1]
if ($frontmatter -notmatch "(?m)^description:\s*(.*)$") {
    Fail "SKILL.md description not found in frontmatter"
}
$descriptionVal = $Matches[1]
if ($descriptionVal -notmatch "Use when starting any conversation") {
    Fail "using-superpowers description no longer says 'Use when starting any conversation'; Antigravity relies on it to bootstrap"
}

# Layout agy depends on: root plugin.json, hooks.json, rules must not exist
foreach ($stray in @("plugin.json", "hooks.json", "rules")) {
    $strayPath = Join-Path $RepoRoot $stray
    if (Test-Path $strayPath) {
        Fail "root $stray must not exist"
    }
}

# Check if agy CLI is installed on PATH
$agyCmd = Get-Command "agy" -ErrorAction SilentlyContinue
if ($agyCmd) {
    Write-Host "Running: agy plugin validate"
    & agy plugin validate $RepoRoot
    if ($LASTEXITCODE -ne 0) {
        Fail "agy plugin validate failed"
    }
} else {
    Skip "agy not on PATH; not running agy plugin validate"
}

Pass "Antigravity plugin manifest and layout valid"

Write-Host "`n=== All Antigravity tests passed (Windows) ===" -ForegroundColor Cyan
exit 0
