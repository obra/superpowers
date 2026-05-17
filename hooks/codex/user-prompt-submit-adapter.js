#!/usr/bin/env node
/**
 * Codex UserPromptSubmit adapter.
 *
 * Reuses the shared skill-matching logic while keeping Codex's wire shape,
 * stdin handling, and file pathing isolated from Claude Code.
 */

'use strict';

const {
  buildContext, isMicroTask, matchSkills,
  extractKeywords, searchSessionLog, buildMemoryContext,
  searchKnownIssues, buildKnownIssuesContext,
  isExecutionTrigger, getContextPressure, buildContextPressureBlock,
} = require('../skill-activator');
const { readJsonStdin } = require('./utils');

function evaluatePayload(data) {
  if (!data || typeof data !== 'object') return {};

  const prompt = typeof data.prompt === 'string' ? data.prompt : '';
  if (!prompt || isMicroTask(prompt)) return {};

  const cwd = typeof data.cwd === 'string' ? data.cwd : process.cwd();
  const sessionId = typeof data.session_id === 'string' ? data.session_id : null;

  // Context pressure gate: block plan execution when context ≥60%
  if (isExecutionTrigger(prompt)) {
    const pressure = getContextPressure(cwd, sessionId);
    if (pressure && pressure.overThreshold) {
      return {
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: buildContextPressureBlock(pressure),
        },
      };
    }
  }

  const matches = matchSkills(prompt);
  const keywords = extractKeywords(prompt);
  const memoryEntries = searchSessionLog(cwd, keywords);
  const knownIssueEntries = searchKnownIssues(cwd, keywords);

  const skillContext = buildContext(matches);
  const memoryContext = buildMemoryContext(memoryEntries);
  const knownIssuesContext = buildKnownIssuesContext(knownIssueEntries);

  if (!skillContext && !memoryContext && !knownIssuesContext) return {};

  const combined = [skillContext, knownIssuesContext, memoryContext].filter(Boolean).join('\n\n');

  return {
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: combined,
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
  module.exports = { evaluatePayload, main };
}
