$CommonPath = (Resolve-Path (Join-Path $PSScriptRoot 'superpowers-pwsh-common.ps1')).Path
. $CommonPath

$RuntimeRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$ExitCode = 0
$ErrorMessage = $null
$RestoreNativeExitPreference = $false
$NativeExitPreference = $null
$NativeExitVariable = Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue
if ($NativeExitVariable) {
  $NativeExitPreference = $NativeExitVariable.Value
  $PSNativeCommandUseErrorActionPreference = $false
  $RestoreNativeExitPreference = $true
}

try {
  $TargetKey = Get-SuperpowersHostTarget
  $Candidate = Resolve-SuperpowersRepoRuntimeBinary -RuntimeRoot $RuntimeRoot -TargetKey $TargetKey
  & $Candidate @args
  $ExitCode = $LASTEXITCODE
}
catch {
  $ErrorMessage = $_.Exception.Message
}
finally {
  if ($RestoreNativeExitPreference) {
    $PSNativeCommandUseErrorActionPreference = $NativeExitPreference
  }
}

if ($null -ne $ErrorMessage) {
  [Console]::Error.WriteLine($ErrorMessage)
  exit 127
}

exit $ExitCode
