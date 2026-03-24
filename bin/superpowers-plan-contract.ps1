$CompatPath = (Resolve-Path (Join-Path $PSScriptRoot '..\compat\powershell\superpowers.ps1')).Path
$ForwardArgs = @("plan", "contract") + $args
& $CompatPath @ForwardArgs
exit $LASTEXITCODE
