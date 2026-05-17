#!/usr/bin/env node
/**
 * Codex Stop Adapter
 *
 * Runs when a Codex turn ends. Generates lightweight discipline reminders
 * surfaced as a one-time continuation prompt. This matches the current
 * Codex contract more reliably than a silent Stop-only systemMessage.
 */

'use strict';

const crypto = require('crypto');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const { readJsonStdin } = require('./utils');

const TEST_PATTERNS = [
  /\.test\.[jt]sx?$/, /\.spec\.[jt]sx?$/, /_test\.(go|py|rb)$/,
  /test_[^/]+\.py$/, /Tests?\.[^/]+$/, /__tests__\//,
  /(?:^|[/\\])test[-_][^/\\]+\.[jt]sx?$/i,
  /[/\\]tests?[/\\]/i,
];
const SOURCE_PATTERNS = [/\.(js|jsx|ts|tsx|py|rb|go|rs|java|cs|cpp|c|h|hpp|swift|kt|scala|php)$/];
const CONFIG_PATTERNS = [
  /package\.json$/, /tsconfig.*\.json$/, /\.eslintrc/, /\.prettierrc/,
  /\.gitignore$/, /\.env/, /Dockerfile/, /docker-compose/, /\.ya?ml$/,
  /\.toml$/, /\.cfg$/, /\.ini$/, /\.md$/, /\.lock$/, /CLAUDE\.md$/, /SKILL\.md$/,
];
const SIG_PATTERNS = [
  /(?:^|[/\\])SKILL\.md$/i,
  /[/\\]hooks[/\\](?:.+[/\\])?[^/\\]+\.js$/,
  /(?:^|[/\\])skill-rules\.json$/i,
  /[/\\]hooks(?:-cursor|-codex)?\.json$/i,
  /[/\\]\.(?:claude|codex|cursor)-plugin[/\\]plugin\.json$/i,
  /(?:^|[/\\])CLAUDE\.md$/i,
  /(?:^|[/\\])AGENTS\.md$/i,
  /agents[/\\][^/\\]+\.md$/i,
];

const isTestFile = f => TEST_PATTERNS.some(p => p.test(f));
const isSourceFile = f => SOURCE_PATTERNS.some(p => p.test(f)) && !CONFIG_PATTERNS.some(p => p.test(f));
const isSignificantFile = f => SIG_PATTERNS.some(p => p.test(f));
const REMINDER_CACHE_FILE = 'superpowers-stop-reminder-cache.json';
const REMINDER_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function runGit(cmd, cwd) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout: 3000, cwd, stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch (error) {
    const stdout = typeof error?.stdout === 'string'
      ? error.stdout
      : Buffer.isBuffer(error?.stdout)
        ? error.stdout.toString('utf8')
        : '';
    if (stdout && error?.status === 0) return stdout.trim();
    return '';
  }
}

function getUncommittedFiles(cwd) {
  const staged = runGit('git diff --name-only --cached', cwd);
  const unstaged = runGit('git diff --name-only', cwd);
  const untracked = runGit('git ls-files --others --exclude-standard', cwd);
  const combined = [staged, unstaged, untracked].filter(Boolean).join('\n');
  return [...new Set(combined.split('\n').filter(Boolean))];
}

function resolveGitDirPath(cwd, gitDirOutput) {
  if (!gitDirOutput) return null;
  return path.isAbsolute(gitDirOutput) ? gitDirOutput : path.resolve(cwd, gitDirOutput);
}

function getReminderCachePath(cwd, gitDirOutput) {
  const gitDirPath = resolveGitDirPath(cwd, gitDirOutput);
  if (!gitDirPath) return null;
  return path.join(gitDirPath, REMINDER_CACHE_FILE);
}

function loadReminderCache(cachePath) {
  try {
    if (!cachePath || !fs.existsSync(cachePath)) return {};
    const parsed = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveReminderCache(cachePath, cache) {
  try {
    if (!cachePath) return;
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.writeFileSync(cachePath, JSON.stringify(cache), 'utf8');
  } catch {
    // Never block Stop hook on cache write failures
  }
}

function getSessionScopeKey(data, cwd) {
  const resolvedCwd = path.resolve(cwd);
  const sessionId = typeof data?.session_id === 'string' ? data.session_id.trim() : '';
  if (sessionId) return `session:${sessionId}:cwd:${resolvedCwd}`;

  // If session_id is missing, fall back to a daily cwd-scoped bucket so users
  // still get at most one duplicate reminder per day for unchanged state.
  const day = new Date().toISOString().slice(0, 10);
  return `cwd:${resolvedCwd}:day:${day}`;
}

function buildReminderSignature(reminders) {
  const body = reminders.join('\n');
  return crypto.createHash('sha1').update(body).digest('hex');
}

function pruneOldReminderCacheEntries(cache, nowMs) {
  const result = {};
  for (const [key, value] of Object.entries(cache || {})) {
    if (!value || typeof value !== 'object') continue;
    const ts = new Date(value.updatedAt || 0).getTime();
    if (!ts || Number.isNaN(ts)) continue;
    if ((nowMs - ts) > REMINDER_CACHE_MAX_AGE_MS) continue;
    if (typeof value.signature !== 'string' || value.signature.length === 0) continue;
    result[key] = value;
  }
  return result;
}

function shouldEmitReminders(data, cwd, gitDirOutput, reminders) {
  if (!Array.isArray(reminders) || reminders.length === 0) return false;

  const cachePath = getReminderCachePath(cwd, gitDirOutput);
  const now = new Date().toISOString();
  const nowMs = Date.now();
  const scopeKey = getSessionScopeKey(data, cwd);
  const signature = buildReminderSignature(reminders);

  const cache = pruneOldReminderCacheEntries(loadReminderCache(cachePath), nowMs);
  const prior = cache[scopeKey];
  if (prior && prior.signature === signature) return false;

  cache[scopeKey] = { signature, updatedAt: now };
  saveReminderCache(cachePath, cache);
  return true;
}

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function checkSessionLogSize(cwd) {
  try {
    const log = readFileSafe(path.join(cwd, 'session-log.md'));
    if (!log) return null;

    const entries = [];
    let current = null;
    for (const line of log.split('\n')) {
      if (/^## .+\[saved\]/.test(line)) {
        if (current) entries.push(current);
        current = { header: line, chars: line.length + 1 };
      } else if (/^## .+\[auto\]/.test(line)) {
        if (current) {
          entries.push(current);
          current = null;
        }
      } else if (current) {
        current.chars += line.length + 1;
      }
    }
    if (current) entries.push(current);

    const last2 = entries.slice(-2);
    const hardCap = 1000;
    const over = last2.filter(e => e.chars > hardCap);
    if (over.length === 0) return null;

    const totalTokens = last2.reduce((sum, entry) => sum + Math.round(entry.chars / 4), 0);
    return (
      `Session-log size warning: last 2 [saved] entries inject ~${totalTokens} tokens per session ` +
      `(target: <300). Entries over budget: ${over.map(e => e.header.trim()).join('; ')}. ` +
      'Trim to: Goal / Decisions / Rejected / Open only.'
    );
  } catch {
    return null;
  }
}

function generateReminders(cwd, changedFiles) {
  const reminders = [];

  if (changedFiles.length === 0) return reminders;

  const sourceFiles = changedFiles.filter(isSourceFile);
  const testFiles = changedFiles.filter(isTestFile);

  if (sourceFiles.length > 0 && testFiles.length === 0) {
    reminders.push(
      `TDD reminder: ${sourceFiles.length} source file(s) modified without test changes. ` +
      'Consider running tests or invoking the test-driven-development skill if behavior changed.'
    );
  }

  if (changedFiles.length >= 5) {
    reminders.push(
      `Commit reminder: ${changedFiles.length} files with uncommitted changes. ` +
      'Consider committing incremental progress to avoid losing work.'
    );
  }

  const sigFiles = changedFiles.filter(isSignificantFile);
  if (sigFiles.length > 0) {
    reminders.push(
      `Decision log: Core skill/hook/config files were modified (${sigFiles.map(f => path.basename(f)).join(', ')}). ` +
      'Before stopping, invoke the context-management skill to write a [saved] entry ' +
      'capturing decisions and rationale. Future sessions start with zero context.'
    );
  }

  const sizeWarning = checkSessionLogSize(cwd);
  if (sizeWarning) reminders.push(sizeWarning);

  return reminders;
}

function buildContinuationReason(reminders) {
  return [
    'Superpowers reminders before you stop:',
    ...reminders.map((reminder, index) => `${index + 1}. ${reminder}`),
    'Tell the user these reminders briefly before ending the turn.',
  ].join('\n');
}

function evaluatePayload(data) {
  if (!data || typeof data !== 'object') return {};
  if (data.stop_hook_active === true) return {};

  const cwd = data.cwd || process.cwd();
  const gitDirOutput = runGit('git rev-parse --git-dir', cwd);
  if (!gitDirOutput) return {};

  const changedFiles = getUncommittedFiles(cwd);
  const reminders = generateReminders(cwd, changedFiles);
  if (reminders.length === 0) return {};
  if (!shouldEmitReminders(data, cwd, gitDirOutput, reminders)) return {};

  return {
    decision: 'block',
    reason: buildContinuationReason(reminders),
  };
}

function main() {
  try {
    const data = readJsonStdin();
    process.stdout.write(JSON.stringify(evaluatePayload(data)));
  } catch {
    process.stdout.write('{}');
  }
}

if (require.main === module) {
  main();
} else {
  module.exports = {
    buildContinuationReason,
    buildReminderSignature,
    evaluatePayload,
    generateReminders,
    getUncommittedFiles,
    getSessionScopeKey,
    isSignificantFile,
    isSourceFile,
    isTestFile,
    main,
    pruneOldReminderCacheEntries,
    resolveGitDirPath,
    shouldEmitReminders,
  };
}
