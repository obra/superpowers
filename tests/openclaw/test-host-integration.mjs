import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const openclawRoot = process.env.OPENCLAW_ROOT;

test('OpenClaw loads the plugin and puts the full bootstrap into a clean session context', {
  skip: !openclawRoot && 'Set OPENCLAW_ROOT to an OpenClaw source checkout to run this integration test',
}, async () => {
  const stateDir = await mkdtemp(join(tmpdir(), 'superpowers-openclaw-'));
  const workspaceDir = join(stateDir, 'workspace');
  const probe = resolve(root, 'tests/openclaw/host-probe.js');
  const loader = resolve(openclawRoot, 'scripts/tsx.mjs');
  const result = spawnSync(process.execPath, [
    '--import', pathToFileURL(loader).href, probe, openclawRoot, root, workspaceDir,
  ], {
    cwd: openclawRoot,
    env: { ...process.env, OPENCLAW_STATE_DIR: stateDir },
    encoding: 'utf8',
    timeout: 120_000,
    maxBuffer: 4 * 1024 * 1024,
  });

  assert.equal(result.status, 0, result.stderr || result.error?.message);
  const output = JSON.parse(result.stdout);
  assert.equal(output.plugin.format, 'openclaw');
  assert.equal(output.plugin.status, 'loaded');
  assert.ok(output.plugin.hookNames.includes('superpowers-bootstrap'));

  const bootstrap = output.contextFiles.find((file) =>
    file.content?.includes('Invoke relevant or requested skills BEFORE any response or action'));
  assert.ok(bootstrap, 'the actual OpenClaw context builder must contain using-superpowers');
  assert.match(bootstrap.content, /brainstorming first, then implementation skills/);
  assert.match(bootstrap.content, /OpenClaw tool mapping/);
});
