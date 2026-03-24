$ErrorActionPreference = 'Stop'

function Get-SuperpowersGitBashCandidates {
  param(
    [string]$GitSource
  )

  if ([string]::IsNullOrWhiteSpace($GitSource)) {
    return @()
  }

  $roots = @()
  $current = Split-Path -Parent $GitSource
  for ($i = 0; $i -lt 3 -and -not [string]::IsNullOrWhiteSpace($current); $i++) {
    if ($roots -notcontains $current) {
      $roots += $current
    }

    $next = Split-Path -Parent $current
    if ($next -eq $current) {
      break
    }
    $current = $next
  }

  $results = @()
  foreach ($root in $roots) {
    foreach ($relative in @('bash.exe', 'bin\bash.exe', 'usr\bin\bash.exe')) {
      $candidate = Join-Path $root $relative
      if (Test-Path -LiteralPath $candidate) {
        $resolved = (Resolve-Path -LiteralPath $candidate).Path
        if ($results -notcontains $resolved) {
          $results += $resolved
        }
      }
    }
  }

  return $results
}

function Get-SuperpowersBashPath {
  if (-not [string]::IsNullOrWhiteSpace($env:SUPERPOWERS_BASH_PATH)) {
    return $env:SUPERPOWERS_BASH_PATH
  }

  $git = Get-Command git -ErrorAction SilentlyContinue
  if ($git -and $git.Source) {
    foreach ($candidate in Get-SuperpowersGitBashCandidates -GitSource $git.Source) {
      return $candidate
    }
  }

  $standardCandidates = @()
  foreach ($base in @(${env:ProgramFiles}, ${env:ProgramW6432}, ${env:ProgramFiles(x86)})) {
    if ([string]::IsNullOrWhiteSpace($base)) {
      continue
    }
    $standardCandidates += (Join-Path $base 'Git\bin\bash.exe')
    $standardCandidates += (Join-Path $base 'Git\usr\bin\bash.exe')
  }

  foreach ($candidate in $standardCandidates) {
    if (Test-Path -LiteralPath $candidate) {
      return (Resolve-Path -LiteralPath $candidate).Path
    }
  }

  $bash = Get-Command bash -ErrorAction SilentlyContinue
  if ($bash -and $bash.Source) {
    return $bash.Source
  }

  throw 'Could not find a compatible bash executable. Install Git for Windows, add bash to PATH, or set SUPERPOWERS_BASH_PATH.'
}

function Resolve-SuperpowersFilesystemPath {
  param(
    [string]$Path
  )

  if ([string]::IsNullOrWhiteSpace($Path)) {
    return $Path
  }

  if ($Path -match '^[A-Za-z]:[\\/]' -or
      $Path -match '^[\\/]{2}[^\\/]+[\\/]+[^\\/]+' -or
      $Path -match '^/[A-Za-z]/' -or
      $Path -match '^/[A-Za-z]$' -or
      $Path -match '^//[^/]+/[^/]+') {
    return $Path
  }

  try {
    if ([System.IO.Path]::IsPathRooted($Path)) {
      return [System.IO.Path]::GetFullPath($Path)
    }
    return [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $Path))
  } catch {
    return $Path
  }
}

function Convert-SuperpowersPathToBash {
  param(
    [string]$Path
  )

  if ([string]::IsNullOrWhiteSpace($Path)) {
    return $Path
  }

  $resolved = Resolve-SuperpowersFilesystemPath -Path $Path
  if ($resolved -match '^/[A-Za-z]/' -or
      $resolved -match '^/[A-Za-z]$' -or
      $resolved -match '^//[^/]+/[^/]+') {
    return $resolved
  }

  if ($resolved -match '^([A-Za-z]):[\\/]*(.*)$') {
    $drive = $matches[1].ToLowerInvariant()
    $rest = ($matches[2] -replace '\\', '/').TrimStart('/')
    if ([string]::IsNullOrEmpty($rest)) {
      return "/$drive/"
    }
    return "/$drive/$rest"
  }

  if ($resolved -match '^[\\/]{2}([^\\/]+)[\\/]+([^\\/]+)(.*)$') {
    $server = $matches[1]
    $share = $matches[2]
    $rest = ($matches[3] -replace '\\', '/').TrimStart('/')
    if ([string]::IsNullOrEmpty($rest)) {
      return "//$server/$share"
    }
    return "//$server/$share/$rest"
  }

  return ($resolved -replace '\\', '/')
}

function Convert-SuperpowersPathFromBash {
  param(
    [string]$Path
  )

  if ([string]::IsNullOrWhiteSpace($Path)) {
    return $Path
  }

  if ($Path -match '^/([A-Za-z])/(.*)$') {
    $drive = $matches[1].ToUpperInvariant()
    $rest = $matches[2] -replace '/', '\'
    if ([string]::IsNullOrEmpty($rest)) {
      return ('{0}:\' -f $drive)
    }
    return ('{0}:\{1}' -f $drive, $rest)
  }

  if ($Path -match '^/([A-Za-z])$') {
    return ('{0}:\' -f $matches[1].ToUpperInvariant())
  }

  if ($Path -match '^//([^/]+)/([^/]+)/(.*)$') {
    $tail = $matches[3] -replace '/', '\'
    return ('\\{0}\{1}\{2}' -f $matches[1], $matches[2], $tail)
  }

  if ($Path -match '^//([^/]+)/([^/]+)$') {
    return ('\\{0}\{1}' -f $matches[1], $matches[2])
  }

  return $Path
}

function Convert-SuperpowersJsonFieldPathsToWindows {
  param(
    [string]$JsonText,
    [string[]]$Fields
  )

  if ([string]::IsNullOrWhiteSpace($JsonText)) {
    return $JsonText
  }

  try {
    $payload = $JsonText | ConvertFrom-Json
  } catch {
    return $JsonText
  }

  foreach ($field in $Fields) {
    $property = $payload.PSObject.Properties[$field]
    if ($property -and $property.Value -is [string]) {
      $payload.$field = Convert-SuperpowersPathFromBash -Path $property.Value
    }
  }

  return ($payload | ConvertTo-Json -Compress)
}

function Normalize-SuperpowersRepoRelativePath {
  param(
    [string]$Path
  )

  if ([string]::IsNullOrEmpty($Path)) {
    return $null
  }

  if ($Path -match '^[A-Za-z]:[\\/]' -or
      $Path -match '^[\\/]' -or
      $Path -match '^//') {
    return $null
  }

  $normalized = $Path -replace '\\', '/'
  $parts = New-Object System.Collections.Generic.List[string]

  foreach ($part in ($normalized -split '/')) {
    if ([string]::IsNullOrEmpty($part) -or $part -eq '.') {
      continue
    }
    if ($part -eq '..') {
      return $null
    }
    $parts.Add($part)
  }

  if ($parts.Count -eq 0) {
    return $null
  }

  return ($parts -join '/')
}

function Normalize-SuperpowersWhitespace {
  param(
    [string]$Text
  )

  if ($null -eq $Text) {
    return ''
  }

  return (($Text -replace "[`r`n`t]", ' ' -replace '\s+', ' ').Trim())
}

function Normalize-SuperpowersWhitespaceBounded {
  param(
    [string]$Text,
    [int]$MaxLength = 0
  )

  $normalized = Normalize-SuperpowersWhitespace -Text $Text
  if ([string]::IsNullOrEmpty($normalized)) {
    return [pscustomobject]@{
      Success = $false
      Failure = 'empty'
      Value = $null
    }
  }

  if ($MaxLength -gt 0 -and $normalized.Length -gt $MaxLength) {
    return [pscustomobject]@{
      Success = $false
      Failure = 'overlong'
      Value = $normalized
    }
  }

  return [pscustomobject]@{
    Success = $true
    Failure = ''
    Value = $normalized
  }
}

function Normalize-SuperpowersIdentifierToken {
  param(
    [string]$Text
  )

  if ($null -eq $Text) {
    return ''
  }

  return ($Text -replace '[^0-9A-Za-z._-]', '-')
}

function Get-SuperpowersHostTarget {
  $architecture = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture

  if ($IsMacOS -and $architecture -eq [System.Runtime.InteropServices.Architecture]::Arm64) {
    return 'darwin-arm64'
  }
  if ($IsWindows -and $architecture -eq [System.Runtime.InteropServices.Architecture]::X64) {
    return 'windows-x64'
  }

  throw 'No checked-in runtime is available for this host; the first Rust cutover supports only darwin-arm64 and windows-x64.'
}

function Get-SuperpowersManifestSha256 {
  param(
    [string]$ChecksumPath
  )

  if (-not (Test-Path -LiteralPath $ChecksumPath -PathType Leaf)) {
    throw "Checked-in Superpowers checksum file not found at manifest-selected path $ChecksumPath."
  }

  $checksum = (Get-Content -LiteralPath $ChecksumPath -Raw).Split([char[]]" `t`r`n", [System.StringSplitOptions]::RemoveEmptyEntries) | Select-Object -First 1
  if ([string]::IsNullOrWhiteSpace($checksum) -or $checksum -notmatch '^[0-9A-Fa-f]{64}$') {
    throw "Checked-in checksum file $ChecksumPath does not contain a valid sha256 digest."
  }

  return $checksum.ToLowerInvariant()
}

function Resolve-SuperpowersRepoRuntimeBinary {
  param(
    [string]$RuntimeRoot,
    [string]$TargetKey
  )

  $manifestPath = Join-Path $RuntimeRoot 'bin/prebuilt/manifest.json'
  if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
    throw "Missing checked-in prebuilt manifest $manifestPath."
  }

  $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
  $targetEntry = $manifest.targets.PSObject.Properties[$TargetKey]
  if (-not $targetEntry) {
    throw "Checked-in prebuilt manifest $manifestPath does not define a runtime for host target $TargetKey."
  }

  $binaryRel = Normalize-SuperpowersRepoRelativePath -Path $targetEntry.Value.binary_path
  if ([string]::IsNullOrWhiteSpace($binaryRel)) {
    throw 'Manifest binary path is invalid.'
  }
  $checksumRel = Normalize-SuperpowersRepoRelativePath -Path $targetEntry.Value.checksum_path
  if ([string]::IsNullOrWhiteSpace($checksumRel)) {
    throw 'Manifest checksum path is invalid.'
  }

  $binaryPath = Join-Path $RuntimeRoot ($binaryRel -replace '/', [IO.Path]::DirectorySeparatorChar)
  if (-not (Test-Path -LiteralPath $binaryPath -PathType Leaf)) {
    throw "Checked-in Superpowers runtime binary not found at manifest-selected path $binaryPath."
  }
  $checksumPath = Join-Path $RuntimeRoot ($checksumRel -replace '/', [IO.Path]::DirectorySeparatorChar)

  $expected = Get-SuperpowersManifestSha256 -ChecksumPath $checksumPath
  $actual = (Get-FileHash -LiteralPath $binaryPath -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actual -ne $expected) {
    throw "Checked-in runtime checksum mismatch for ${binaryPath}: expected $expected, got $actual."
  }

  return $binaryPath
}
