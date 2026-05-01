# Update Superpowers for Kimi Code
# Pulls latest changes and re-runs the install script.

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot

Write-Host "=== Updating Superpowers ==="
Set-Location $repoRoot
git pull

Write-Host ""
& (Join-Path $PSScriptRoot "install.ps1")
