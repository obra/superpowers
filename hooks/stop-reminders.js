#!/usr/bin/env node
/**
 * Stop Hook — Contextual Reminders
 *
 * When Claude finishes responding, checks session context and provides
 * gentle reminders about TDD, verification, and commit hygiene.
 * These reminders reinforce discipline skills deterministically.
 *
 * Uses a file-based guard to fire only once per session to prevent
 * infinite loops (Stop hook returning content causes Claude to resume).
 *
 * Input:  stdin JSON with { session_id, cwd, ... }
 * Output: stdout JSON with additionalContext, or {} to let Claude stop
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || '.',
  '.claude',
  'hooks-logs'
);
const EDIT_LOG = path.join(LOG_DIR, 'edit-log.txt');
const STATS_FILE = path.join(LOG_DIR, 'session-stats.json');
const GUARD_FILE = path.join(LOG_DIR, 'stop-hook-fired.lock');

// Guard: only fire once per session (prevent infinite loop)
// The guard file is created on first fire and checked on subsequent fires.
// It auto-expires after 2 minutes so subsequent Claude stops can show reminders.
const GUARD_TTL_MS = 2 * 60 * 1000;

function shouldFire() {
  try {
    if (fs.existsSync(GUARD_FILE)) {
      const stat = fs.statSync(GUARD_FILE);
      const age = Date.now() - stat.mtimeMs;
      if (age < GUARD_TTL_MS) {
        return false; // Guard is active, don't fire
      }
    }
    return true;
  } catch {
    return true;
  }
}

function setGuard() {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.writeFileSync(GUARD_FILE, new Date().toISOString());
  } catch {
    // Ignore guard write errors
  }
}

// Common test file patterns
const TEST_PATTERNS = [
  /\.test\.[jt]sx?$/,
  /\.spec\.[jt]sx?$/,
  /_test\.(go|py|rb)$/,
  /test_[^/]+\.py$/,
  /Tests?\.[^/]+$/,
  /\.test$/,
  /__tests__\//,
];

// Common source file patterns (non-test, non-config)
const SOURCE_PATTERNS = [
  /\.(js|jsx|ts|tsx|py|rb|go|rs|java|cs|cpp|c|h|hpp|swift|kt|scala|php)$/,
];

// Files that are clearly config/non-source
const CONFIG_PATTERNS = [
  /package\.json$/,
  /tsconfig.*\.json$/,
  /\.eslintrc/,
  /\.prettierrc/,
  /\.gitignore$/,
  /\.env/,
  /Dockerfile/,
  /docker-compose/,
  /\.ya?ml$/,
  /\.toml$/,
  /\.cfg$/,
  /\.ini$/,
  /\.md$/,
  /\.lock$/,
  /CLAUDE\.md$/,
  /SKILL\.md$/,
];

function isTestFile(filePath) {
  return TEST_PATTERNS.some(p => p.test(filePath));
}

function isSourceFile(filePath) {
  return SOURCE_PATTERNS.some(p => p.test(filePath)) && !CONFIG_PATTERNS.some(p => p.test(filePath));
}

/**
 * Read recent edits from the edit log (last 30 minutes).
 */
function getRecentEdits() {
  try {
    if (!fs.existsSync(EDIT_LOG)) return [];

    const content = fs.readFileSync(EDIT_LOG, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    const cutoff = new Date(Date.now() - 30 * 60 * 1000);

    return lines
      .map(line => {
        const parts = line.split(' | ');
        if (parts.length < 3) return null;
        return {
          timestamp: parts[0],
          tool: parts[1],
          filePath: parts.slice(2).join(' | '),
        };
      })
      .filter(entry => entry && new Date(entry.timestamp) > cutoff);
  } catch {
    return [];
  }
}

/**
 * Load session statistics for progress visibility.
 */
function getSessionStats() {
  try {
    if (!fs.existsSync(STATS_FILE)) return null;
    return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Format session stats into a brief summary line.
 */
function formatStatsSummary(stats) {
  if (!stats || stats.totalSkillCalls === 0) return null;

  const duration = Math.round((Date.now() - new Date(stats.startedAt).getTime()) / 60000);
  const skillNames = Object.entries(stats.skillInvocations)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `${name} (${count}x)`)
    .join(', ');

  return `Session summary: ${duration}min, ${stats.totalSkillCalls} skill invocations [${skillNames}]`;
}

/**
 * Generate contextual reminders based on edit history and session stats.
 * Returns array of reminder strings.
 */
function generateReminders(edits) {
  const reminders = [];

  // Session stats summary (always include if available)
  const stats = getSessionStats();
  const statsSummary = formatStatsSummary(stats);
  if (statsSummary) {
    reminders.push(statsSummary);
  }

  if (edits.length === 0) return reminders;

  const editedPaths = [...new Set(edits.map(e => e.filePath))];
  const sourceFiles = editedPaths.filter(isSourceFile);
  const testFiles = editedPaths.filter(isTestFile);

  // TDD reminder: source files changed without corresponding tests
  const untestedSources = sourceFiles.filter(src => !isTestFile(src));
  if (untestedSources.length > 0 && testFiles.length === 0) {
    reminders.push(
      `TDD reminder: ${untestedSources.length} source file(s) modified without test changes. ` +
      `Consider invoking superpowers-optimized:test-driven-development if behavior changed.`
    );
  }

  // Commit reminder: many files changed
  if (editedPaths.length >= 5) {
    reminders.push(
      `Commit reminder: ${editedPaths.length} files modified in this session. ` +
      `Consider committing incremental progress to avoid losing work.`
    );
  }

  return reminders;
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  try {
    JSON.parse(input); // Validate JSON, discard — we only read the edit log

    // File-based guard prevents infinite loop
    if (!shouldFire()) {
      process.stdout.write('{}');
      return;
    }

    const edits = getRecentEdits();
    const reminders = generateReminders(edits);

    if (reminders.length === 0) {
      process.stdout.write('{}');
      return;
    }

    // Set guard BEFORE outputting — prevents re-entry
    setGuard();

    // Return reminders as additional context
    const context = [
      '<stop-hook-reminders>',
      ...reminders,
      '</stop-hook-reminders>',
    ].join('\n');

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'Stop',
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
  module.exports = { generateReminders, getRecentEdits, isTestFile, isSourceFile, shouldFire, setGuard };
}
