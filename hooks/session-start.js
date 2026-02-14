#!/usr/bin/env node
// SessionStart hook for superpowers plugin
// Node.js version — cross-platform without bash dependency.

'use strict';

const fs = require('fs');
const path = require('path');

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');
const skillPath = path.join(pluginRoot, 'skills', 'using-superpowers', 'SKILL.md');
const legacyDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.config', 'superpowers', 'skills');

let warningMessage = '';
try {
  if (fs.statSync(legacyDir).isDirectory()) {
    warningMessage = '\n\n<important-reminder>IN YOUR FIRST REPLY AFTER SEEING THIS MESSAGE YOU MUST TELL THE USER:\u26a0\ufe0f **WARNING:** Superpowers now uses Claude Code\'s skills system. Custom skills in ~/.config/superpowers/skills will not be read. Move custom skills to ~/.claude/skills instead. To make this message go away, remove ~/.config/superpowers/skills</important-reminder>';
  }
} catch (_) { /* doesn't exist */ }

let skillContent;
try {
  skillContent = fs.readFileSync(skillPath, 'utf8');
} catch (e) {
  skillContent = 'Error reading using-superpowers skill: ' + e.message;
}

const output = {
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: '<EXTREMELY_IMPORTANT>\nYou have superpowers.\n\n**Below is the full content of your \'superpowers:using-superpowers\' skill - your introduction to using skills. For all other skills, use the \'Skill\' tool:**\n\n' + skillContent + '\n\n' + warningMessage + '\n</EXTREMELY_IMPORTANT>'
  }
};

process.stdout.write(JSON.stringify(output));
