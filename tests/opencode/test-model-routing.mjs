import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..', '..');
const installer = path.join(repoRoot, 'scripts', 'install-opencode-model-routing.mjs');
const profiles = [
  ['superpowers-expert.md', 'zai-org/GLM-5.3'],
  ['superpowers-main.md', 'z-ai/glm-5.3-flash'],
  ['superpowers-economic.md', 'xiaomi/mimo-v2.5'],
  ['superpowers-economic-fast.md', 'deepseek/deepseek-v4-flash'],
];
const openCodeGuides = [
  '.opencode/INSTALL.md',
  'docs/README.opencode.md',
];
const { V1_MAPPING, V2_MAPPING } = await import(pathToFileURL(path.join(repoRoot, '.opencode/plugins/superpowers.js')).href);

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-model-routing-'));
try {
  for (const args of [
    ['--config-dir', '--config-dir'],
    ['--config-dir', '--help'],
    ['--config-dir', '-x'],
    ['--config-dir', 'first', '--config-dir', 'second'],
    ['--config-dir'],
    ['--config-dir', ''],
    ['positional'],
    ['--config-dir', 'first', 'positional'],
  ]) {
    const invalid = runInstaller(...args);
    assert.notEqual(invalid.status, 0, `installer must reject ${JSON.stringify(args)}`);
    assert.match(invalid.stderr, /Usage:.*--config-dir/, 'invalid arguments must print usage');
    assert.deepEqual(fs.readdirSync(tempRoot), [], 'invalid arguments must not create files or directories');
  }

  for (const guidePath of openCodeGuides) {
    const guide = fs.readFileSync(path.join(repoRoot, guidePath), 'utf8');
    for (const requiredText of [
      'install-opencode-model-routing.mjs',
      'opencode models',
    ]) {
      assert.match(guide, new RegExp(escapeRegExp(requiredText)), `${guidePath} must document ${requiredText}`);
    }
    for (const [name, model] of profiles) {
      assert.match(
        guide,
        new RegExp('`' + escapeRegExp(name.replace(/\.md$/, '')) + '`[^\\n]*`' + escapeRegExp(model) + '`'),
        `${guidePath} must document the exact ${name} role/model pair`,
      );
    }
    assert.match(
      guide,
      /does not modify `opencode\.json` or `opencode\.jsonc`/,
      `${guidePath} must state that the installer does not modify either config file`,
    );
    assert.match(guide, /checked-out fork directory/, `${guidePath} must identify the installer checkout`);
    assert.match(guide, /```powershell\s+node \.\\scripts\\install-opencode-model-routing\.mjs --config-dir "\$HOME\\\.config\\opencode"/, `${guidePath} must provide a checkout-relative PowerShell command`);
    assert.match(guide, /```bash\s+node \.\/scripts\/install-opencode-model-routing\.mjs --config-dir "\$HOME\/\.config\/opencode"/, `${guidePath} must provide a checkout-relative POSIX command`);
    assert.doesNotMatch(guide, /node_modules[\\/]superpowers[\\/]scripts[\\/]install-opencode-model-routing/, `${guidePath} must not assume a plugin-manager node_modules location`);
    assert.match(guide, /new (?:MAIN )?session[\s\S]{0,150}opencode run --model z-ai\/glm-5\.3-flash/, `${guidePath} must show explicit MAIN session model selection`);
    assert.match(guide, /root `model`[\s\S]{0,150}z-ai\/glm-5\.3-flash/, `${guidePath} must document the root model alternative`);
    assert.match(guide, /(?:Switching|Changing)[\s\S]{0,60}existing session[\s\S]{0,60}agent[\s\S]{0,60}does not change[\s\S]{0,60}model/, `${guidePath} must distinguish primary-agent changes from session model selection`);
    assert.match(guide, /unavailable[\s\S]{0,100}falls back to\s+`general`/, `${guidePath} must document general fallback`);
    assert.match(
      guide,
      /remove only the four (?:copied|installed) profiles/,
      `${guidePath} must limit removal to the four installed profiles`,
    );
    for (const [name] of profiles) {
      assert.match(guide, new RegExp('`agents/' + escapeRegExp(name) + '`'), `${guidePath} must name the exact removal target ${name}`);
    }
    assert.doesNotMatch(guide, /rm[^\n]*superpowers-[^\n]*\*/, `${guidePath} must not use a broad routing-profile removal glob`);
  }

  for (const role of [
    'superpowers-expert',
    'superpowers-main',
    'superpowers-economic',
    'superpowers-economic-fast',
    'architecture',
    'implementation',
    'exploration',
    'general',
  ]) {
    assert.match(V2_MAPPING, new RegExp(escapeRegExp(role)), `V2 routing must include ${role}`);
  }
  assert.match(V2_MAPPING, /only when it is available in the subagent catalog/, 'V2 routing must require catalog availability');
  assert.match(V2_MAPPING, /If the needed role is unavailable, invoke `subagent` with `agent: "general"`/, 'V2 routing must use the general agent when a role is missing');
  assert.match(V2_MAPPING, /state that model-role routing is not installed/, 'V2 routing must disclose missing installation');
  assert.match(V1_MAPPING, /`task` with `subagent_type: "general"`/, 'V1 routing must retain the general task mapping');
  assert.doesNotMatch(V1_MAPPING, /superpowers-expert/, 'V1 routing must not include V2 model profiles');

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

  console.log('PASS: OpenCode model routing validates its interface, profiles, bootstrap, and guides without overwriting user files');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

function runInstaller(...args) {
  let extraEnv = {};
  if (args.length > 0 && typeof args.at(-1) === 'object') extraEnv = args.pop();
  return spawnSync(process.execPath, [installer, ...args], {
    cwd: tempRoot,
    encoding: 'utf8',
    env: { ...process.env, ...extraEnv },
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
