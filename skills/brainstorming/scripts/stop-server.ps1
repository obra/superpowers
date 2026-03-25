$commonPath = (Resolve-Path (Join-Path $PSScriptRoot 'featureforge-pwsh-common.ps1')).Path
. $commonPath

$bashPath = Get-FeatureForgeBashPath
$bashScript = Convert-FeatureForgePathToBash -Path (Join-Path $PSScriptRoot 'stop-server.sh')

$forwardArgs = @($args)
if ($forwardArgs.Count -gt 0) {
  $forwardArgs[0] = Convert-FeatureForgePathToBash -Path ([string]$forwardArgs[0])
}

& $bashPath $bashScript @forwardArgs
exit $LASTEXITCODE
