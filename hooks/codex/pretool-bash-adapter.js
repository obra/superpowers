#!/usr/bin/env node
/**
 * Codex PreToolUse Bash Dispatcher
 *
 * Single dispatcher for Codex PreToolUse(Bash) events.
 * Runs safety checks sequentially in one process because Codex may run
 * multiple matching hooks for the same event concurrently.
 *
 * Checks applied in order:
 *   1. block-dangerous-commands — catastrophic/high-risk shell commands
 *   2. protect-secrets (Bash path) — secret exposure and exfiltration
 *
 * First block wins. Non-Bash tool calls return {} immediately.
 */

'use strict';

const path = require('path');

const SAFETY_DIR = path.join(__dirname, '..', 'safety');

const { checkCommand } = require(path.join(SAFETY_DIR, 'block-dangerous-commands'));
const { checkBashCommand } = require(path.join(SAFETY_DIR, 'protect-secrets'));
const { readJsonStdin } = require('./utils');

function blockResponse(reason) {
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  };
}

function evaluatePayload(data) {
  if (!data || typeof data !== 'object') return {};
  if ((data.tool_name || '').toLowerCase() !== 'bash') return {};

  const cmd = data.tool_input?.command || '';

  const dangerResult = checkCommand(cmd);
  if (dangerResult.blocked) {
    const p = dangerResult.pattern;
    const emoji = { critical: '🚨', high: '⛔', strict: '⚠️' }[p.level] || '⛔';
    return blockResponse(`${emoji} [${p.id}] ${p.reason}`);
  }

  const secretResult = checkBashCommand(cmd);
  if (secretResult.blocked) {
    const p = secretResult.pattern;
    const emoji = { critical: '🔐', high: '🛡️', strict: '⚠️' }[p.level] || '🛡️';
    return blockResponse(`${emoji} [${p.id}] ${p.reason}`);
  }

  return {};
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
  module.exports = { blockResponse, evaluatePayload, main };
}
