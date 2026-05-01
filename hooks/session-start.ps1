# SessionStart hook for superpowers plugin — Windows/PowerShell wrapper.
# VS Code Copilot runs Windows hooks as PowerShell.  This wrapper locates
# Git-for-Windows bash and delegates to the platform-agnostic session-start
# bash script that ships alongside it.

$bashExe = $null
foreach ($candidate in @(
    'C:\Program Files\Git\bin\bash.exe',
    'C:\Program Files (x86)\Git\bin\bash.exe'
)) {
    if (Test-Path $candidate) { $bashExe = $candidate; break }
}
if (-not $bashExe) {
    $cmd = Get-Command bash -ErrorAction SilentlyContinue
    if ($cmd) { $bashExe = $cmd.Source }
}
if (-not $bashExe) { exit 0 }   # No bash — exit silently

$scriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$bashScript = Join-Path $scriptDir 'session-start'
if (-not (Test-Path $bashScript)) { exit 0 }

# Tell the bash script to output SDK-standard format (top-level additionalContext).
$env:COPILOT_CLI = '1'

& $bashExe $bashScript
exit $LASTEXITCODE
