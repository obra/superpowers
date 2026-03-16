. (Join-Path $PSScriptRoot 'superpowers-pwsh-common.ps1')

$bashPath = Get-SuperpowersBashPath
$bashScript = Convert-SuperpowersPathToBash -Path (Join-Path $PSScriptRoot 'superpowers-update-check')

& $bashPath $bashScript @args
exit $LASTEXITCODE
