#!/usr/bin/env node
/**
 * Auto-Improve Eval — Local Scorer
 *
 * Re-implements the matching logic from hooks/skill-activator.js to score
 * skill-rules.json against test prompts without needing the Claude CLI.
 *
 * Note: Skips the isMicroTask() gate from skill-activator.js — our test
 * prompts are multi-sentence and will never trigger it.
 *
 * Usage: node tools/autoimprove/eval.js
 * Output: Per-case pass/fail + aggregate score percentage
 * Exit code: 0 always (score is informational)
 */

const fs = require('fs');
const path = require('path');

// Resolve paths relative to repo root
const REPO_ROOT = path.join(__dirname, '..', '..');
const RULES_PATH = path.join(REPO_ROOT, 'hooks', 'skill-rules.json');
const TEST_CASES_PATH = path.join(__dirname, 'test-cases.json');

// Must match hooks/skill-activator.js exactly
const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const CONFIDENCE_THRESHOLD = 2;

/**
 * Score a prompt against skill rules.
 * Reimplements matchSkills() from skill-activator.js.
 */
function matchSkills(prompt, rules) {
  if (!prompt || typeof prompt !== 'string') return [];
  const lower = prompt.toLowerCase();
  const matches = [];

  for (const rule of rules) {
    let score = 0;

    // Check keywords (case-insensitive substring) — +1 each
    for (const kw of rule.keywords || []) {
      if (lower.includes(kw.toLowerCase())) {
        score += 1;
      }
    }

    // Check intent patterns (regex) — +2 each
    for (const pattern of rule.intentPatterns || []) {
      try {
        const re = new RegExp(pattern, 'i');
        if (re.test(prompt)) {
          score += 2;
        }
      } catch {
        // Skip invalid regex
      }
    }

    // Apply confidence threshold
    if (score >= CONFIDENCE_THRESHOLD) {
      matches.push({
        skill: rule.skill,
        priority: rule.priority,
        type: rule.type,
        score,
      });
    }
  }

  // Two-level sort: priority first (critical > high > medium > low), then score descending
  matches.sort((a, b) => {
    const pDiff = (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99);
    if (pDiff !== 0) return pDiff;
    return b.score - a.score;
  });

  return matches.slice(0, 3);
}

function main() {
  // Load rules
  let rules;
  try {
    rules = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8')).rules || [];
  } catch (e) {
    console.error(`ERROR: Could not load rules from ${RULES_PATH}: ${e.message}`);
    process.exit(1);
  }

  // Load test cases
  let testCases;
  try {
    testCases = JSON.parse(fs.readFileSync(TEST_CASES_PATH, 'utf8'));
  } catch (e) {
    console.error(`ERROR: Could not load test cases from ${TEST_CASES_PATH}: ${e.message}`);
    process.exit(1);
  }

  console.log('=== Auto-Improve Eval ===');

  let totalChecks = 0;
  let passedChecks = 0;

  for (const tc of testCases) {
    const matches = matchSkills(tc.prompt, rules);
    const matchedSkills = matches.map(m => m.skill);

    // Negative test: skill should NOT appear in top-3
    if (tc.type === 'negative') {
      const found = matchedSkills.includes(tc.notExpectedSkill);
      totalChecks += 1;
      if (!found) {
        passedChecks += 1;
        console.log(`[PASS] NOT ${tc.notExpectedSkill}: absent=yes (1/1)`);
      } else {
        console.log(`[FAIL] NOT ${tc.notExpectedSkill}: absent=no (0/1)`);
        const detail = matches.map(m => `${m.skill}(${m.priority},${m.score})`).join(', ');
        console.log(`      actual matches: ${detail}`);
      }
      continue;
    }

    // Positive test: skill should appear at expected rank
    // Check 1: Did expectedSkill appear in top-3?
    const topN = matchedSkills.includes(tc.expectedSkill);

    // Check 2: Was expectedSkill at the expected rank?
    const expectedIdx = (tc.expectedRank || 1) - 1;
    const atExpectedRank = matchedSkills.length > expectedIdx && matchedSkills[expectedIdx] === tc.expectedSkill;

    const checksPass = (topN ? 1 : 0) + (atExpectedRank ? 1 : 0);
    totalChecks += 2;
    passedChecks += checksPass;

    const status = checksPass === 2 ? 'PASS' : 'FAIL';
    const topNStr = topN ? 'yes' : 'no';
    const rankStr = atExpectedRank ? 'yes' : 'no';

    console.log(`[${status}] ${tc.expectedSkill}: topN=${topNStr} rank${tc.expectedRank || 1}=${rankStr} (${checksPass}/2)`);

    // Show what actually matched (useful for debugging)
    if (status === 'FAIL') {
      const detail = matches.map(m => `${m.skill}(${m.priority},${m.score})`).join(', ');
      console.log(`      actual matches: ${detail || '(none)'}`);
    }
  }

  console.log('---');
  const pct = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
  console.log(`Score: ${passedChecks}/${totalChecks} (${pct}%)`);
}

main();
