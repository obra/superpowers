# Verify Superpowers Kimi Code installation (no-symlink version)
# Checks skills in ~/.config/agents/skills/ and SessionStart hook in config.toml.

$errors = 0

function Test-PathOrFail {
    param($Path, $Description)
    if (-not (Test-Path $Path)) {
        Write-Error "FAIL: $Description not found at $Path"
        $script:errors++
    } else {
        Write-Host "PASS: $Description"
    }
}

Write-Host "=== Superpowers Kimi Code Installation Verification ===`n"

$skillsDir = "$env:USERPROFILE\.config\agents\skills"
$configFile = "$env:USERPROFILE\.kimi\config.toml"

# 1. Skills directory exists
Test-PathOrFail -Path $skillsDir -Description "Global skills directory (~/.config/agents/skills)"

# 2. SessionStart hook configured
if (Test-Path $configFile) {
    $configContent = Get-Content $configFile -Raw
    if ($configContent -match 'event\s*=\s*"SessionStart"') {
        Write-Host "PASS: SessionStart hook configured in ~/.kimi/config.toml"
    } else {
        Write-Error "FAIL: SessionStart hook not found in ~/.kimi/config.toml"
        $errors++
    }
} else {
    Write-Error "FAIL: ~/.kimi/config.toml not found"
    $errors++
}

# 3. Core skills present
$requiredSkills = @(
    "using-superpowers",
    "brainstorming",
    "test-driven-development",
    "writing-plans",
    "subagent-driven-development",
    "systematic-debugging",
    "using-git-worktrees",
    "finishing-a-development-branch",
    "requesting-code-review",
    "receiving-code-review"
)

foreach ($skill in $requiredSkills) {
    Test-PathOrFail -Path "$skillsDir\$skill\SKILL.md" -Description "Skill: $skill"
}

# 4. merge_all_available_skills enabled
if ($configContent -match "(?m)^merge_all_available_skills\s*=\s*true") {
    Write-Host "PASS: merge_all_available_skills enabled"
} else {
    Write-Error "FAIL: merge_all_available_skills not enabled in ~/.kimi/config.toml"
    $errors++
}

# 5. Project bootstrap (optional, warn only)
if (Test-Path ".kimi\AGENTS.md") {
    Write-Host "INFO: Project-level bootstrap found (.kimi/AGENTS.md) — optional"
} else {
    Write-Host "INFO: No project-level bootstrap (.kimi/AGENTS.md) — global hook handles this"
}

Write-Host "`n===================================="
if ($errors -eq 0) {
    Write-Host "All checks passed! Restart Kimi Code and try: /skill:using-superpowers"
    exit 0
} else {
    Write-Host "$errors check(s) failed. See errors above."
    exit 1
}
