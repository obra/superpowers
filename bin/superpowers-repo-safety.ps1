$CompatPath = (Resolve-Path (Join-Path $PSScriptRoot '..\compat\powershell\superpowers.ps1')).Path
$ForwardArgs = @("repo-safety") + $args
& $CompatPath @ForwardArgs
exit $LASTEXITCODE
