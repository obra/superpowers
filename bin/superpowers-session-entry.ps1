$CompatPath = (Resolve-Path (Join-Path $PSScriptRoot '..\compat\powershell\superpowers.ps1')).Path
$ForwardArgs = @("session-entry") + $args
& $CompatPath @ForwardArgs
exit $LASTEXITCODE
