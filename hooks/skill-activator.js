#!/usr/bin/env node
/**
 * UserPromptSubmit Hook — Proactive Skill Activation
 *
 * Analyzes the user's prompt before Claude processes it and injects
 * context about which superpowers-optimized skills are relevant.
 * This reinforces the using-superpowers routing system deterministically.
 *
 * Input:  stdin JSON with { prompt, session_id, cwd, ... }
 * Output: stdout JSON with additionalContext suggesting relevant skills
 */

const fs = require('fs');
const path = require('path');

// Resolve hooks directory from this script's location
const HOOKS_DIR = __dirname;

// Load skill rules
let RULES = [];
try {
  const rulesPath = path.join(HOOKS_DIR, 'skill-rules.json');
  RULES = JSON.parse(fs.readFileSync(rulesPath, 'utf8')).rules || [];
} catch (e) {
  // If rules can't be loaded, hook is a no-op
  process.stdout.write('{}');
  process.exit(0);
}

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

/**
 * Score a prompt against skill rules.
 * Returns matched rules sorted by priority, max 3.
 */
function matchSkills(prompt) {
  if (!prompt || typeof prompt !== 'string') return [];

  const lower = prompt.toLowerCase();
  const matches = [];

  for (const rule of RULES) {
    let score = 0;

    // Check keywords (case-insensitive substring)
    for (const kw of rule.keywords || []) {
      if (lower.includes(kw.toLowerCase())) {
        score += 1;
      }
    }

    // Check intent patterns (regex)
    for (const pattern of rule.intentPatterns || []) {
      try {
        const re = new RegExp(pattern, 'i');
        if (re.test(prompt)) {
          score += 2; // Intent patterns weighted higher
        }
      } catch {
        // Skip invalid regex
      }
    }

    if (score > 0) {
      matches.push({
        skill: rule.skill,
        priority: rule.priority,
        type: rule.type,
        score,
      });
    }
  }

  // Sort by priority (critical first), then by score (highest first)
  matches.sort((a, b) => {
    const pDiff = (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99);
    if (pDiff !== 0) return pDiff;
    return b.score - a.score;
  });

  return matches.slice(0, 3);
}

/**
 * Build the context injection message for matched skills.
 */
function buildContext(matches) {
  if (matches.length === 0) return null;

  const skillList = matches
    .map(m => `  - superpowers-optimized:${m.skill} (${m.priority})`)
    .join('\n');

  return [
    '<user-prompt-submit-hook>',
    'Skill activation hint: The following skills are relevant to this prompt.',
    'Remember: invoke superpowers-optimized:using-superpowers FIRST as the mandatory entry point,',
    'then follow its routing to these suggested skills:',
    skillList,
    '</user-prompt-submit-hook>',
  ].join('\n');
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  try {
    const data = JSON.parse(input);
    const prompt = data.prompt || '';

    const matches = matchSkills(prompt);

    if (matches.length === 0) {
      process.stdout.write('{}');
      return;
    }

    const context = buildContext(matches);

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext: context,
      },
    }));
  } catch {
    process.stdout.write('{}');
  }
}

if (require.main === module) {
  main();
} else {
  module.exports = { matchSkills, buildContext, RULES };
}
