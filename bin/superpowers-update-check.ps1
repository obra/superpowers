$CompatPath = (Resolve-Path (Join-Path $PSScriptRoot '..\compat\powershell\superpowers.ps1')).Path
$ForwardArgs = @("update-check") + $args
& $CompatPath @ForwardArgs
exit $LASTEXITCODE
