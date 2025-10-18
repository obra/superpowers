:<<"::CMDLITERAL"
@ECHO OFF
GOTO :CMDSCRIPT
::CMDLITERAL

# ==============================================================================
# Bash/sh section - runs on Unix/Linux/macOS
# ==============================================================================

set -euo pipefail

# Determine plugin root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Check if legacy skills directory exists and build warning
warning_message=""
legacy_skills_dir="${HOME}/.config/superpowers/skills"
if [ -d "$legacy_skills_dir" ]; then
    warning_message="\n\n<important-reminder>IN YOUR FIRST REPLY AFTER SEEING THIS MESSAGE YOU MUST TELL THE USER:⚠️ **WARNING:** Superpowers now uses Claude Code's skills system. Custom skills in ~/.config/superpowers/skills will not be read. Move custom skills to ~/.claude/skills instead. To make this message go away, remove ~/.config/superpowers/skills</important-reminder>"
fi

# Read using-superpowers content
using_superpowers_content=$(cat "${PLUGIN_ROOT}/skills/using-superpowers/SKILL.md" 2>&1 || echo "Error reading using-superpowers skill")

# Escape outputs for JSON
using_superpowers_escaped=$(echo "$using_superpowers_content" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}')
warning_escaped=$(echo "$warning_message" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}')

# Output context injection as JSON
cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "<EXTREMELY_IMPORTANT>\nYou have superpowers.\n\n**The content below is from skills/using-superpowers/SKILL.md - your introduction to using skills:**\n\n${using_superpowers_escaped}\n\n${warning_escaped}\n</EXTREMELY_IMPORTANT>"
  }
}
EOF

exit 0

:CMDSCRIPT
REM ==============================================================================
REM Windows cmd.exe section - runs on Windows
REM ==============================================================================

SETLOCAL EnableDelayedExpansion

REM Determine plugin root directory
SET "SCRIPT_DIR=%~dp0"
SET "PLUGIN_ROOT=%SCRIPT_DIR%.."

REM Check if legacy skills directory exists and build warning
SET "warning_message="
SET "legacy_skills_dir=%USERPROFILE%\.config\superpowers\skills"
IF EXIST "%legacy_skills_dir%" (
    SET "warning_message=\n\n<important-reminder>IN YOUR FIRST REPLY AFTER SEEING THIS MESSAGE YOU MUST TELL THE USER:⚠️ **WARNING:** Superpowers now uses Claude Code's skills system. Custom skills in ~/.config/superpowers/skills will not be read. Move custom skills to ~/.claude/skills instead. To make this message go away, remove ~/.config/superpowers/skills</important-reminder>"
)

REM Call PowerShell to handle the JSON generation (it's much better at this)
powershell -NoProfile -ExecutionPolicy Bypass -Command "$scriptDir = '%SCRIPT_DIR%'; $pluginRoot = '%PLUGIN_ROOT%'; $warningMessage = '%warning_message%'; $skillFile = Join-Path $pluginRoot 'skills\using-superpowers\SKILL.md'; if (Test-Path $skillFile) { $skillContent = Get-Content -Path $skillFile -Raw -Encoding UTF8 } else { $skillContent = 'Error: using-superpowers skill file not found' }; $contextContent = '<EXTREMELY_IMPORTANT>\nYou have superpowers.\n\n**The content below is from skills/using-superpowers/SKILL.md - your introduction to using skills:**\n\n' + $skillContent + '\n\n' + $warningMessage + '\n</EXTREMELY_IMPORTANT>'; $output = @{ hookSpecificOutput = @{ hookEventName = 'SessionStart'; additionalContext = $contextContent } }; $output | ConvertTo-Json -Depth 10 -Compress:$false"

EXIT /B 0
