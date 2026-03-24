$CommonPath = (Resolve-Path (Join-Path $PSScriptRoot 'superpowers-pwsh-common.ps1')).Path
. $CommonPath

$RuntimeRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path

try {
  $TargetKey = Get-SuperpowersHostTarget
  $Candidate = Resolve-SuperpowersRepoRuntimeBinary -RuntimeRoot $RuntimeRoot -TargetKey $TargetKey
  & $Candidate @args
  exit $LASTEXITCODE
}
catch {
  [Console]::Error.WriteLine($_.Exception.Message)
  exit 127
}
