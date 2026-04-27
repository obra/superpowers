#!/usr/bin/env node
// sspower diet — SessionStart activation hook
//
// Runs on every session start:
//   1. Writes flag file at $CLAUDE_CONFIG_DIR/.sspower-diet (for tracker/statusline)
//   2. Emits diet ruleset as hidden SessionStart context, filtered to active level
//
// Adapted from caveman/hooks/caveman-activate.js (MIT, Julius Brussee).

const fs = require('fs');
const path = require('path');
const os = require('os');
const { getDefaultMode, safeWriteFlag } = require('./_diet-config');

const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const flagPath = path.join(claudeDir, '.sspower-diet');

const mode = getDefaultMode();

if (mode === 'off') {
  try { fs.unlinkSync(flagPath); } catch (e) {}
  process.exit(0);
}

safeWriteFlag(flagPath, mode);

// Read SKILL.md — single source of truth for diet behavior.
// Plugin layout: __dirname = <plugin_root>/hooks/, SKILL.md at <plugin_root>/skills/diet/SKILL.md
let skillContent = '';
try {
  skillContent = fs.readFileSync(
    path.join(__dirname, '..', 'skills', 'diet', 'SKILL.md'), 'utf8'
  );
} catch (e) { /* fallback below */ }

let output;

if (skillContent) {
  const body = skillContent.replace(/^---[\s\S]*?---\s*/, '');

  // Filter intensity table + examples to just the active level
  const filtered = body.split('\n').reduce((acc, line) => {
    const tableRowMatch = line.match(/^\|\s*\*\*(\S+?)\*\*\s*\|/);
    if (tableRowMatch) {
      if (tableRowMatch[1] === mode) acc.push(line);
      return acc;
    }

    const exampleMatch = line.match(/^- (\S+?):\s/);
    if (exampleMatch) {
      if (exampleMatch[1] === mode) acc.push(line);
      return acc;
    }

    acc.push(line);
    return acc;
  }, []);

  output = 'DIET MODE ACTIVE — level: ' + mode + '\n\n' + filtered.join('\n');
} else {
  output =
    'DIET MODE ACTIVE — level: ' + mode + '\n\n' +
    'Respond terse. All technical substance stay. Only fluff die.\n\n' +
    '## Persistence\n\n' +
    'ACTIVE EVERY RESPONSE. Off only: "stop diet" / "normal mode".\n\n' +
    'Current level: **' + mode + '**. Switch: `/diet lite|full|ultra|off`.\n\n' +
    '## Rules\n\n' +
    'Drop articles, filler, pleasantries, hedging. Fragments OK. Short synonyms. ' +
    'Technical terms exact. Code blocks unchanged. Errors quoted exact.\n\n' +
    '## Boundaries\n\n' +
    'Code/commits/PRs: write normal. Security warnings, destructive confirmations: write clearly.';
}

process.stdout.write(output);
