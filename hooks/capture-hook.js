#!/usr/bin/env node
/**
 * PostUserFeedback Hook — Pattern Capture
 *
 * Detects user corrections, classifies them, and catalogs patterns.
 * Reads stdin for conversation context.
 * Output: stdout JSON with detection result.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function main() {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { input += chunk; });
  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(input);
      const userMessage = data.user_message || '';
      const cwd = data.cwd || process.cwd();

      if (!userMessage) {
        process.stdout.write(JSON.stringify({ decision: 'allow', reason: 'No user message' }));
        return;
      }

      const triggersPath = path.join(__dirname, 'capture-patterns.json');
      if (!fs.existsSync(triggersPath)) {
        process.stdout.write(JSON.stringify({ decision: 'allow', reason: 'No triggers config' }));
        return;
      }

      const triggers = JSON.parse(fs.readFileSync(triggersPath, 'utf8'));
      const matchedTrigger = triggers.correction_triggers.find(trigger =>
        userMessage.toLowerCase().includes(trigger.toLowerCase())
      );

      if (!matchedTrigger) {
        process.stdout.write(JSON.stringify({ decision: 'allow', reason: 'No correction detected' }));
        return;
      }

      // Classify the correction via LLM
      const classifierPath = path.join(__dirname, 'capture-classifier.js');
      let classification = { category: 'one_off', confidence: 0 };
      try {
        const result = execSync(
          `node "${classifierPath}"`,
          {
            input: JSON.stringify({ userMessage, matchedTrigger, cwd }),
            encoding: 'utf8',
            timeout: 30000,
          }
        );
        classification = JSON.parse(result.trim());
      } catch {
        classification = { category: 'error_pattern', confidence: 0.5 };
      }

      if (classification.category === 'one_off') {
        process.stdout.write(JSON.stringify({
          decision: 'allow',
          reason: 'One-off correction — not cataloging',
        }));
        return;
      }

      // Check if similar pattern exists
      const cliPath = path.join(__dirname, '..', 'tools', 'patterns', 'cli.ts');
      const queryTerm = classification.suggestedId || matchedTrigger.split(' ')[0];
      let existingMatch = '';
      try {
        const queryResult = execSync(
          `npx ts-node "${cliPath}" query "${queryTerm}"`,
          { cwd, encoding: 'utf8', timeout: 15000, stdio: ['pipe', 'pipe', 'pipe'] }
        );
        if (queryResult.includes('Found') && !queryResult.includes('No patterns')) {
          existingMatch = queryResult.trim();
        }
      } catch {
        // No match or CLI not available
      }

      // Output detection for the agent to handle
      const output = {
        decision: 'pattern_detected',
        category: classification.category,
        trigger: matchedTrigger,
        userMessage: userMessage.substring(0, 200),
        classification: classification,
        existingMatch: existingMatch,
        prompt: existingMatch
          ? `📋 Detected recurring pattern: "${matchedTrigger}"\n   Category: ${classification.category}\n   Similar pattern found:\n   ${existingMatch}\n\n   Update existing pattern frequency? (y/n)`
          : `📋 Detected a new pattern: "${matchedTrigger}"\n   Category: ${classification.category}\n   Suggested ID: ${classification.suggestedId || 'auto-generated'}\n\n   Add to patterns-wiki? (y/n/edit)`,
      };

      process.stdout.write(JSON.stringify(output));
    } catch (_) {
      process.stdout.write(JSON.stringify({ decision: 'allow', reason: 'Hook error' }));
    }
  });
}

main();
