# Superpowers local install script for Windows PowerShell
# Usage: .\install.ps1
param()
$ErrorActionPreference = "Stop"
$RepoDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=== Installing Superpowers ===" -ForegroundColor Cyan

# 1. Install skills
$SkillsTarget = "$env:USERPROFILE\.claude\skills"
New-Item -ItemType Directory -Force -Path $SkillsTarget | Out-Null
$skills = Get-ChildItem "$RepoDir\skills" -Directory
foreach ($skill in $skills) {
    $dest = "$SkillsTarget\$($skill.Name)"
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Copy-Item "$($skill.FullName)\*" -Destination $dest -Recurse -Force
}
Write-Host "OK Skills installed ($($skills.Count))" -ForegroundColor Green

# 2. Install commands
$CommandsTarget = "$env:USERPROFILE\.claude\commands"
New-Item -ItemType Directory -Force -Path $CommandsTarget | Out-Null
$cmds = Get-ChildItem "$RepoDir\commands" -Filter "*.md" -ErrorAction SilentlyContinue
foreach ($cmd in $cmds) {
    Copy-Item $cmd.FullName -Destination $CommandsTarget -Force
}
Write-Host "OK Commands installed ($($cmds.Count))" -ForegroundColor Green

# 3. Register SessionStart hook in settings.json
$SettingsFile = "$env:USERPROFILE\.claude\settings.json"
$HookCmd = "$RepoDir\hooks\run-hook.cmd"

if (Test-Path $SettingsFile) {
    Copy-Item $SettingsFile "$SettingsFile.backup" -Force
    Write-Host "OK Backed up existing settings.json" -ForegroundColor Yellow
}

$settingsJson = @"
{
    "`$schema": "https://json.schemastore.org/claude-code-settings.json",
    "hooks": {
        "SessionStart": [
            {
                "matcher": "startup|resume|clear|compact",
                "hooks": [
                    {
                        "type": "command",
                        "command": "$($HookCmd.Replace('\','\\')) session-start",
                        "async": false
                    }
                ]
            }
        ]
    },
    "permissions": {
        "allow": ["Skill"]
    }
}
"@

$settingsJson | Set-Content $SettingsFile -Encoding UTF8
Write-Host "OK settings.json configured" -ForegroundColor Green

# 4. Install worktrunk (optional)
if (-not (Get-Command wt -ErrorAction SilentlyContinue)) {
    if (Get-Command cargo -ErrorAction SilentlyContinue) {
        Write-Host "Installing worktrunk..." -ForegroundColor Yellow
        cargo install worktrunk
        Write-Host "OK worktrunk installed" -ForegroundColor Green
    } else {
        Write-Host "SKIP worktrunk (Rust not found - install from https://rustup.rs then run: cargo install worktrunk)" -ForegroundColor Yellow
    }
} else {
    Write-Host "OK worktrunk already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Installation complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Commands:"
Write-Host "  /brainstorm   - design conversation"
Write-Host "  /write-plan   - create implementation plan"
Write-Host "  /execute-plan - execute plan step by step"
Write-Host "  wt switch [branch] - parallel worktree switch"
Write-Host ""
Write-Host "Restart Claude Code to activate superpowers." -ForegroundColor Green
