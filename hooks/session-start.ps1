# SessionStart hook for superpowers plugin (Windows PowerShell version)

# Determine plugin root directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pluginRoot = Split-Path -Parent $scriptDir

# Check if legacy skills directory exists and build warning
$warningMessage = ""
$legacySkillsDir = Join-Path $env:USERPROFILE ".config\superpowers\skills"
if (Test-Path $legacySkillsDir) {
    $warningMessage = "`n`n⚠️ **WARNING:** Superpowers now uses Claude Code's skills system. Custom skills in ~/.config/superpowers/skills will not be read."
}

# Read using-superpowers content
$skillFile = Join-Path $pluginRoot "skills\using-superpowers\SKILL.md"
if (-not (Test-Path $skillFile)) {
    $output = @{
        hookSpecificOutput = @{
            hookEventName = "SessionStart"
            additionalContext = "Error reading using-superpowers skill"
        }
    }
    $output | ConvertTo-Json -Compress
    exit 1
}

$usingSuperpowersContent = Get-Content $skillFile -Raw

# Build the additional context
$additionalContext = @"
<EXTREMELY_IMPORTANT>
You have superpowers.

**The content below is from skills/using-superpowers/SKILL.md - your introduction to using skills:**

$usingSuperpowersContent

$warningMessage
</EXTREMELY_IMPORTANT>
"@

# Output context injection as JSON
$output = @{
    hookSpecificOutput = @{
        hookEventName = "SessionStart"
        additionalContext = $additionalContext
    }
}

$output | ConvertTo-Json -Depth 10
exit 0
