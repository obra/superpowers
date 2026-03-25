$commonPath = (Resolve-Path (Join-Path $PSScriptRoot 'featureforge-pwsh-common.ps1')).Path
. $commonPath

$bashPath = Get-FeatureForgeBashPath
$bashScript = Convert-FeatureForgePathToBash -Path (Join-Path $PSScriptRoot 'start-server.sh')

$forwardArgs = New-Object System.Collections.Generic.List[string]
for ($i = 0; $i -lt $args.Count; $i++) {
  $arg = [string]$args[$i]
  $forwardArgs.Add($arg)
  if ($arg -eq '--project-dir' -and $i + 1 -lt $args.Count) {
    $i++
    $forwardArgs.Add((Convert-FeatureForgePathToBash -Path ([string]$args[$i])))
  }
}

& $bashPath $bashScript @($forwardArgs.ToArray()) | ForEach-Object {
  $line = [string]$_
  Write-Output (Convert-FeatureForgeJsonFieldPathsToWindows -JsonText $line -Fields @('screen_dir'))
}
$exitCode = $LASTEXITCODE

exit $exitCode
