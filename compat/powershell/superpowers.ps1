$CommonPath = (Resolve-Path (Join-Path $PSScriptRoot '..\..\bin\superpowers-pwsh-common.ps1')).Path
. $CommonPath

$BashPath = Get-SuperpowersBashPath
$BashScript = Convert-SuperpowersPathToBash -Path (Join-Path $PSScriptRoot '..\bash\superpowers')
$Output = $null
$ExitCode = 0
$RestoreNativeExitPreference = $false
$NativeExitPreference = $null
$NativeExitVariable = Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue
if ($NativeExitVariable) {
  $NativeExitPreference = $NativeExitVariable.Value
  $PSNativeCommandUseErrorActionPreference = $false
  $RestoreNativeExitPreference = $true
}

try {
  $Output = & $BashPath $BashScript @args
  $ExitCode = $LASTEXITCODE
}
finally {
  if ($RestoreNativeExitPreference) {
    $PSNativeCommandUseErrorActionPreference = $NativeExitPreference
  }
}

if ($null -ne $Output) {
  $Output
}

try {
  $host.SetShouldExit([int]$ExitCode)
  return
}
catch {
  exit $ExitCode
}
