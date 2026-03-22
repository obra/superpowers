. (Join-Path $PSScriptRoot 'superpowers-pwsh-common.ps1')

$bashPath = Get-SuperpowersBashPath
$bashScript = Convert-SuperpowersPathToBash -Path (Join-Path $PSScriptRoot 'superpowers-repo-safety')
$output = $null
$exitCode = 0
$restoreNativeExitPreference = $false
$nativeExitPreference = $null
$nativeExitVariable = Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue
if ($nativeExitVariable) {
  $nativeExitPreference = $nativeExitVariable.Value
  $PSNativeCommandUseErrorActionPreference = $false
  $restoreNativeExitPreference = $true
}

try {
  $output = & $bashPath $bashScript @args
  $exitCode = $LASTEXITCODE
}
finally {
  if ($restoreNativeExitPreference) {
    $PSNativeCommandUseErrorActionPreference = $nativeExitPreference
  }
}

if ($exitCode -eq 0 -and $null -ne $output) {
  $outputText = if ($output -is [System.Array]) { ($output -join "`n") } else { [string]$output }
  if (-not [string]::IsNullOrWhiteSpace($outputText) -and $outputText.TrimStart().StartsWith('{')) {
    $outputText = Convert-SuperpowersJsonFieldPathsToWindows -JsonText $outputText -Fields @('approval_path')
  }
  $output = $outputText
}

if ($null -ne $output) {
  $output
}
try {
  $host.SetShouldExit([int]$exitCode)
  return
}
catch {
  exit $exitCode
}
