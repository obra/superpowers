import { estimateCostUsd, writeEvalRecord } from './eval-observability.mjs';

export function evalsEnabled() {
  return process.env.EVALS === '1';
}

export function requireEvalEnv() {
  if (!evalsEnabled()) {
    return { enabled: false, reason: 'EVALS!=1' };
  }

  if (!process.env.OPENAI_API_KEY) {
    return { enabled: false, reason: 'OPENAI_API_KEY missing' };
  }

  if (!process.env.EVAL_MODEL) {
    return { enabled: false, reason: 'EVAL_MODEL missing' };
  }

  return { enabled: true };
}

export async function runJsonJudgeEval({ name, system, prompt }) {
  const startedAt = Date.now();
  const apiBase = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const response = await fetch(`${apiBase}/responses`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.EVAL_MODEL,
      input: [
        { role: 'system', content: [{ type: 'input_text', text: system }] },
        { role: 'user', content: [{ type: 'input_text', text: prompt }] },
      ],
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(`Eval request failed: ${response.status} ${JSON.stringify(body)}`);
  }

  const outputText = body.output_text || body.output?.map((item) => item?.content?.map((part) => part.text || '').join('')).join('') || '';
  const parsed = JSON.parse(outputText);
  const usage = body.usage || {};
  const record = {
    name,
    passed: Boolean(parsed.passed),
    summary: parsed.summary ?? null,
    transcript: outputText,
    judge_result: parsed,
    usage,
    elapsed_ms: Date.now() - startedAt,
    cost_usd: estimateCostUsd(usage),
    model: process.env.EVAL_MODEL,
    recorded_at: new Date().toISOString(),
  };
  record.record_path = writeEvalRecord(record);
  return record;
}
