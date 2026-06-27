/**
 * Tests for the visual companion's Superpowers/Prime Radiant branding.
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const REPO_ROOT = path.join(__dirname, '../..');
const SERVER_PATH = path.join(REPO_ROOT, 'skills/brainstorming/scripts/server.cjs');
const PACKAGE_VERSION = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf-8')
).version;
const TOKEN = 'testtoken-branding-0123456789abcdef';
const ASSET_URL = 'https://primeradiant.com/brand/superpowers-visual-brainstorming-logo.png';

function cleanup(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true });
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function startServer({ port, dir, env = {}, serverPath = SERVER_PATH }) {
  cleanup(dir);
  return spawn('node', [serverPath], {
    env: {
      ...process.env,
      BRAINSTORM_PORT: String(port),
      BRAINSTORM_DIR: dir,
      BRAINSTORM_TOKEN: TOKEN,
      ...env
    }
  });
}

function waitForServer(server) {
  let stdout = '';
  let stderr = '';

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Server did not start. stderr: ${stderr}`)), 5000);
    server.stdout.on('data', (data) => {
      stdout += data.toString();
      if (stdout.includes('server-started')) {
        clearTimeout(timeout);
        resolve();
      }
    });
    server.stderr.on('data', (data) => { stderr += data.toString(); });
    server.on('error', reject);
  });
}

function fetchHtml(port) {
  return new Promise((resolve, reject) => {
    const headers = { Cookie: `brainstorm-key-${port}=${TOKEN}` };
    http.get(`http://localhost:${port}/`, { headers }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

function writeFragment(dir) {
  const contentDir = path.join(dir, 'content');
  fs.mkdirSync(contentDir, { recursive: true });
  fs.writeFileSync(path.join(contentDir, 'screen.html'), '<h2>Pick a layout</h2>');
}

function createPackagedServerFixture(version) {
  const root = fs.mkdtempSync(path.join('/tmp', 'superpowers-packaged-server-'));
  const scriptDir = path.join(root, 'skills/brainstorming/scripts');
  fs.cpSync(path.join(REPO_ROOT, 'skills/brainstorming/scripts'), scriptDir, { recursive: true });
  fs.mkdirSync(path.join(root, '.codex-plugin'), { recursive: true });
  fs.writeFileSync(
    path.join(root, '.codex-plugin/plugin.json'),
    JSON.stringify({ name: 'superpowers', version }, null, 2)
  );
  return {
    root,
    serverPath: path.join(scriptDir, 'server.cjs')
  };
}

async function withServer(options, fn) {
  const server = startServer(options);
  try {
    await waitForServer(server);
    await fn();
  } finally {
    if (server.exitCode === null && server.signalCode === null) {
      server.kill();
      await new Promise(resolve => server.once('exit', resolve));
    }
    await sleep(100);
    cleanup(options.dir);
  }
}

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  PASS: ${name}`);
    passed++;
  } catch (e) {
    console.log(`  FAIL: ${name}`);
    console.log(`    ${e.message}`);
    failed++;
  }
}

function assertBrandedWithLogo(html, version = PACKAGE_VERSION) {
  assert(
    html.includes(`Superpowers v${version}`),
    'branding text should include dynamic package version'
  );
  assert(
    !html.includes(`Superpowers v${version} by`),
    'branding text should not include "by" when the logo is visible'
  );
  assert(
    /<img class="brand-logo"[^>]*>\s*<span class="brand-copy">Superpowers v/.test(html),
    'visible logo should appear before the Superpowers version text'
  );
  assert(
    /\.brand a\s*\{[^}]*line-height:\s*1/i.test(html),
    'brand row should align the logo and version text by their visual height'
  );
  assert(
    /\.brand a\s*\{[^}]*gap:\s*0\.5rem/i.test(html),
    'brand row should keep the logo and version text close together'
  );
  assert(
    /\.brand a\s*\{[^}]*max-width:\s*100%/i.test(html),
    'brand link should be constrained so it cannot overlap the status column'
  );
  assert(
    /\.brand\s*\{[^}]*line-height:\s*1/i.test(html),
    'brand wrapper should not inherit the page line height'
  );
  assert(
    /\.brand\s*\{[^}]*overflow:\s*hidden/i.test(html),
    'brand wrapper should clip before it reaches the status column'
  );
}

function assertBrandedFallbackText(html, version = PACKAGE_VERSION) {
  assert(
    html.includes(`Prime Radiant Superpowers v${version}`),
    'disabled telemetry should keep plain text Prime Radiant/Superpowers branding'
  );
}

function assertTelemetryImage(html, version = PACKAGE_VERSION) {
  const expectedUrl = `${ASSET_URL}?v=${encodeURIComponent(version)}`;
  assert(html.includes(`src="${expectedUrl}"`), 'remote image should use the dedicated main-domain asset with only v=');
  assert(!html.includes('event='), 'remote image URL must not include event=');
  assert(!html.includes('surface='), 'remote image URL must not include surface=');
  assert(!html.includes('launch_id='), 'remote image URL must not include launch_id=');
  assert(!html.includes('lid='), 'remote image URL must not include lid=');
}

function assertLogoKeepsTransparentBackground(html) {
  assert(
    /\.brand-logo\s*\{[^}]*height:\s*1em/i.test(html),
    'logo should match the surrounding brand text size'
  );
  assert(
    /\.brand-logo\s*\{[^}]*display:\s*block/i.test(html),
    'logo should not reserve inline-image descender space'
  );
  assert(
    /\.brand-copy\s*\{[^}]*line-height:\s*1/i.test(html),
    'version text should use the same compact line height as the logo'
  );
  assert(
    /\.brand-copy\s*\{[^}]*min-width:\s*0/i.test(html),
    'version text should be allowed to shrink inside the brand row'
  );
  assert(
    /\.brand-copy\s*\{[^}]*transform:\s*translateY\(-1px\)/i.test(html),
    'version text should compensate for bottom padding inside the logo asset'
  );
  assert(
    /\.brand-logo\s*\{[^}]*filter:\s*invert\(1\)/i.test(html),
    'white logo asset should invert on light backgrounds'
  );
  assert(
    !/\.brand-logo\s*\{[^}]*background:/i.test(html),
    'logo should keep its transparent background'
  );
  assert(
    !/\.brand-logo\s*\{[^}]*padding:/i.test(html),
    'logo should not rely on a padded backing'
  );
}

function assertFramedLogoSupportsDarkTheme(html) {
  assert(
    /@media\s*\(prefers-color-scheme:\s*dark\)[\s\S]*\.brand-logo\s*\{[^}]*filter:\s*none/i.test(html),
    'framed screens should leave the white logo unfiltered in dark mode'
  );
}

function assertFramedScreenUsesBrandHeader(html) {
  const logoCount = (html.match(/class="brand-logo"/g) || []).length;
  assert.strictEqual(logoCount, 1, 'framed screens should render the logo only in the header');
  assert(!html.includes('<div class="indicator-bar">'), 'framed screens should not render footer chrome');
  assert(
    /<div class="header">[\s\S]*<div class="brand">[\s\S]*<div class="status">Connecting…<\/div>/.test(html),
    'header should contain branding and connection status'
  );
  assert(!html.includes('id="indicator-text"'), 'header should not render the selection indicator text');
  assert(!html.includes('Click an option above'), 'header should not render the selection instruction');
}

function assertHeaderAvoidsNarrowOverlap(html) {
  assert(
    /grid-template-columns:\s*minmax\(0,\s*1fr\)\s*auto/i.test(html),
    'header should allocate shrinkable space to branding before the status column'
  );
  assert(
    /\.header \.status\s*\{[^}]*grid-column:\s*2/i.test(html),
    'status should live in the final fixed-width grid column'
  );
  assert(
    /\.header \.brand\s*\{[^}]*width:\s*100%/i.test(html),
    'header brand should fill its grid track so overflow clipping prevents overlap'
  );
}

async function main() {
  console.log('\n--- Visual Companion Branding ---');

  await test('framed screens render versioned Prime Radiant logo by default', async () => {
    const port = 3451;
    const dir = '/tmp/brainstorm-branding-default';
    await withServer({ port, dir }, async () => {
      writeFragment(dir);
      await sleep(300);
      const html = await fetchHtml(port);
      assertBrandedWithLogo(html);
      assertTelemetryImage(html);
      assertLogoKeepsTransparentBackground(html);
      assertFramedLogoSupportsDarkTheme(html);
      assertFramedScreenUsesBrandHeader(html);
      assertHeaderAvoidsNarrowOverlap(html);
    });
  });

  await test('waiting screen renders versioned Prime Radiant logo by default', async () => {
    const port = 3452;
    const dir = '/tmp/brainstorm-branding-waiting';
    await withServer({ port, dir }, async () => {
      const html = await fetchHtml(port);
      assert(html.includes('Waiting for the agent'), 'waiting page should still render');
      assertBrandedWithLogo(html);
      assertTelemetryImage(html);
      assertLogoKeepsTransparentBackground(html);
    });
  });

  await test('packaged Codex plugin reads version from .codex-plugin manifest', async () => {
    const port = 3457;
    const dir = '/tmp/brainstorm-branding-packaged-codex';
    const packagedVersion = '7.8.9';
    const fixture = createPackagedServerFixture(packagedVersion);

    try {
      await withServer({ port, dir, serverPath: fixture.serverPath }, async () => {
        writeFragment(dir);
        await sleep(300);
        const html = await fetchHtml(port);
        assertBrandedWithLogo(html, packagedVersion);
        assertTelemetryImage(html, packagedVersion);
        assert(!html.includes('Superpowers vunknown'), 'packaged plugin should not fall back to unknown version');
      });
    } finally {
      cleanup(fixture.root);
    }
  });

  await test('SUPERPOWERS_DISABLE_TELEMETRY=true omits remote image but keeps local branding', async () => {
    const port = 3453;
    const dir = '/tmp/brainstorm-branding-disabled';
    await withServer({ port, dir, env: { SUPERPOWERS_DISABLE_TELEMETRY: 'true' } }, async () => {
      writeFragment(dir);
      await sleep(300);
      const html = await fetchHtml(port);
      assertBrandedFallbackText(html);
      assert(!html.includes(ASSET_URL), 'disabled telemetry should omit the remote image');
    });
  });

  await test('SUPERPOWERS_DISABLE_TELEMETRY=yes also omits the remote image on the waiting screen', async () => {
    const port = 3454;
    const dir = '/tmp/brainstorm-branding-disabled-waiting';
    await withServer({ port, dir, env: { SUPERPOWERS_DISABLE_TELEMETRY: 'yes' } }, async () => {
      const html = await fetchHtml(port);
      assertBrandedFallbackText(html);
      assert(!html.includes(ASSET_URL), 'disabled telemetry should omit the remote image');
    });
  });

  await test('DISABLE_TELEMETRY=true omits remote image for Claude Code telemetry opt-out', async () => {
    const port = 3455;
    const dir = '/tmp/brainstorm-branding-claude-disable-telemetry';
    await withServer({ port, dir, env: { DISABLE_TELEMETRY: 'true' } }, async () => {
      writeFragment(dir);
      await sleep(300);
      const html = await fetchHtml(port);
      assertBrandedFallbackText(html);
      assert(!html.includes(ASSET_URL), 'Claude Code telemetry opt-out should omit the remote image');
    });
  });

  await test('CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 omits remote image for Claude Code traffic opt-out', async () => {
    const port = 3456;
    const dir = '/tmp/brainstorm-branding-claude-disable-nonessential';
    await withServer({ port, dir, env: { CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1' } }, async () => {
      const html = await fetchHtml(port);
      assertBrandedFallbackText(html);
      assert(!html.includes(ASSET_URL), 'Claude Code non-essential traffic opt-out should omit the remote image');
    });
  });

  console.log(`\n--- Results: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
