#!/usr/bin/env node
/**
 * PostToolUse Hook — Session Statistics Tracker
 *
 * Tracks skill invocations and tool usage during a session to provide
 * visibility into how the plugin is helping. Logs to a session stats file
 * that can be read by the stop-reminders hook or on user request.
 *
 * Triggered on: Skill tool use (PostToolUse matcher: Skill)
 *
 * Input:  stdin JSON with { tool_name, tool_input, session_id, cwd, ... }
 * Output: stdout JSON (always {}, never blocks)
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || '.',
  '.claude',
  'hooks-logs'
);

const STATS_FILE = path.join(LOG_DIR, 'session-stats.json');

/**
 * Load current session stats or initialize empty.
 */
function loadStats() {
  try {
    if (fs.existsSync(STATS_FILE)) {
      const raw = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
      // Auto-expire after 2 hours (new session)
      if (raw.startedAt && (Date.now() - new Date(raw.startedAt).getTime()) > 2 * 60 * 60 * 1000) {
        return createFreshStats();
      }
      return raw;
    }
  } catch {
    // Corrupted file — start fresh
  }
  return createFreshStats();
}

function createFreshStats() {
  return {
    startedAt: new Date().toISOString(),
    skillInvocations: {},
    totalSkillCalls: 0,
    hookBlocks: 0,
    filesEdited: 0,
    verificationsRun: 0,
  };
}

function saveStats(stats) {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
  } catch {
    // Silently ignore
  }
}

/**
 * Format stats into a human-readable summary.
 */
function formatSummary(stats) {
  const duration = Math.round((Date.now() - new Date(stats.startedAt).getTime()) / 60000);
  const lines = [
    `Session duration: ${duration} minutes`,
    `Skills invoked: ${stats.totalSkillCalls}`,
  ];

  const sorted = Object.entries(stats.skillInvocations)
    .sort((a, b) => b[1] - a[1]);

  if (sorted.length > 0) {
    lines.push('Skill breakdown:');
    for (const [skill, count] of sorted) {
      lines.push(`  ${skill}: ${count}x`);
    }
  }

  if (stats.hookBlocks > 0) {
    lines.push(`Dangerous operations blocked: ${stats.hookBlocks}`);
  }

  if (stats.filesEdited > 0) {
    lines.push(`Files edited: ${stats.filesEdited}`);
  }

  if (stats.verificationsRun > 0) {
    lines.push(`Verifications run: ${stats.verificationsRun}`);
  }

  return lines.join('\n');
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  try {
    const data = JSON.parse(input);
    const { tool_name, tool_input } = data;

    if (tool_name !== 'Skill') {
      process.stdout.write('{}');
      return;
    }

    const skillName = tool_input?.skill || 'unknown';
    const stats = loadStats();

    // Track skill invocation
    stats.skillInvocations[skillName] = (stats.skillInvocations[skillName] || 0) + 1;
    stats.totalSkillCalls += 1;

    saveStats(stats);
  } catch {
    // Silently ignore
  }

  process.stdout.write('{}');
}

if (require.main === module) {
  main();
} else {
  module.exports = { loadStats, saveStats, formatSummary, createFreshStats, STATS_FILE };
}
