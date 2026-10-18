const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn, execFile } = require('node:child_process');
const { promisify } = require('node:util');

const script = process.argv[2];
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ux-regressions-'));
const prefix = '<!doctype html><html lang="en"><head><title>Capture fixture</title>' +
  '<link rel="icon" href="data:,"><style>body{margin:0;background:white;color:#111;font-family:Arial}' +
  'button{width:120px;height:48px}</style></head><body>';
let label = 'A';
const srOnlyStyle = '<style>.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;' +
  'overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}</style>';
const pages = {
  '/clean': '<main><h1>Ready</h1></main>',
  '/crash': '<main>Loading</main><script>throw new Error("Application boot failed")</script>',
  '/font': '<p style="font-family:MissingReviewFont,Arial">Missing font</p>',
  '/loaded-font': '<p style="font-family:ReviewWebFont,Arial">Loaded font</p>' +
    '<script>const face = new FontFace("ReviewWebFont", "url(/font.ttf)");document.fonts.add(face);face.load();</script>',
  '/overlap': ['fixed', 'absolute', 'sticky'].map((position, i) =>
    `<section style="position:${position};top:${i * 200}px;width:200px">` +
    '<div style="height:50px;background:red">First</div>' +
    `<div id="overlap-${position}" style="height:50px;margin-top:-30px;background:blue">Second</div></section>`).join(''),
  '/keyboard': '<button id="open" onclick="modal.showModal()">Open</button>' +
    '<dialog id="modal"><button id="close" autofocus onclick="modal.close()">Close</button></dialog>',
  '/unreachable': '<button id="skipped" tabindex="-1">Skipped</button><button id="other">Other</button>',
  '/fill': '<label>Name<input id="name" oninput="document.getElementById(\'echo\').textContent=this.value"></label><p id="echo"></p>',
  // A grid-stacked link covering its whole card: the usual stretched-link layout.
  '/stretched': '<article style="display:grid;width:300px"><h2 id="card-title" style="grid-area:1/1;margin:0">Card title</h2>' +
    '<a id="card-link" href="#" style="grid-area:1/1;display:block"></a></article>',
  '/stretched-control': '<article style="display:grid;width:300px;height:60px">' +
    '<input id="card-input" style="grid-area:1/1;width:100px;height:40px"><a id="card-link" href="#" style="grid-area:1/1;display:block"></a></article>',
  ...Object.fromEntries([
    ['editor', '<div id="covered" contenteditable="true" style="grid-area:1/1;width:100px;height:40px">Edit</div>'],
    ['role-link', '<span id="covered" role="link" tabindex="0" style="grid-area:1/1;width:100px;height:40px">Go</span>'],
    ['summary', '<details style="grid-area:1/1"><summary id="covered" style="width:100px;height:40px">More</summary></details>'],
  ].map(([name, control]) => [`/stretched-${name}`, '<article style="display:grid;width:300px;height:60px">' + control +
    '<a id="card-link" href="#" style="grid-area:1/1;display:block"></a></article>'])),
  '/sr-only': srOnlyStyle + '<button>X<span class="sr-only">Close the dialog window</span></button>',
  '/clipped': '<span id="clipped" style="display:inline-block;width:40px;overflow:hidden;white-space:nowrap">A long clipped label</span>',
  '/sr-only-wide': srOnlyStyle + '<style>@media (min-width:1000px){.sr-only{position:static;display:inline-block;' +
    'width:40px;height:auto;margin:0;clip:auto}}</style><p><span class="sr-only">Visible only on wide screens</span></p>',
};
const server = http.createServer((req, res) => {
  if (req.url === '/font.ttf') {
    // Synthetic triangle glyph and space: no dependency on installed OS fonts.
    res.writeHead(200, { 'Content-Type': 'font/ttf' });
    res.end(fs.readFileSync(path.join(__dirname, 'fixtures/ux-capture/test-font.ttf')));
    return;
  }
  if (req.url === '/private') {
    res.writeHead(302, { Location: '/login' });
    res.end();
    return;
  }
  let body = pages[req.url] || '<main><h1>Sign in</h1></main>';
  if (req.url === '/label') body = `<button>${label}</button>`;
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(prefix + body + '</body></html>');
});

let runNumber = 0;
async function capture(overrides = {}, args = ['--smoke'], project = root) {
  const matrix = {
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    themes: ['light'], viewports: [{ width: 1440, height: 900, dpr: 1 }],
    pathways: [{ name: 'test', path: '/clean', steps: [{ name: 'open' }] }],
    ...overrides,
  };
  const out = path.join(root, `run-${++runNumber}`);
  const matrixFile = out + '.json';
  fs.writeFileSync(matrixFile, JSON.stringify(matrix));
  const child = spawn(process.execPath, [script, matrixFile, '--out', out, '--project-root', project, ...args]);
  let stderr = '';
  child.stderr.on('data', data => { stderr += data; });
  child.stdout.resume();
  const timer = setTimeout(() => child.kill('SIGKILL'), 45000);
  const code = await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', resolve);
  }).finally(() => clearTimeout(timer));
  const reportFile = path.join(out, 'mechanical.json');
  const entries = fs.existsSync(reportFile) ? JSON.parse(fs.readFileSync(reportFile)).captures : [];
  return { code, entries, checks: entries.flatMap(e => e.checks), stderr, out };
}
function pathway(route, steps = [{ name: 'open' }]) {
  return { pathways: [{ name: 'test', path: route, steps }] };
}
let failures = 0;
async function check(name, fn) {
  try { await fn(); console.log(`ok - ${name}`); }
  catch (error) { failures += 1; console.error(`not ok - ${name}: ${error.message}`); }
}

async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    await check('launcher works in CommonJS and ESM package scopes', async () => {
      for (const type of ['commonjs', 'module']) {
        const dir = path.join(root, type);
        fs.mkdirSync(dir);
        fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ type }));
        fs.copyFileSync(script, path.join(dir, 'ux-capture'));
        fs.copyFileSync(script + '.mjs', path.join(dir, 'ux-capture.mjs'));
        const r = await promisify(execFile)(process.execPath, [path.join(dir, 'ux-capture'), '--help']);
        assert(r.stdout.includes('Usage: ux-capture'), type);
      }
    });
    await check('empty dimensions and step lists cannot pass', async () => {
      for (const overrides of [{ themes: [] }, { viewports: [] }, pathway('/clean', [])]) {
        const r = await capture(overrides);
        assert.equal(r.code, 2, JSON.stringify(overrides));
      }
    });
    await check('missing configured auth cannot capture anonymously', async () => {
      const r = await capture({ ...pathway('/private'), storageState: 'missing.json' });
      assert.equal(r.code, 2);
      assert.equal(r.entries.length, 0);
    });
    await check('uncaught application errors are findings even without images', async () => {
      const r = await capture(pathway('/crash', [{ name: 'open', capture: false }]));
      assert.equal(r.code, 1);
      assert(r.checks.some(c => c.check === 'console-error' && c.message.includes('Application boot failed')));
      assert.equal(r.entries[0].files.still, null);
    });
    await check('overlap within fixed, absolute, and sticky containers is checked', async () => {
      const r = await capture(pathway('/overlap'));
      for (const position of ['fixed', 'absolute', 'sticky']) {
        assert(r.checks.some(c => c.check === 'overlap' && c.with === `DIV#overlap-${position}`), position);
      }
    });
    await check('a stretched link over a non-interactive title is suppressed, not reported', async () => {
      const r = await capture(pathway('/stretched'));
      assert.deepEqual(r.checks, []);
      assert.deepEqual(r.entries[0].suppressed, [
        { check: 'overlap', selector: 'H2#card-title', with: 'A#card-link', reason: 'covered by a stretched link or button' },
      ]);
    });
    await check('a stretched link over an interactive control is still an overlap', async () => {
      const r = await capture(pathway('/stretched-control'));
      assert(r.checks.some(c => c.check === 'overlap' && c.selector === 'INPUT#card-input' && c.with === 'A#card-link'),
        JSON.stringify(r.checks));
    });
    await check('a stretched link over editable, focusable, or native controls is still an overlap', async () => {
      const missed = [];
      for (const name of ['editor', 'role-link', 'summary']) {
        const r = await capture(pathway(`/stretched-${name}`));
        if (!r.checks.some(c => c.check === 'overlap' && /#covered/.test(c.selector) && c.with === 'A#card-link')) missed.push(name);
      }
      assert.deepEqual(missed, []);
    });
    await check('screen-reader-only text inside a button is not a finding', async () => {
      const r = await capture(pathway('/sr-only'));
      assert.deepEqual(r.checks, []);
    });
    await check('visibly clipped text that is not screen-reader-only is a finding', async () => {
      const r = await capture(pathway('/clipped'));
      assert(r.checks.some(c => c.check === 'clipped-text' && c.selector === 'SPAN#clipped'), JSON.stringify(r.checks));
    });
    await check('screen-reader-only text made visible at a wider width is checked there', async () => {
      const r = await capture({
        ...pathway('/sr-only-wide'),
        viewports: [{ width: 375, height: 812, dpr: 1 }, { width: 1440, height: 900, dpr: 1 }],
      }, []);
      const clippedAt = r.entries.filter(e => e.checks.some(c => c.check === 'clipped-text')).map(e => e.width);
      assert.deepEqual(clippedAt, [1440], JSON.stringify(r.checks));
    });
    await check('a missing required web font is detected', async () => {
      const r = await capture({ ...pathway('/font'), fonts: ['MissingReviewFont'] });
      assert.equal(r.code, 1);
      assert(r.checks.some(c => c.check === 'font-fallback'));
    });
    await check('a loaded declared web font passes', async () => {
      const r = await capture({ ...pathway('/loaded-font'), fonts: ['ReviewWebFont'] });
      assert.equal(r.code, 0, r.stderr + JSON.stringify(r.checks));
    });
    await check('Tab, Enter and Escape work without an image for each key', async () => {
      const r = await capture(pathway('/keyboard', [
        { name: 'tab', action: 'press', key: 'Tab', expectFocus: '#open', capture: false },
        { name: 'activate', action: 'press', key: 'Enter', waitFor: 'dialog[open]', expectFocus: '#close', capture: false },
        { name: 'dismiss', action: 'press', key: 'Escape', expectFocus: '#open' },
      ]));
      assert.equal(r.code, 0, r.stderr + JSON.stringify(r.checks));
      assert.deepEqual(r.entries.map(e => Boolean(e.files.still)), [false, false, true]);
      assert.equal(fs.readdirSync(r.out).filter(f => f.endsWith('.png')).length, 1);
    });
    await check('Tab cannot falsely prove reachability of a skipped control', async () => {
      const r = await capture(pathway('/unreachable', [
        { name: 'tab', action: 'press', key: 'Tab', expectFocus: '#skipped', capture: false },
      ]));
      assert.equal(r.code, 1);
      assert(r.checks.some(c => c.check === 'step-failed' && c.message.includes('focus')));
    });
    await check('form input can establish a state before capture', async () => {
      const r = await capture(pathway('/fill', [
        { name: 'type', action: 'fill', selector: '#name', value: 'Ada', waitFor: 'text=Ada' },
      ]));
      assert.equal(r.code, 0, r.stderr + JSON.stringify(r.checks));
    });
    await check('one-character label changes remain reviewable', async () => {
      const baseline = await capture(pathway('/label'), []);
      label = 'B';
      const r = await capture(pathway('/label'), ['--baseline', baseline.out]);
      assert.equal(r.code, 0, r.stderr);
      assert.equal(r.entries[0].diff.status, 'changed');
      assert(r.entries[0].diff.ratio > 0 && r.entries[0].diff.ratio < 0.001);
      assert(fs.existsSync(path.join(r.out, r.entries[0].files.diffCrop)));
    });
    await check('corrupt baseline images produce blockers', async () => {
      const baseline = await capture();
      fs.writeFileSync(path.join(baseline.out, baseline.entries[0].files.still), 'invalid PNG');
      const r = await capture({}, ['--baseline', baseline.out]);
      assert.equal(r.code, 1);
      assert(r.checks.some(c => c.check === 'capture-failed' && c.severity === 'blocker'));
    });
    await check('failed requested crops produce blockers', async () => {
      const r = await capture(pathway('/clean', [{ name: 'open', crops: ['['] }]));
      assert.equal(r.code, 1);
      assert(r.checks.some(c => c.check === 'capture-failed' && c.severity === 'blocker'));
    });
    await check('every requested pathway must exist', async () => {
      const r = await capture({}, ['--smoke', '--pathway', 'test', '--pathway', 'typo']);
      assert.equal(r.code, 2);
    });
    await check('an installed scanner failure cannot count as a clean scan', async () => {
      const project = path.join(root, 'axe-project');
      const stub = path.join(project, 'node_modules/@axe-core/playwright');
      fs.mkdirSync(stub, { recursive: true });
      fs.writeFileSync(path.join(stub, 'package.json'), JSON.stringify({ name: '@axe-core/playwright', main: 'index.js' }));
      fs.writeFileSync(path.join(stub, 'index.js'), 'exports.AxeBuilder=class {async analyze(){throw new Error("scan failed");}};');
      const r = await capture({}, [], project);
      assert.equal(r.code, 1);
      assert.equal(r.entries[0].axe, 'error');
      assert(r.checks.some(c => c.check === 'axe-error' && c.severity === 'blocker'));
      fs.writeFileSync(path.join(stub, 'index.js'), 'throw new Error("installed scanner cannot load");');
      const failedLoad = await capture({}, [], project);
      assert.equal(failedLoad.code, 2);
      assert(failedLoad.stderr.includes('installed scanner cannot load'));
    });
  } finally {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(root, { recursive: true, force: true });
  }
  if (failures) process.exitCode = 1;
  else console.log('PASS');
}
main().catch(error => { console.error(error); process.exitCode = 1; server.close(); });
