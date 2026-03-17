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

testFn('using-superpowers routes malformed artifacts to an earlier safe stage', async () => {
  const content = fs.readFileSync(path.join(REPO_ROOT, 'skills/using-superpowers/SKILL.md'), 'utf8');
  const routerStart = content.indexOf('## Superpowers Workflow Router');
  const routerSection = content.slice(routerStart);

  const result = await runJsonJudgeEval({
    name: 'using-superpowers-routing',
    system: 'You evaluate whether a workflow-routing prompt fails closed. Respond with JSON only.',
    prompt: `Review this routing section for an AI coding agent.

Question: does this routing guidance explicitly bias toward the earlier safe stage when artifacts are missing, malformed, stale, or ambiguous?

Respond with JSON only:
{"passed": true|false, "summary": "one sentence", "evidence": ["..."]}

Routing section:
${routerSection}`,
  });

  assert.equal(result.passed, true, JSON.stringify(result.judge_result));
});
