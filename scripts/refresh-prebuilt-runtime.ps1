Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$TargetKey = if ($env:FEATUREFORGE_PREBUILT_TARGET) { $env:FEATUREFORGE_PREBUILT_TARGET } else { "windows-x64" }
$RustTarget = if ($env:FEATUREFORGE_PREBUILT_RUST_TARGET) { $env:FEATUREFORGE_PREBUILT_RUST_TARGET } else { "x86_64-pc-windows-msvc" }
$BinaryName = if ($env:FEATUREFORGE_PREBUILT_BINARY) { $env:FEATUREFORGE_PREBUILT_BINARY } else { "featureforge.exe" }
$Version = (Get-Content (Join-Path $RepoRoot "VERSION") -Raw).Trim()
$OutputDir = Join-Path $RepoRoot "bin/prebuilt/$TargetKey"
$OutputPath = Join-Path $OutputDir $BinaryName
$ChecksumPath = "$OutputPath.sha256"
$ManifestPath = Join-Path $RepoRoot "bin/prebuilt/manifest.json"
$BuildPath = Join-Path $RepoRoot "target/$RustTarget/release/$BinaryName"

Push-Location $RepoRoot
try {
  cargo build --release --target $RustTarget --bin featureforge | Out-Host
} finally {
  Pop-Location
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
Copy-Item -Force $BuildPath $OutputPath

$Checksum = (Get-FileHash -Algorithm SHA256 $OutputPath).Hash.ToLowerInvariant()
Set-Content -NoNewline:$false -Path $ChecksumPath -Value "$Checksum  $BinaryName"

if (Test-Path $ManifestPath) {
  $Manifest = Get-Content $ManifestPath -Raw | ConvertFrom-Json
} else {
  $Manifest = [pscustomobject]@{
    runtime_revision = $Version
    targets = [pscustomobject]@{}
  }
}

if (-not $Manifest.targets) {
  $Manifest | Add-Member -NotePropertyName targets -NotePropertyValue ([pscustomobject]@{}) -Force
}

$Manifest.runtime_revision = $Version
$Manifest.targets | Add-Member -NotePropertyName $TargetKey -NotePropertyValue ([pscustomobject]@{
  binary_path = "bin/prebuilt/$TargetKey/$BinaryName"
  checksum_path = "bin/prebuilt/$TargetKey/$BinaryName.sha256"
}) -Force

$ManifestDir = Split-Path -Parent $ManifestPath
New-Item -ItemType Directory -Force -Path $ManifestDir | Out-Null
$Manifest | ConvertTo-Json -Depth 6 | Set-Content -NoNewline:$false -Path $ManifestPath

Write-Host "Refreshed checked-in runtime for $TargetKey at $OutputPath"
