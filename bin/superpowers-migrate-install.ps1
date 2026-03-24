$CompatPath = (Resolve-Path (Join-Path $PSScriptRoot '..\compat\powershell\superpowers.ps1')).Path
$ForwardArgs = @("install", "migrate") + $args
& $CompatPath @ForwardArgs
exit $LASTEXITCODE
