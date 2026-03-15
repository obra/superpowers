#!/usr/bin/env node
/**
 * Subagent Guard — SubagentStop Hook
 *
 * Detects when subagents invoke superpowers-optimized skills or spawn
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

// Patterns that indicate a subagent invoked skills or spawned sub-subagents
const VIOLATION_PATTERNS = [
  // Skill invocations
  /superpowers-optimized:/,
  /Invoke the superpowers-optimized/i,
  /I'm using the .+ skill/i,
  /using-superpowers/,
  /brainstorming skill/i,
  /writing-plans skill/i,
  /executing-plans skill/i,
  /subagent-driven-development skill/i,
  /systematic-debugging skill/i,
  /test-driven-development skill/i,
  /verification-before-completion skill/i,
  /token-efficiency skill/i,
  /context-management skill/i,
  /dispatching-parallel-agents skill/i,
  /requesting-code-review skill/i,
  /receiving-code-review skill/i,
  /finishing-a-development-branch skill/i,
  /error-recovery skill/i,
  /frontend-craftsmanship skill/i,
  /claude-md-creator skill/i,
  /self-consistency-reasoner skill/i,
  /using-git-worktrees skill/i,
  /premise-check skill/i,
  /red-team skill/i,
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
              'SKILL LEAKAGE DETECTED: You invoked a superpowers-optimized skill, which is not allowed for subagents.',
              'Redo your assigned task using only your core tools (Read, Edit, Write, Bash, Grep, Glob).',
              'Do NOT invoke the Skill tool. Do NOT reference any superpowers-optimized skills.',
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
