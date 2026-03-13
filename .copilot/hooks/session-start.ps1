# Lightweight sessionStart hook for Copilot CLI (Windows/PowerShell)
# Note: Copilot CLI ignores sessionStart stdout (unlike Claude Code).
# Skills are discovered natively via plugin.json — no injection needed.
# This hook handles update checks and legacy location warnings only.

$ErrorActionPreference = "SilentlyContinue"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PluginRoot = (Resolve-Path (Join-Path $ScriptDir "..\..")).Path

# Warn about legacy skills directory
$legacyDir = Join-Path $env:USERPROFILE ".config\superpowers\skills"
if (Test-Path $legacyDir) {
    Write-Host "[superpowers] WARNING: Custom skills in ~/.config/superpowers/skills will not be read." -ForegroundColor Yellow
    Write-Host "[superpowers] Move custom skills to ~/.copilot/skills/ instead." -ForegroundColor Yellow
    Write-Host "[superpowers] Remove ~/.config/superpowers/skills to silence this warning." -ForegroundColor Yellow
}

# Check for available updates (non-blocking, best-effort)
$gitDir = Join-Path $PluginRoot ".git"
if ((Get-Command git -ErrorAction SilentlyContinue) -and (Test-Path $gitDir)) {
    $env:GIT_TERMINAL_PROMPT = "0"
    git -C "$PluginRoot" fetch --quiet 2>$null
    $local = git -C "$PluginRoot" rev-parse HEAD 2>$null
    $remote = git -C "$PluginRoot" rev-parse '@{u}' 2>$null
    if ($local -and $remote -and ($local -ne $remote)) {
        Write-Host "[superpowers] Update available. Run: cd '$PluginRoot'; git pull" -ForegroundColor Cyan
    }
}

exit 0
