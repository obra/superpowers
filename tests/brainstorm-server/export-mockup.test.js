/**
 * Tests for export-mockup.cjs — the design-lock export script.
 *
 * The export wraps a winner-only mockup fragment with the frame template's
 * CSS into a self-contained static artifact: no helper script, no WebSocket
 * code, no connection chrome, no external references added by the frame.
 */

const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const SCRIPTS_DIR = path.join(__dirname, '../../skills/brainstorming/scripts');
const SH_PATH = path.join(SCRIPTS_DIR, 'export-mockup.sh');
const { exportMockup, isFullDocument, escapeHtmlText } = require(
  path.join(SCRIPTS_DIR, 'export-mockup.cjs')
);
const TEST_DIR = '/tmp/brainstorm-export-test';

function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true });
  }
}

function main() {
  cleanup();
  fs.mkdirSync(TEST_DIR, { recursive: true });

  const fragment = '<h2>Dashboard</h2><div class="mockup"><div class="mockup-body">cards-here</div></div>';

  // --- exportMockup(): wrapping behavior ---

  const out = exportMockup(fragment, { title: 'Dashboard' });
  assert.ok(out.includes('cards-here'), 'output contains the fragment');
  assert.ok(out.trimStart().startsWith('<!DOCTYPE html>'), 'output is a full document');
  assert.ok(out.includes('--bg-primary'), 'output inlines the frame theme CSS');
  assert.ok(!out.includes('<!-- CONTENT -->'), 'content placeholder replaced');
  assert.ok(!out.includes('<!-- BRANDING -->'), 'branding placeholder replaced');
  console.log('ok - wraps fragment with frame CSS');

  assert.ok(!out.includes('<script'), 'no scripts in artifact');
  assert.ok(!out.includes('WebSocket'), 'no WebSocket code in artifact');
  assert.ok(!out.includes('Connecting'), 'no connection status in artifact');
  console.log('ok - omits helper and connection chrome');

  assert.ok(!out.includes('<img'), 'no remote brand image tag');
  assert.ok(!out.includes('primeradiant.com'), 'no external brand URL');
  assert.ok(!out.includes('href="https://github.com'), 'no upstream repo link');
  assert.ok(out.includes('Dashboard — locked design'), 'artifact labeled with title');
  console.log('ok - self-contained: no external references added by frame');

  const escaped = exportMockup(fragment, { title: 'A<B>&"C' });
  assert.ok(escaped.includes('A&lt;B&gt;&amp;&quot;C'), 'title is HTML-escaped');
  console.log('ok - escapes title');

  const fullDoc = '<!DOCTYPE html><html><body>standalone</body></html>';
  assert.strictEqual(exportMockup(fullDoc, { title: 'x' }), fullDoc,
    'full documents pass through unchanged');
  assert.ok(isFullDocument('  <!doctype html>'), 'isFullDocument: doctype');
  assert.ok(isFullDocument('<HTML>'), 'isFullDocument: html tag');
  assert.ok(!isFullDocument('<h2>hi</h2>'), 'isFullDocument: fragment');
  console.log('ok - full documents pass through unchanged');

  assert.strictEqual(escapeHtmlText('a&b'), 'a&amp;b', 'escapeHtmlText basic');
  console.log('ok - escapeHtmlText');

  // --- CLI behavior via the .sh entry point ---

  const fragmentFile = path.join(TEST_DIR, 'dashboard-final.html');
  fs.writeFileSync(fragmentFile, fragment);
  const outputFile = path.join(TEST_DIR, 'assets/2026-07-10-demo/dashboard.html');

  const stdout = execFileSync(SH_PATH, [fragmentFile, outputFile, '--title', 'Dashboard'], {
    encoding: 'utf-8',
  });
  const info = JSON.parse(stdout);
  assert.strictEqual(info.type, 'mockup-exported', 'CLI prints mockup-exported JSON');
  assert.strictEqual(info.output, outputFile, 'CLI reports absolute output path');
  const written = fs.readFileSync(outputFile, 'utf-8');
  assert.ok(written.includes('cards-here'), 'CLI wrote the wrapped artifact');
  assert.ok(written.includes('Dashboard — locked design'), 'CLI passed --title through');
  console.log('ok - CLI exports and creates parent directories');

  const defaultTitle = path.join(TEST_DIR, 'assets/2026-07-10-demo/settings.html');
  execFileSync(SH_PATH, [fragmentFile, defaultTitle], { encoding: 'utf-8' });
  assert.ok(fs.readFileSync(defaultTitle, 'utf-8').includes('settings — locked design'),
    'CLI defaults title to output basename');
  console.log('ok - CLI defaults title to output basename');

  const noArgs = spawnSync(SH_PATH, [], { encoding: 'utf-8' });
  assert.notStrictEqual(noArgs.status, 0, 'missing args exit non-zero');
  assert.ok(noArgs.stderr.includes('usage:'), 'missing args print usage');
  const noInput = spawnSync(SH_PATH, [path.join(TEST_DIR, 'nope.html'), outputFile], {
    encoding: 'utf-8',
  });
  assert.notStrictEqual(noInput.status, 0, 'missing input exits non-zero');
  assert.ok(noInput.stderr.includes('not found'), 'missing input names the problem');
  console.log('ok - CLI errors on bad usage and missing input');

  cleanup();
  console.log('export-mockup tests passed');
}

main();
