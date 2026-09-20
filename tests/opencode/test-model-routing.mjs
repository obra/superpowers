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

  const danglingLinkConfig = path.join(tempRoot, 'dangling-link-config');
  const danglingLinkTarget = path.join(danglingLinkConfig, 'agents', 'superpowers-expert.md');
  fs.mkdirSync(path.dirname(danglingLinkTarget), { recursive: true });
  let danglingLinkSupported = true;
  try {
    fs.symlinkSync('missing-user-profile.md', danglingLinkTarget, 'file');
  } catch (error) {
    if (!['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) throw error;
    danglingLinkSupported = false;
  }
  if (danglingLinkSupported) {
    const danglingLink = runInstaller('--config-dir', danglingLinkConfig);
    assert.notEqual(danglingLink.status, 0, 'installer must reject a dangling destination symlink');
    assert.ok(fs.lstatSync(danglingLinkTarget).isSymbolicLink(), 'installer must preserve the dangling user-owned symlink');
    for (const [name] of profiles.slice(1)) {
      assert.ok(!fs.existsSync(path.join(danglingLinkConfig, 'agents', name)), `dangling-link preflight must not copy ${name}`);
    }
  }

  const writeCollisionConfig = path.join(tempRoot, 'write-collision-config');
  const writeCollisionTarget = path.join(writeCollisionConfig, 'agents', 'superpowers-expert.md');
  const hookPath = path.join(tempRoot, 'inject-write-collision.cjs');
  fs.writeFileSync(hookPath, `
const fs = require('node:fs');
const path = require('node:path');
const originalCopyFileSync = fs.copyFileSync;
let injected = false;
fs.copyFileSync = function(source, destination, mode) {
  if (!injected && path.basename(destination) === 'superpowers-expert.md') {
    fs.writeFileSync(destination, 'user-owned-at-write\\n');
    injected = true;
  }
  return originalCopyFileSync.call(this, source, destination, mode);
};
`);
  const writeCollision = runInstaller('--config-dir', writeCollisionConfig, {
    NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --require=${hookPath}`.trim(),
  });
  assert.notEqual(writeCollision.status, 0, 'installer must fail when a destination appears during copy');
  assert.equal(fs.readFileSync(writeCollisionTarget, 'utf8'), 'user-owned-at-write\n', 'exclusive copy must not overwrite a destination created during write');
  for (const [name] of profiles.slice(1)) {
    assert.ok(!fs.existsSync(path.join(writeCollisionConfig, 'agents', name)), `write collision must not copy ${name}`);
  }

  console.log('PASS: OpenCode model routing installer accepts only the documented interface and copies atomically');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

function runInstaller(...args) {
  let extraEnv = {};
  if (args.length > 0 && typeof args.at(-1) === 'object') extraEnv = args.pop();
  return spawnSync(process.execPath, [installer, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, ...extraEnv },
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
