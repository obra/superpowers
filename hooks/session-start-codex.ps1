$ErrorActionPreference = "Stop"

$runHook = Join-Path $PSScriptRoot "run-hook.cmd"

if (-not (Test-Path -LiteralPath $runHook)) {
    Write-Error "Missing superpowers hook wrapper at $runHook"
    exit 1
}

$env:SUPERPOWERS_HOOK_TARGET = "codex"

& $runHook session-start

if ($null -eq $LASTEXITCODE) {
    exit 0
}

exit $LASTEXITCODE
