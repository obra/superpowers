# Resolve repository root
$repoRoot = (Get-Item "$PSScriptRoot\..").FullName
$pluginsDir = "$HOME\.gemini\config\plugins\superpowers"

if (Test-Path $pluginsDir) {
    Write-Host "Removing existing superpowers plugin directory at $pluginsDir..."
    Remove-Item -Recurse -Force $pluginsDir
}

Write-Host "Creating superpowers plugin directory at $pluginsDir..."
New-Item -ItemType Directory -Path $pluginsDir -Force | Out-Null

# Helper to link or copy
function Link-Or-Copy {
    param(
        [string]$Src,
        [string]$Dest,
        [switch]$IsDirectory
    )
    try {
        # Attempt symbolic link
        New-Item -ItemType SymbolicLink -Path $Dest -Target $Src -Force -ErrorAction Stop | Out-Null
        Write-Host "Created symbolic link: $Dest -> $Src"
    } catch {
        # Fallback to copy
        Write-Warning "Symbolic link creation failed (Developer Mode might be disabled). Copying instead..."
        if ($IsDirectory) {
            Copy-Item -Path $Src -Destination $Dest -Recurse -Force | Out-Null
        } else {
            Copy-Item -Path $Src -Destination $Dest -Force | Out-Null
        }
        Write-Host "Copied: $Dest"
    }
}

Link-Or-Copy -Src "$repoRoot\.antigravity-plugin\plugin.json" -Dest "$pluginsDir\plugin.json"
Link-Or-Copy -Src "$repoRoot\.antigravity-plugin\ANTIGRAVITY.md" -Dest "$pluginsDir\ANTIGRAVITY.md"
Link-Or-Copy -Src "$repoRoot\skills" -Dest "$pluginsDir\skills" -IsDirectory

Write-Host "Superpowers plugin installed successfully for Antigravity!"
