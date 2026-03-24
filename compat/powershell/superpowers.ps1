$CommonPath = (Resolve-Path (Join-Path $PSScriptRoot '..\..\bin\superpowers-pwsh-common.ps1')).Path
. $CommonPath

function Normalize-SuperpowersCompatArgs {
  param(
    [string[]]$ForwardArgs
  )

  if ($null -eq $ForwardArgs -or $ForwardArgs.Count -eq 0) {
    return @()
  }

  $prefix = @()
  switch ($ForwardArgs[0]) {
    'workflow' {
      if ($ForwardArgs.Count -gt 1 -and $ForwardArgs[1] -eq 'status') {
        $prefix = @('workflow', 'status')
      } else {
        $prefix = @('workflow')
      }
    }
    'plan' {
      if ($ForwardArgs.Count -gt 1 -and @('execution', 'contract') -contains $ForwardArgs[1]) {
        $prefix = @('plan', $ForwardArgs[1])
      }
    }
    'repo-safety' { $prefix = @('repo-safety') }
    'session-entry' { $prefix = @('session-entry') }
    'update-check' { $prefix = @('update-check') }
    'config' { $prefix = @('config') }
    'install' {
      if ($ForwardArgs.Count -gt 1 -and $ForwardArgs[1] -eq 'migrate') {
        $prefix = @('install', 'migrate')
      }
    }
  }

  if ($prefix.Count -eq 0 -or $ForwardArgs.Count -le $prefix.Count) {
    return $ForwardArgs
  }

  $remaining = @($ForwardArgs[$prefix.Count..($ForwardArgs.Count - 1)])
  $maxOverlap = [Math]::Min($prefix.Count, $remaining.Count)
  $overlap = 0

  for ($candidate = $maxOverlap; $candidate -ge 0; $candidate--) {
    $matches = $true
    for ($index = 0; $index -lt $candidate; $index++) {
      $prefixIndex = $prefix.Count - $candidate + $index
      if ($remaining[$index] -ne $prefix[$prefixIndex]) {
        $matches = $false
        break
      }
    }
    if ($matches) {
      $overlap = $candidate
      break
    }
  }

  $normalized = @($prefix)
  if ($overlap -lt $remaining.Count) {
    $normalized += $remaining[$overlap..($remaining.Count - 1)]
  }
  return $normalized
}

function Invoke-SuperpowersBashCompat {
  param(
    [string[]]$ForwardArgs
  )

  $BashPath = Get-SuperpowersBashPath
  $BashScript = Convert-SuperpowersPathToBash -Path (Join-Path $PSScriptRoot '..\bash\superpowers')
  $Output = & $BashPath $BashScript @ForwardArgs
  return @{
    Output = $Output
    ExitCode = $LASTEXITCODE
  }
}

$ForwardArgs = Normalize-SuperpowersCompatArgs -ForwardArgs $args
$Output = $null
$ExitCode = 0
$ErrorMessage = $null
$ForceBashCompat = $env:SUPERPOWERS_PWSH_FORCE_BASH_COMPAT -eq '1'

$RestoreNativeExitPreference = $false
$NativeExitPreference = $null
$NativeExitVariable = Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue
if ($NativeExitVariable) {
  $NativeExitPreference = $NativeExitVariable.Value
  $PSNativeCommandUseErrorActionPreference = $false
  $RestoreNativeExitPreference = $true
}

try {
  $Invoked = $false
  if (-not $ForceBashCompat) {
    try {
      $RuntimeRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
      $TargetKey = Get-SuperpowersHostTarget
      $Candidate = Resolve-SuperpowersRepoRuntimeBinary -RuntimeRoot $RuntimeRoot -TargetKey $TargetKey
      $Output = & $Candidate @ForwardArgs
      $ExitCode = $LASTEXITCODE
      $Invoked = $true
    }
    catch {
      $ErrorMessage = $_.Exception.Message
    }
  }

  if (-not $Invoked) {
    try {
      $BashCompat = Invoke-SuperpowersBashCompat -ForwardArgs $ForwardArgs
      $Output = $BashCompat.Output
      $ExitCode = [int]$BashCompat.ExitCode
      $ErrorMessage = $null
    }
    catch {
      if ($null -eq $ErrorMessage) {
        $ErrorMessage = $_.Exception.Message
      }
    }
  }
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
