# Install Superpowers for Kimi Code (no symlinks)
# Copies skills to ~/.config/agents/skills/ and configures a SessionStart hook.

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$skillsSource = Join-Path $repoRoot "skills"
$skillsTarget = Join-Path $env:USERPROFILE ".config\agents\skills"
$configFile = Join-Path $env:USERPROFILE ".kimi\config.toml"
$hookCommand = "'" + (Join-Path $repoRoot ".kimi\hooks\session-start") + "'"

Write-Host "=== Installing Superpowers for Kimi Code ==="
Write-Host ""

# 1. Copy skills to the generic cross-compatible path
New-Item -ItemType Directory -Force -Path $skillsTarget | Out-Null

$sourceDirs = Get-ChildItem -Path $skillsSource -Directory
foreach ($dir in $sourceDirs) {
    $targetDir = Join-Path $skillsTarget $dir.Name
    if (Test-Path $targetDir) {
        Remove-Item -Recurse -Force $targetDir
    }
    Copy-Item -Recurse -Path $dir.FullName -Destination $targetDir
    Write-Host "  Installed skill: $($dir.Name)"
}

Write-Host ""
Write-Host "Skills installed to: $skillsTarget"

# 2. Configure ~/.kimi/config.toml
#    - Remove any existing merge_all_available_skills to avoid duplicates
#    - Remove any existing inline hooks = [...] to avoid conflict with [[hooks]] table arrays
#    - Append our settings cleanly

$configLines = @()
if (Test-Path $configFile) {
    $configLines = Get-Content $configFile
    
    # Filter out duplicate/conflicting lines
    $configLines = $configLines | Where-Object { 
        $_ -notmatch '^\s*merge_all_available_skills\s*=' -and 
        $_ -notmatch '^\s*hooks\s*=\s*\[' 
    }
    
    # Write cleaned config back
    $configLines | Set-Content $configFile -Encoding utf8
} else {
    New-Item -ItemType Directory -Force -Path (Split-Path $configFile) | Out-Null
}

Write-Host ""
Write-Host "Enabling merge_all_available_skills in $configFile..."
"merge_all_available_skills = true" | Out-File -Append -FilePath $configFile -Encoding utf8

# 3. Add SessionStart hook if not already present
$hasHook = $configLines | Where-Object { $_ -match [regex]::Escape($hookCommand) }
if (-not $hasHook) {
    Write-Host ""
    Write-Host "Adding SessionStart hook to $configFile..."
    @"

[[hooks]]
event = "SessionStart"
command = $hookCommand
"@ | Out-File -Append -FilePath $configFile -Encoding utf8
}

Write-Host ""
Write-Host "=== Installation complete ==="
Write-Host ""
Write-Host "To verify, start Kimi Code and ask:"
Write-Host "  Tell me about your superpowers"
Write-Host ""
Write-Host "To update later, run:"
Write-Host "  $(Join-Path $repoRoot ".kimi\update.ps1")"
