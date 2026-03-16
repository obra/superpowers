$commonPath = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\bin\superpowers-pwsh-common.ps1')).Path
. $commonPath

$bashPath = Get-SuperpowersBashPath
$bashScript = Convert-SuperpowersPathToBash -Path (Join-Path $PSScriptRoot 'stop-server.sh')

$forwardArgs = @($args)
if ($forwardArgs.Count -gt 0) {
  $forwardArgs[0] = Convert-SuperpowersPathToBash -Path ([string]$forwardArgs[0])
}

& $bashPath $bashScript @forwardArgs
exit $LASTEXITCODE
