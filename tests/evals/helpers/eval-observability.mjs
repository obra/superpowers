import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function getEvalDir() {
  const stateDir = process.env.SUPERPOWERS_STATE_DIR || path.join(os.homedir(), '.superpowers');
  return path.join(stateDir, 'evals');
}

export function estimateCostUsd(usage) {
  const inputRate = Number(process.env.EVAL_INPUT_COST_PER_1M || 0);
  const outputRate = Number(process.env.EVAL_OUTPUT_COST_PER_1M || 0);
  const inputTokens = Number(usage?.input_tokens || 0);
  const outputTokens = Number(usage?.output_tokens || 0);

  if (!inputRate && !outputRate) {
    return null;
  }

  return Number((((inputTokens / 1_000_000) * inputRate) + ((outputTokens / 1_000_000) * outputRate)).toFixed(6));
}

export function writeEvalRecord(record) {
  const evalDir = getEvalDir();
  fs.mkdirSync(evalDir, { recursive: true });
  const safeName = record.name.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(evalDir, `${timestamp}-${safeName}.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  return filePath;
}
