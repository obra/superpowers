# Initialize or update superpowers skills repository (Windows PowerShell version)

$skillsDir = Join-Path $env:USERPROFILE ".config\superpowers\skills"
$skillsRepo = "https://github.com/obra/superpowers-skills.git"

# Check if skills directory exists and is a valid git repo
if (Test-Path (Join-Path $skillsDir ".git")) {
    Set-Location $skillsDir

    # Get the remote name for the current tracking branch
    $trackingFull = git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>$null
    $trackingRemote = ""
    if ($trackingFull) {
        $trackingRemote = ($trackingFull -split '/')[0]
    }

    # Fetch from tracking remote if set, otherwise try upstream then origin
    if ($trackingRemote) {
        git fetch $trackingRemote 2>$null | Out-Null
    } else {
        git fetch upstream 2>$null | Out-Null
        if ($LASTEXITCODE -ne 0) {
            git fetch origin 2>$null | Out-Null
        }
    }

    # Check if we can fast-forward
    $local = git rev-parse '@' 2>$null
    $remote = git rev-parse '@{u}' 2>$null
    $base = git merge-base '@' '@{u}' 2>$null

    # Try to fast-forward merge first
    if ($local -and $remote -and ($local -ne $remote)) {
        # Check if we can fast-forward (local is ancestor of remote)
        if ($local -eq $base) {
            # Fast-forward merge is possible - local is behind
            Write-Host "Updating skills to latest version..."
            $mergeOutput = git merge --ff-only '@{u}' 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ Skills updated successfully"
                Write-Host "SKILLS_UPDATED=true"
            } else {
                Write-Host "Failed to update skills"
            }
        } elseif ($remote -ne $base) {
            # Remote has changes (local is behind or diverged)
            Write-Host "SKILLS_BEHIND=true"
        }
        # If REMOTE = BASE, local is ahead - no action needed
    }

    exit 0
}

# Skills directory doesn't exist or isn't a git repo - initialize it
Write-Host "Initializing skills repository..."

# Handle migration from old installation
$oldGitDir = Join-Path $env:USERPROFILE ".config\superpowers\.git"
if (Test-Path $oldGitDir) {
    Write-Host "Found existing installation. Backing up..."
    Move-Item $oldGitDir "$oldGitDir.bak" -Force -ErrorAction SilentlyContinue

    $oldSkillsDir = Join-Path $env:USERPROFILE ".config\superpowers\skills"
    if (Test-Path $oldSkillsDir) {
        Move-Item $oldSkillsDir "$oldSkillsDir.bak" -Force -ErrorAction SilentlyContinue
        Write-Host "Your old skills are in $env:USERPROFILE\.config\superpowers\skills.bak"
    }
}

# Clone the skills repository
$configDir = Join-Path $env:USERPROFILE ".config\superpowers"
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

git clone $skillsRepo $skillsDir

Set-Location $skillsDir

# Check if gh CLI is installed
$ghExists = Get-Command gh -ErrorAction SilentlyContinue
if ($ghExists) {
    Write-Host ""
    Write-Host "GitHub CLI detected. Would you like to fork superpowers-skills?"
    Write-Host "Forking allows you to share skill improvements with the community."
    Write-Host ""
    $reply = Read-Host "Fork superpowers-skills? (y/N)"

    if ($reply -match '^[Yy]$') {
        gh repo fork obra/superpowers-skills --remote=true
        Write-Host "Forked! You can now contribute skills back to the community."
    } else {
        git remote add upstream $skillsRepo
    }
} else {
    # No gh, just set up upstream remote
    git remote add upstream $skillsRepo
}

Write-Host "Skills repository initialized at $skillsDir"
exit 0
