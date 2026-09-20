import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..', '..');
const installer = path.join(repoRoot, 'scripts', 'install-opencode-model-routing.mjs');
const profiles = [
  ['superpowers-expert.md', 'zai-org/GLM-5.3'],
  ['superpowers-main.md', 'z-ai/glm-5.3'],
  ['superpowers-economic.md', 'xiaomi/mimo-v2.5'],
  ['superpowers-economic-fast.md', 'deepseek/deepseek-v4-flash'],
];

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-model-routing-'));
try {
  const missingArgs = runInstaller();
  assert.notEqual(missingArgs.status, 0, 'installer without arguments must fail');
  assert.match(`${missingArgs.stdout}\n${missingArgs.stderr}`, /--config-dir/, 'missing-argument error must mention --config-dir');

  const configDir = path.join(tempRoot, 'success-config');
  const success = runInstaller('--config-dir', configDir);
  assert.equal(success.status, 0, `expected successful install: ${success.stderr}`);

  for (const [name, model] of profiles) {
    const installed = path.join(configDir, 'agents', name);
    assert.ok(fs.existsSync(installed), `expected installed profile ${name}`);
    const content = fs.readFileSync(installed, 'utf8');
    assert.match(content, /^mode: all$/m, `${name} must set mode: all`);
    assert.match(content, new RegExp(`^model: ${escapeRegExp(model)}$`, 'm'), `${name} must set its exact model`);
    assert.match(content, /^description:\s*\S/m, `${name} must provide a nonempty description`);
  }

  const collisionConfig = path.join(tempRoot, 'collision-config');
  const collisionTarget = path.join(collisionConfig, 'agents', 'superpowers-expert.md');
  fs.mkdirSync(path.dirname(collisionTarget), { recursive: true });
  fs.writeFileSync(collisionTarget, 'user-owned\n');

  const collision = runInstaller('--config-dir', collisionConfig);
  assert.notEqual(collision.status, 0, 'installer must fail when a profile destination already exists');
  assert.equal(fs.readFileSync(collisionTarget, 'utf8'), 'user-owned\n', 'collision must preserve user-owned profile');
  for (const [name] of profiles.slice(1)) {
    assert.ok(!fs.existsSync(path.join(collisionConfig, 'agents', name)), `collision preflight must not copy ${name}`);
  }

  console.log('PASS: OpenCode model routing installer accepts only the documented interface and copies atomically');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

function runInstaller(...args) {
  return spawnSync(process.execPath, [installer, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
