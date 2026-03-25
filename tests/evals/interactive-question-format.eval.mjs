import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { evalsEnabled, requireEvalEnv, runJsonJudgeEval } from './helpers/openai-judge.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');

const gate = requireEvalEnv();
const testFn = evalsEnabled() && gate.enabled ? test : test.skip;

testFn('interactive question format preserves context, recommendation, and options', async () => {
  const content = fs.readFileSync(path.join(REPO_ROOT, 'skills/using-featureforge/SKILL.md'), 'utf8');
  const start = content.indexOf('## Interactive User Question Format');
  const end = content.indexOf('## Contributor Mode');
  const section = content.slice(start, end);

  const result = await runJsonJudgeEval({
    name: 'interactive-question-format',
    system: 'You evaluate whether a prompt format is clear and actionable for an AI coding agent. Respond with JSON only.',
    prompt: `Evaluate this interactive-question-format section.

Question: would this reliably cause an AI agent to include project context, a recommendation, and lettered options in a user-facing question?

Respond with JSON only:
{"passed": true|false, "summary": "one sentence", "evidence": ["..."]}

Section:
${section}`,
  });

  assert.equal(result.passed, true, JSON.stringify(result.judge_result));
});
