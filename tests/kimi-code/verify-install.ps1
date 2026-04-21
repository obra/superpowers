# Verify Superpowers Kimi Code installation
# Run this in your project directory after installing Superpowers

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

# 1. Global skills symlink
$skillsDir = "$env:USERPROFILE\.kimi\skills"
Test-PathOrFail -Path $skillsDir -Description "Global skills directory"

# 2. Project bootstrap
Test-PathOrFail -Path ".kimi\AGENTS.md" -Description "Project bootstrap (.kimi/AGENTS.md)"

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

# 4. Bootstrap content check
$bootstrap = Get-Content ".kimi\AGENTS.md" -Raw
if ($bootstrap -notmatch "You have superpowers") {
    Write-Error "FAIL: Bootstrap missing 'You have superpowers' preamble"
    $errors++
} else {
    Write-Host "PASS: Bootstrap contains superpowers preamble"
}

if ($bootstrap -notmatch "ReadFile") {
    Write-Error "FAIL: Bootstrap missing Kimi tool mapping"
    $errors++
} else {
    Write-Host "PASS: Bootstrap contains tool mapping"
}

Write-Host "`n===================================="
if ($errors -eq 0) {
    Write-Host "All checks passed! Restart Kimi Code and try: /skill:using-superpowers"
    exit 0
} else {
    Write-Host "$errors check(s) failed. See errors above."
    exit 1
}
