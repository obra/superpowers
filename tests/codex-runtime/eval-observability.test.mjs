import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { getEvalDir } from '../evals/helpers/eval-observability.mjs';

test('getEvalDir defaults to the featureforge state root', () => {
  const originalFeatureForgeStateDir = process.env.FEATUREFORGE_STATE_DIR;

  delete process.env.FEATUREFORGE_STATE_DIR;

  try {
    assert.equal(getEvalDir(), path.join(os.homedir(), '.featureforge', 'evals'));
  } finally {
    restoreEnv('FEATUREFORGE_STATE_DIR', originalFeatureForgeStateDir);
  }
});

test('getEvalDir honors FEATUREFORGE_STATE_DIR', () => {
  const originalFeatureForgeStateDir = process.env.FEATUREFORGE_STATE_DIR;

  process.env.FEATUREFORGE_STATE_DIR = '/tmp/featureforge-state';

  try {
    assert.equal(getEvalDir(), '/tmp/featureforge-state/evals');
  } finally {
    restoreEnv('FEATUREFORGE_STATE_DIR', originalFeatureForgeStateDir);
  }
});

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
