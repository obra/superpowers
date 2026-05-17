#!/usr/bin/env node
/**
 * Auto-Improve Eval — Complexity Classification Scorer
 *
 * Tests whether Claude correctly classifies tasks as micro/lightweight/full
 * based on the using-superpowers SKILL.md complexity classification rules.
 *
 * This eval REQUIRES the Claude CLI — it runs `claude -p` for each test case.
 *
 * Usage: node tools/autoimprove/eval-classification.js
 * Options:
 *   --dry-run    Show test cases without running Claude
 *   --case N     Run only test case N (0-indexed)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const TEST_CASES_PATH = path.join(__dirname, 'test-cases-classification.json');
const SKILL_PATH = path.join(REPO_ROOT, 'skills', 'using-superpowers', 'SKILL.md');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const caseIdx = args.indexOf('--case') !== -1 ? parseInt(args[args.indexOf('--case') + 1]) : null;

function classifyWithClaude(prompt, skillContent) {
  // Build a focused classification prompt
  const classificationPrompt = `You are testing a complexity classification system. Given the rules below and a user task, classify it as exactly one of: micro, lightweight, or full.

## Classification Rules (from SKILL.md)
${skillContent}

## Task to classify
"${prompt}"

## Instructions
1. Check hard overrides first
2. Check micro criteria
3. Check lightweight criteria (all 4 must be true)
4. Default to full

Respond with ONLY a JSON object, nothing else:
{"classification": "micro|lightweight|full", "reason": "one sentence why"}`;

  try {
    const result = execSync(
      `claude -p "${classificationPrompt.replace(/"/g, '\\"').replace(/\n/g, '\\n')}" --max-turns 1 --output-format json`,
      {
        cwd: REPO_ROOT,
        timeout: 120000,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }
    );

    // Extract the classification from Claude's response
    // The response is JSON with a result field
    let response;
    try {
      response = JSON.parse(result);
    } catch {
      // Try to find JSON in the raw output
      response = { result: result };
    }

    const text = typeof response.result === 'string' ? response.result : JSON.stringify(response);

    // Try to parse JSON from the response
    const jsonMatch = text.match(/\{[^}]*"classification"\s*:\s*"(micro|lightweight|full)"[^}]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return { classification: parsed.classification, reason: parsed.reason || '', raw: text };
    }

    // Fallback: look for the word micro/lightweight/full
    const lower = text.toLowerCase();
    if (lower.includes('"micro"') || lower.match(/\bclassification.*micro\b/)) return { classification: 'micro', reason: '', raw: text };
    if (lower.includes('"lightweight"') || lower.match(/\bclassification.*lightweight\b/)) return { classification: 'lightweight', reason: '', raw: text };
    if (lower.includes('"full"') || lower.match(/\bclassification.*full\b/)) return { classification: 'full', reason: '', raw: text };

    return { classification: 'unknown', reason: 'Could not parse response', raw: text };
  } catch (e) {
    return { classification: 'error', reason: e.message, raw: '' };
  }
}

function main() {
  let testCases;
  try {
    testCases = JSON.parse(fs.readFileSync(TEST_CASES_PATH, 'utf8'));
  } catch (e) {
    console.error(`ERROR: Could not load test cases: ${e.message}`);
    process.exit(1);
  }

  // Filter to single case if requested
  if (caseIdx !== null) {
    if (caseIdx < 0 || caseIdx >= testCases.length) {
      console.error(`ERROR: Case index ${caseIdx} out of range (0-${testCases.length - 1})`);
      process.exit(1);
    }
    testCases = [testCases[caseIdx]];
  }

  // Read SKILL.md for classification rules
  let skillContent;
  try {
    const full = fs.readFileSync(SKILL_PATH, 'utf8');
    // Extract just the Complexity Classification section
    const start = full.indexOf('## Complexity Classification');
    const end = full.indexOf('## Routing Guide');
    skillContent = start !== -1 ? full.substring(start, end !== -1 ? end : undefined) : full;
  } catch (e) {
    console.error(`ERROR: Could not load SKILL.md: ${e.message}`);
    process.exit(1);
  }

  console.log('=== Classification Eval ===');
  console.log(`Test cases: ${testCases.length}`);

  if (dryRun) {
    console.log('\n--- DRY RUN (no Claude calls) ---');
    testCases.forEach((tc, i) => {
      console.log(`[${i}] ${tc.expectedClassification.toUpperCase().padEnd(12)} "${tc.prompt.substring(0, 70)}..."`);
    });
    console.log(`\nDistribution: ${testCases.filter(t => t.expectedClassification === 'micro').length} micro, ${testCases.filter(t => t.expectedClassification === 'lightweight').length} lightweight, ${testCases.filter(t => t.expectedClassification === 'full').length} full`);
    return;
  }

  console.log('Running Claude for each test case (this takes a while)...\n');

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    process.stdout.write(`[${i + 1}/${testCases.length}] ${tc.expectedClassification.padEnd(12)} `);

    const result = classifyWithClaude(tc.prompt, skillContent);

    if (result.classification === tc.expectedClassification) {
      console.log(`[PASS] got: ${result.classification}`);
      passed++;
    } else {
      console.log(`[FAIL] expected: ${tc.expectedClassification}, got: ${result.classification}`);
      failures.push({
        index: i,
        prompt: tc.prompt,
        expected: tc.expectedClassification,
        got: result.classification,
        reason: result.reason
      });
      failed++;
    }
  }

  console.log('\n---');
  const total = passed + failed;
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
  console.log(`Score: ${passed}/${total} (${pct}%)`);

  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`  [${f.index}] "${f.prompt.substring(0, 60)}..."`);
      console.log(`       expected: ${f.expected}, got: ${f.got}`);
      if (f.reason) console.log(`       reason: ${f.reason}`);
    }
  }
}

main();
