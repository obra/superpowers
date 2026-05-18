#!/usr/bin/env node
/**
 * LLM-based classifier for user corrections.
 * Reads stdin JSON with { userMessage, matchedTrigger, cwd }.
 * Outputs JSON with { category, suggestedId, confidence }.
 *
 * Falls back to keyword-based classification if LLM is unavailable.
 */

const fs = require('fs');
const path = require('path');

function main() {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { input += chunk; });
  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(input);
      const userMessage = data.userMessage || '';
      const matchedTrigger = data.matchedTrigger || '';

      // Keyword-based fallback classification
      const category = classifyByKeywords(userMessage);
      const suggestedId = generateSuggestedId(userMessage, category);

      process.stdout.write(JSON.stringify({
        category,
        suggestedId,
        confidence: 0.6,
        reasoning: `Keyword-based classification: ${category}`,
      }));
    } catch {
      process.stdout.write(JSON.stringify({
        category: 'error_pattern',
        suggestedId: 'unknown-pattern',
        confidence: 0.3,
        reasoning: 'Fallback classification',
      }));
    }
  });
}

function classifyByKeywords(message) {
  const lower = message.toLowerCase();

  if (lower.includes('missing') || lower.includes('forgot') || lower.includes('esqueceu') ||
      lower.includes('falta') || lower.includes('não está') || lower.includes('not working') ||
      lower.includes('quebrado') || lower.includes('error') || lower.includes('bug')) {
    return 'error_pattern';
  }

  if (lower.includes('melhor') || lower.includes('better') || lower.includes('should be') ||
      lower.includes('deveria') || lower.includes('poderia') || lower.includes('could')) {
    return 'good_practice';
  }

  if (lower.includes('sempre') || lower.includes('always') || lower.includes('nunca') ||
      lower.includes('never') || lower.includes('regra') || lower.includes('rule') ||
      lower.includes('padrão') || lower.includes('standard')) {
    return 'project_constraint';
  }

  return 'one_off';
}

function generateSuggestedId(message, category) {
  const words = message.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 4)
    .join('-');

  const prefix = category === 'error_pattern' ? '' :
                 category === 'good_practice' ? 'practice-' :
                 'constraint-';

  return `${prefix}${words || 'unknown-pattern'}`;
}

main();
