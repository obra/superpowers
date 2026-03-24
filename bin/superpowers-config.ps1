$CompatPath = (Resolve-Path (Join-Path $PSScriptRoot '..\compat\powershell\superpowers.ps1')).Path
$ForwardArgs = @("config") + $args
& $CompatPath @ForwardArgs
exit $LASTEXITCODE
