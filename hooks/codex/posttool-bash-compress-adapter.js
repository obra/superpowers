#!/usr/bin/env node
/**
 * Codex PostToolUse Bash Smart Compress Adapter
 *
 * Replaces noisy Bash tool results with a compressed summary after the command
 * has already run. This is the closest honest Codex analogue to Claude Code's
 * PreToolUse bash rewrite path: reactive compression, not pre-execution rewrite.
 *
 * Fail-open rules:
 *   - Non-Bash tool calls
 *   - Commands with no matching compression rule
 *   - Commands on the NEVER_COMPRESS list
 *   - Short output
 *   - Failed/unparseable payloads
 *   - Compression that does not materially reduce output
 */

'use strict';

const { MIN_OUTPUT_LENGTH, NEVER_COMPRESS, RULES } = require('../compression-rules');
const { readJsonStdin } = require('./utils');

function normalizeText(value) {
  return typeof value === 'string' ? value.replace(/\r\n/g, '\n') : '';
}

function parseJsonString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']')))) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function parseExitCode(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) return Number(value.trim());
  return null;
}

function firstNonEmptyString(values) {
  for (const value of values) {
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return '';
}

function firstExitCode(values) {
  for (const value of values) {
    const parsed = parseExitCode(value);
    if (parsed !== null) return parsed;
  }
  return null;
}

function extractToolResult(value, depth = 0) {
  if (depth > 4 || value == null) return null;

  if (typeof value === 'string') {
    const parsed = parseJsonString(value);
    if (parsed !== null) {
      return extractToolResult(parsed, depth + 1);
    }
    return {
      stdout: normalizeText(value),
      stderr: '',
      exitCode: 0,
    };
  }

  if (Array.isArray(value)) {
    const text = value
      .map(entry => {
        if (typeof entry === 'string') return entry;
        if (entry && typeof entry === 'object') {
          return firstNonEmptyString([entry.text, entry.content, entry.output]);
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');

    if (!text) return null;
    return {
      stdout: normalizeText(text),
      stderr: '',
      exitCode: 0,
    };
  }

  if (typeof value !== 'object') return null;

  const stdout = normalizeText(firstNonEmptyString([
    value.stdout,
    value.output,
    value.text,
    value.content,
    value.message,
  ]));
  const stderr = normalizeText(firstNonEmptyString([
    value.stderr,
    value.error,
    value.errors,
  ]));
  const exitCode = firstExitCode([
    value.exit_code,
    value.exitCode,
    value.status,
    value.code,
  ]);

  if (stdout || stderr || exitCode !== null) {
    return {
      stdout,
      stderr,
      exitCode: exitCode ?? 0,
    };
  }

  for (const nested of [value.result, value.response, value.data, value.payload, value.metadata]) {
    const extracted = extractToolResult(nested, depth + 1);
    if (extracted) return extracted;
  }

  return null;
}

function countNonEmptyLines(text) {
  return normalizeText(text)
    .split('\n')
    .filter(line => line.trim().length > 0)
    .length;
}

function buildReplacement(compressed, ruleType, originalCombined) {
  const originalLines = countNonEmptyLines(originalCombined);
  const compressedLines = countNonEmptyLines(compressed);

  return [
    '[smart-compress] Verbose Bash output replaced with a compressed summary.',
    compressed.trim(),
    `[compressed: ${originalLines}->${compressedLines} lines | ${ruleType}]`,
  ].join('\n');
}

function evaluatePayload(data) {
  if (!data || typeof data !== 'object') return {};
  if ((data.tool_name || '').toLowerCase() !== 'bash') return {};

  const command = (data.tool_input?.command || '').trim();
  if (!command) return {};
  if (NEVER_COMPRESS.some(pattern => pattern.test(command))) return {};

  const rule = RULES.find(candidate => candidate.match.test(command));
  if (!rule) return {};

  const toolResult = extractToolResult(data.tool_response);
  if (!toolResult) return {};

  const stdout = normalizeText(toolResult.stdout || '');
  const stderr = normalizeText(toolResult.stderr || '');
  const combined = [stdout, stderr].filter(Boolean).join('\n').trim();
  if (!combined || combined.length < MIN_OUTPUT_LENGTH) return {};

  let compressed;
  try {
    compressed = rule.compress(stdout, stderr, toolResult.exitCode ?? 0);
  } catch {
    return {};
  }

  if (!compressed || typeof compressed !== 'string') return {};

  const replacement = buildReplacement(compressed, rule.type, combined);
  if (replacement.trim().length >= combined.length) return {};
  if (countNonEmptyLines(replacement) >= countNonEmptyLines(combined)) return {};

  return {
    decision: 'block',
    continue: false,
    reason: replacement,
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: replacement,
    },
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
    buildReplacement,
    countNonEmptyLines,
    evaluatePayload,
    extractToolResult,
    parseExitCode,
    parseJsonString,
  };
}
