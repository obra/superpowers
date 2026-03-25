function Get-FeatureForgeBashPath {
  if (-not [string]::IsNullOrWhiteSpace($env:FEATUREFORGE_BASH_PATH)) {
    return $env:FEATUREFORGE_BASH_PATH
  }

  foreach ($candidate in @("bash", "bash.exe")) {
    $command = Get-Command $candidate -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -ne $command) {
      return $command.Source
    }
  }

  $git = Get-Command git -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($null -ne $git) {
    $gitRoot = Split-Path (Split-Path $git.Source -Parent) -Parent
    $gitBash = Join-Path $gitRoot "bin/bash.exe"
    if (Test-Path $gitBash) {
      return (Resolve-Path $gitBash).Path
    }
  }

  throw "Could not find a compatible bash executable. Install Git Bash or set FEATUREFORGE_BASH_PATH."
}

function Convert-FeatureForgePathToBash {
  param([string]$Path)

  if ([string]::IsNullOrWhiteSpace($Path)) {
    return $Path
  }

  $normalized = $Path -replace "\\", "/"
  if ($normalized -match "^(?<drive>[A-Za-z]):/(?<rest>.*)$") {
    return "/$($Matches.drive.ToLower())/$($Matches.rest)"
  }

  return $normalized
}

function Convert-FeatureForgePathFromBash {
  param([string]$Path)

  if ([string]::IsNullOrWhiteSpace($Path)) {
    return $Path
  }

  if ($Path -match "^/(?<drive>[A-Za-z])/(?<rest>.*)$") {
    $rest = $Matches.rest.Replace("/", "\")
    return "$($Matches.drive.ToUpper()):\$rest"
  }

  return $Path
}

function Convert-FeatureForgeJsonFieldPathsToWindows {
  param(
    [string]$JsonText,
    [string[]]$Fields
  )

  try {
    $payload = $JsonText | ConvertFrom-Json -ErrorAction Stop
    foreach ($field in $Fields) {
      if ($payload.PSObject.Properties.Name -contains $field -and $null -ne $payload.$field) {
        $payload.$field = Convert-FeatureForgePathFromBash -Path ([string]$payload.$field)
      }
    }
    return ($payload | ConvertTo-Json -Compress)
  } catch {
    return $JsonText
  }
}
