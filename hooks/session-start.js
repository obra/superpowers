#!/usr/bin/env node
/**
 * SessionStart hook for superpowers plugin
 *
 * Cross-platform wrapper (Windows, macOS, Linux) that handles:
 * - Windows path backslash issues when CLAUDE_PLUGIN_ROOT is passed to bash
 * - Git Bash shebang stdout suppression issue on Windows
 *
 * See: https://github.com/obra/superpowers/issues/354
 */

const fs = require('fs');
const path = require('path');

// Determine plugin root from this script's location
const SCRIPT_DIR = __dirname;
const PLUGIN_ROOT = path.dirname(SCRIPT_DIR);

// Check if legacy skills directory exists
let warningMessage = '';
const legacySkillsDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.config', 'superpowers', 'skills');
if (fs.existsSync(legacySkillsDir)) {
    warningMessage = '\n\n<important-reminder>IN YOUR FIRST REPLY AFTER SEEING THIS MESSAGE YOU MUST TELL THE USER:⚠️ **WARNING:** Superpowers now uses Claude Code\'s skills system. Custom skills in ~/.config/superpowers/skills will not be read. Move custom skills to ~/.claude/skills instead. To make this message go away, remove ~/.config/superpowers/skills</important-reminder>';
}

// Read using-superpowers skill content
const skillPath = path.join(PLUGIN_ROOT, 'skills', 'using-superpowers', 'SKILL.md');
let usingSuperpowersContent = '';
try {
    usingSuperpowersContent = fs.readFileSync(skillPath, 'utf8');
} catch (err) {
    usingSuperpowersContent = 'Error reading using-superpowers skill: ' + err.message;
}

// Output JSON for Claude Code hook system
const output = {
    hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: `<EXTREMELY_IMPORTANT>
You have superpowers.

**Below is the full content of your 'superpowers:using-superpowers' skill - your introduction to using skills. For all other skills, use the 'Skill' tool:**

${usingSuperpowersContent}
${warningMessage}
</EXTREMELY_IMPORTANT>`
    }
};

console.log(JSON.stringify(output, null, 2));
