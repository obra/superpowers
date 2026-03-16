$commonPath = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\bin\superpowers-pwsh-common.ps1')).Path
. $commonPath

$bashPath = Get-SuperpowersBashPath
$bashScript = Convert-SuperpowersPathToBash -Path (Join-Path $PSScriptRoot 'start-server.sh')

$forwardArgs = New-Object System.Collections.Generic.List[string]
for ($i = 0; $i -lt $args.Count; $i++) {
  $arg = [string]$args[$i]
  $forwardArgs.Add($arg)
  if ($arg -eq '--project-dir' -and $i + 1 -lt $args.Count) {
    $i++
    $forwardArgs.Add((Convert-SuperpowersPathToBash -Path ([string]$args[$i])))
  }
}

$output = @(& $bashPath $bashScript @($forwardArgs.ToArray()))
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0 -and $output.Count -eq 1) {
  $line = [string]$output[0]
  $converted = Convert-SuperpowersJsonFieldPathsToWindows -JsonText $line -Fields @('screen_dir')
  Write-Output $converted
} else {
  $output | Write-Output
}

exit $exitCode
