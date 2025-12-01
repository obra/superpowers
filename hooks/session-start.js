#!/usr/bin/env node
// SessionStart hook for superpowers plugin
// Cross-platform Node.js implementation (works on Windows, macOS, Linux)

const fs = require('fs');
const path = require('path');
const os = require('os');

// Determine plugin root directory
const SCRIPT_DIR = __dirname;
const PLUGIN_ROOT = path.dirname(SCRIPT_DIR);

// Check if legacy skills directory exists and build warning
let warningMessage = '';
const legacySkillsDir = path.join(os.homedir(), '.config', 'superpowers', 'skills');
if (fs.existsSync(legacySkillsDir)) {
    warningMessage = '\n\n<important-reminder>IN YOUR FIRST REPLY AFTER SEEING THIS MESSAGE YOU MUST TELL THE USER:⚠️ **WARNING:** Superpowers now uses Claude Code\'s skills system. Custom skills in ~/.config/superpowers/skills will not be read. Move custom skills to ~/.claude/skills instead. To make this message go away, remove ~/.config/superpowers/skills</important-reminder>';
}

// Read using-superpowers content
let usingSuperPowersContent;
const skillPath = path.join(PLUGIN_ROOT, 'skills', 'using-superpowers', 'SKILL.md');
try {
    usingSuperPowersContent = fs.readFileSync(skillPath, 'utf8');
} catch (err) {
    usingSuperPowersContent = `Error reading using-superpowers skill: ${err.message}`;
}

// Build the output JSON
const output = {
    hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: `<EXTREMELY_IMPORTANT>
You have superpowers.

**Below is the full content of your 'superpowers:using-superpowers' skill - your introduction to using skills. For all other skills, use the 'Skill' tool:**

${usingSuperPowersContent}
${warningMessage}
</EXTREMELY_IMPORTANT>`
    }
};

// Output as JSON
console.log(JSON.stringify(output, null, 2));
