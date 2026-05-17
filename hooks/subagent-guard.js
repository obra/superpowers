#!/usr/bin/env node
/**
 * Subagent Guard — SubagentStop Hook
 *
 * Detects when subagents invoke superpowers-prepared skills or spawn
 * recursive sub-subagents. When detected, blocks the subagent from
 * stopping and instructs it to redo its work without skill invocations.
 *
 * This is the "locked door" layer of defense — prompt-based instructions
 * ("do NOT invoke skills") are the first layer; this hook catches violations
 * that slip through.
 *
 * Logs violations to: ~/.claude/hooks-logs/subagent-violations.jsonl
 */

const fs = require('fs');
const path = require('path');

// Patterns that indicate a subagent invoked skills or spawned sub-subagents.
// Each pattern requires an action verb (invoke/invoking/using/use/run/running/called/calling)
// immediately before the skill reference so that bare mentions in file content or
// code comments do not trigger false positives.
const SKILL_NAMES = [
  'using-superpowers',
  'brainstorming',
  'deliberation',
  'writing-plans',
  'executing-plans',
  'subagent-driven-development',
  'systematic-debugging',
  'test-driven-development',
  'verification-before-completion',
  'token-efficiency',
  'context-management',
  'dispatching-parallel-agents',
  'requesting-code-review',
  'receiving-code-review',
  'finishing-a-development-branch',
  'error-recovery',
  'frontend-design',
  'claude-md-creator',
  'self-consistency-reasoner',
  'using-git-worktrees',
  'premise-check',
  'red-team',
  'refactoring',
  'performance-investigation',
  'dependency-management',
];

const ACTION_VERB = '(?:invoking?|using|use|running?|called?|calling|activat(?:e|ed|ing)|trigger(?:ing|ed)?|execut(?:e|ed|ing)|launch(?:ing|ed)?|spawn(?:ing|ed)?|start(?:ing|ed)?)\\s+(?:the\\s+)?';

const VIOLATION_PATTERNS = [
  /Invoke the superpowers-prepared/i,
  /I'm using the .+ skill/i,
  /Skill\s*\(\s*["']?superpowers/i,
  /skill:\s*["']?(superpowers|using-superpowers|brainstorming|deliberation|systematic-debugging|test-driven-development|verification|executing-plans|writing-plans|context-management|frontend-design|refactoring|performance-investigation|dependency-management)/i,
  ...SKILL_NAMES.map(name => new RegExp(ACTION_VERB + name, 'i')),
];

function logViolation(agentId, agentType, matchedPattern) {
  try {
    const logDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.claude', 'hooks-logs');
    fs.mkdirSync(logDir, { recursive: true });

    const logFile = path.join(logDir, 'subagent-violations.jsonl');
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      agentId,
      agentType,
      matchedPattern: matchedPattern.toString(),
      action: 'blocked'
    }) + '\n';

    fs.appendFileSync(logFile, entry);
  } catch (_) {
    // Logging must never break the hook
  }
}

function main() {
  let input = '';

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { input += chunk; });
  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(input);
      const lastMessage = data.last_assistant_message || '';
      const agentId = data.agent_id || 'unknown';
      const agentType = data.agent_type || 'unknown';

      // Check if the subagent's output shows evidence of skill invocation
      for (const pattern of VIOLATION_PATTERNS) {
        if (pattern.test(lastMessage)) {
          logViolation(agentId, agentType, pattern);

          // Block the subagent from stopping — force it to redo without skills
          const result = {
            decision: 'block',
            reason: [
              'SKILL LEAKAGE DETECTED: You invoked a superpowers-prepared skill, which is not allowed for subagents.',
              'Redo your assigned task using only your core tools (Read, Edit, Write, Bash, Grep, Glob).',
              'Do NOT invoke the Skill tool. Do NOT reference any superpowers-prepared skills.',
              'Focus only on the task you were given.'
            ].join(' ')
          };

          process.stdout.write(JSON.stringify(result));
          return;
        }
      }

      // No violation — allow subagent to stop normally
      process.stdout.write('{}');
    } catch (_) {
      // Parse failure — allow stop (never break the pipeline)
      process.stdout.write('{}');
    }
  });
}

main();
