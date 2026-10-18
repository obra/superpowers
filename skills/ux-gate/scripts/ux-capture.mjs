#!/usr/bin/env node
// ux-capture — scripted UX capture: stills, crops, mechanical checks.
// Playwright is resolved from the consuming project, never from this plugin.

import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const USAGE = `Usage: ux-capture <matrix.json> --out <dir> [options]

  --out <dir>            Directory for stills, crops and mechanical.json (required)
  --project-root <dir>   Project the run belongs to; where 'playwright' and
                         storageState resolve from (default: cwd)
  --smoke                First viewport only, no reference screens, no axe,
                         no filmstrips
  --pathway <name>       Capture only this pathway (repeatable)
  --baseline <dir>       Baseline stills to diff against (ignored with --smoke)
  --video                Record a local video of each pathway context (not the
                         crop, filmstrip or reduced-motion contexts)
  --help                 Print this message

Matrix fields and examples: ../matrix.md (relative to this script).
Exit codes: 0 clean, 1 findings at 'should' or above, 2 cannot run.`;

const PLAYWRIGHT_HELP =
  "ux-capture: cannot resolve 'playwright'. Install it in the project " +
  '(npm i -D playwright) or set PLAYWRIGHT_MODULE=/path/to/node_modules/playwright';

const CONTROL_SELECTOR = 'button, a[href], [role=button], input, select, textarea';
// Anything a person can click, type into, or focus: a stretched link must not cover it.
const INTERACTIVE_SELECTOR = `${CONTROL_SELECTOR}, summary, label, [contenteditable]:not([contenteditable=false]), ` +
  '[tabindex]:not([tabindex^="-"]), [role=link], [role=checkbox], [role=radio], [role=switch], [role=tab], ' +
  '[role=menuitem], [role=option], [role=slider], [role=textbox], [role=combobox]';
const DEFAULT_VIEWPORTS = [
  { name: 'sm', width: 375, height: 812, dpr: 2 },
  { name: 'md', width: 768, height: 1024, dpr: 1 },
  { name: 'lg', width: 1440, height: 900, dpr: 1 },
];
const WAIT_TIMEOUT = 15000;
// A pixel counts as changed when a channel differs by more than this.
const DIFF_TOLERANCE = 8;
// Filmstrip frames, in ms after the action returns, plus the reduced-motion frame.
const MOTION_DELAYS = [0, 150, 400];
const DIFF_CROP_PADDING = 24;

function die(message, code) {
  console.error(message);
  process.exit(code);
}

// ---------------------------------------------------------------- arguments

function parseArgs(argv) {
  const opts = {
    matrix: null,
    out: null,
    projectRoot: process.cwd(),
    smoke: false,
    pathways: [],
    baseline: null,
    video: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      i += 1;
      if (i >= argv.length) die(`ux-capture: ${arg} needs a value`, 2);
      return argv[i];
    };
    if (arg === '--help' || arg === '-h') opts.help = true;
    else if (arg === '--out') opts.out = next();
    else if (arg === '--project-root') opts.projectRoot = next();
    else if (arg === '--smoke') opts.smoke = true;
    else if (arg === '--pathway') opts.pathways.push(next());
    else if (arg === '--baseline') opts.baseline = next();
    else if (arg === '--video') opts.video = true;
    else if (arg.startsWith('-')) die(`ux-capture: unknown option ${arg}\n\n${USAGE}`, 2);
    else if (opts.matrix === null) opts.matrix = arg;
    else die(`ux-capture: unexpected argument ${arg}\n\n${USAGE}`, 2);
  }
  return opts;
}

// --------------------------------------------------------------- playwright

function moduleEntry(target) {
  let info;
  try {
    info = statSync(target);
  } catch {
    return null;
  }
  if (!info.isDirectory()) return target;
  let entry = 'index.js';
  try {
    const pkg = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'));
    const dot = pkg.exports && pkg.exports['.'];
    const fromExports = typeof dot === 'string' ? dot : dot && (dot.import || dot.default);
    entry = fromExports || pkg.main || 'index.js';
  } catch {
    /* fall back to index.js */
  }
  return join(target, entry);
}

async function resolvePlaywright(projectRoot) {
  const candidates = [];
  if (process.env.PLAYWRIGHT_MODULE) {
    const entry = moduleEntry(process.env.PLAYWRIGHT_MODULE);
    if (entry) candidates.push(entry);
  } else {
    try {
      const req = createRequire(join(projectRoot, 'package.json'));
      candidates.push(req.resolve('playwright'));
    } catch {
      /* nothing to add */
    }
  }
  for (const candidate of candidates) {
    try {
      const mod = await import(pathToFileURL(candidate).href);
      const chromium = mod.chromium || (mod.default && mod.default.chromium);
      if (chromium) return chromium;
    } catch (err) {
      die(`ux-capture: failed to load playwright from ${candidate}: ${err.message}`, 2);
    }
  }
  return null;
}

// ------------------------------------------------------------------- matrix

function loadMatrix(path) {
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch (err) {
    die(`ux-capture: cannot read matrix ${path}: ${err.message}`, 2);
  }
  let matrix;
  try {
    matrix = JSON.parse(raw);
  } catch (err) {
    die(`ux-capture: matrix ${path} is not valid JSON: ${err.message}`, 2);
  }
  const require_ = (condition, message) => {
    if (!condition) die(`ux-capture: invalid matrix: ${message}`, 2);
  };
  require_(matrix && typeof matrix === 'object' && !Array.isArray(matrix), 'expected an object');
  if (!matrix.baseUrl) die(`ux-capture: matrix ${path} has no baseUrl`, 2);
  if (!Array.isArray(matrix.pathways) || matrix.pathways.length === 0) {
    die(`ux-capture: matrix ${path} has no pathways`, 2);
  }
  matrix.themes = matrix.themes || ['light', 'dark'];
  matrix.viewports = matrix.viewports || DEFAULT_VIEWPORTS;
  matrix.theme = matrix.theme || { mode: 'media', target: 'html', key: 'theme', values: {} };
  matrix.fonts = matrix.fonts || [];
  matrix.allowOverflow = matrix.allowOverflow || [];
  matrix.allowOverlap = matrix.allowOverlap || [];
  matrix.allowLight = matrix.allowLight || [];
  matrix.referenceScreens = matrix.referenceScreens || [];
  for (const field of ['themes', 'viewports']) {
    require_(Array.isArray(matrix[field]) && matrix[field].length > 0, `${field} must not be empty`);
  }
  for (const field of ['fonts', 'allowOverflow', 'allowOverlap', 'allowLight', 'referenceScreens']) {
    require_(Array.isArray(matrix[field]) && matrix[field].every(s => typeof s === 'string' && s.length > 0),
      `${field} must be an array of nonempty strings`);
  }
  const validName = (name) => typeof name === 'string' && /^[A-Za-z0-9_-]+$/.test(name);
  require_(matrix.themes.every(validName), 'invalid theme name');
  for (const viewport of matrix.viewports) {
    require_(viewport && Number.isInteger(viewport.width) && viewport.width > 0 &&
      Number.isInteger(viewport.height) && viewport.height > 0 &&
      (viewport.dpr === undefined || Number.isFinite(viewport.dpr) && viewport.dpr > 0),
    'viewports need positive integer width/height and a positive dpr');
  }
  const names = new Set();
  const tags = new Set();
  for (const pathway of matrix.pathways) {
    require_(pathway && validName(pathway.name) && !names.has(pathway.name), 'pathway names must be valid and unique');
    names.add(pathway.name);
    require_(typeof pathway.path === 'string' && pathway.path.startsWith('/'), `pathway ${pathway.name} needs a route path`);
    pathway.steps = pathway.steps || [{ name: 'open' }];
    require_(Array.isArray(pathway.steps) && pathway.steps.length > 0, `pathway ${pathway.name} needs nonempty steps`);
    const stepNames = new Set();
    for (const step of pathway.steps) {
      require_(step && validName(step.name) && !stepNames.has(step.name), `invalid or duplicate step in ${pathway.name}`);
      stepNames.add(step.name);
      step.state = step.state || 'default';
      require_(validName(step.state), `step ${step.name} has an invalid state label`);
      if (step.action !== undefined) {
        require_(['click', 'hover', 'focus', 'scroll', 'fill', 'press'].includes(step.action), `step ${step.name} has an invalid action`);
        require_(step.action === 'press' || typeof step.selector === 'string' && step.selector.length > 0,
          `step ${step.name}: action without selector`);
        if (step.action === 'press') require_(typeof step.key === 'string' && step.key.length > 0, `step ${step.name} needs key`);
        if (step.action === 'fill') require_(typeof step.value === 'string', `step ${step.name} needs a string value`);
      }
      for (const field of ['capture', 'motion', 'fullPage']) {
        require_(step[field] === undefined || typeof step[field] === 'boolean', `step ${step.name}: ${field} must be boolean`);
      }
      for (const field of ['selector', 'expectFocus', 'waitFor']) {
        require_(step[field] === undefined || typeof step[field] === 'string' && step[field].length > 0,
          `step ${step.name}: ${field} must be a nonempty string`);
      }
      require_(step.crops === undefined || Array.isArray(step.crops) && step.crops.every(s => typeof s === 'string' && s.length > 0),
        `step ${step.name}: crops must be selectors`);
      for (const viewport of matrix.viewports) {
        for (const theme of matrix.themes) {
          const tag = `${pathway.name}-${step.name}-${step.state}-${viewport.width}-${theme}`;
          require_(!tags.has(tag), `duplicate output tag ${tag}`);
          tags.add(tag);
        }
      }
    }
  }
  return matrix;
}

// -------------------------------------------------- init scripts (in-page)

const themeInit = (cfg) => {
  if (cfg.mode === 'localStorage') {
    try {
      window.localStorage.setItem(cfg.key || 'theme', cfg.value);
    } catch {
      /* storage may be blocked */
    }
    return;
  }
  if (cfg.mode !== 'class' && cfg.mode !== 'attribute') return;
  const apply = () => {
    const target =
      cfg.target === 'html' || cfg.target === ':root' || !cfg.target
        ? document.documentElement
        : document.querySelector(cfg.target);
    if (!target) return false;
    if (cfg.mode === 'class') {
      if (cfg.value) target.classList.add(cfg.value);
    } else {
      target.setAttribute('data-theme', cfg.value);
    }
    return true;
  };
  if (apply()) return;
  const observer = new MutationObserver(() => {
    if (apply()) observer.disconnect();
  });
  observer.observe(document, { childList: true, subtree: true });
};

const clsInit = () => {
  // A per-document token. The init script re-runs on every document, so a changed
  // token means window.__uxCls restarted; a same-document navigation keeps both.
  window.__uxDocId = String(Math.random());
  window.__uxCls = 0;
  window.__uxClsSources = [];
  const selectorOf = (el) => {
    if (!el || el.nodeType !== 1) return null;
    let out = el.tagName;
    if (el.id) out += '#' + el.id;
    const classes = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean);
    for (const cls of classes) out += '.' + cls;
    return out;
  };
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue;
        window.__uxCls += entry.value;
        for (const source of entry.sources || []) {
          const selector = selectorOf(source.node);
          if (selector) window.__uxClsSources.push(selector);
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch {
    /* layout-shift unsupported */
  }
};

// ------------------------------------------------- mechanical checks (page)

const inPageChecks = (opts) => {
  const checks = [];
  const suppressed = [];
  const controlSelector = opts.controlSelector;

  const selectorOf = (el) => {
    if (!el || el.nodeType !== 1) return null;
    let out = el.tagName;
    if (el.id) out += '#' + el.id;
    const classes = (el.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean);
    for (const cls of classes) out += '.' + cls;
    return out;
  };
  const textOf = (el) => ((el && el.textContent) || '').trim().slice(0, 40);
  const add = (check, severity, el, extra) => {
    checks.push(
      Object.assign(
        {
          check,
          severity,
          selector: el ? selectorOf(el) : null,
          text: el ? textOf(el) : null,
        },
        extra || {},
      ),
    );
  };
  const matchesList = (el, list) => {
    if (!list || !list.length) return false;
    for (const selector of list) {
      try {
        if (el.closest(selector)) return true;
      } catch {
        /* invalid selector in the matrix */
      }
    }
    return false;
  };
  const visible = (el) => {
    const rect = el.getBoundingClientRect();
    if (!(rect.width > 0 && rect.height > 0)) return false;
    const style = getComputedStyle(el);
    return style.visibility !== 'hidden' && style.display !== 'none';
  };
  const isLeaf = (el) => el.children.length === 0;
  // Visually hidden for screen readers at this width, judged by computed style only.
  const screenReaderOnly = (el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width > 1 || rect.height > 1) return false;
    const style = getComputedStyle(el);
    return style.overflow === 'hidden' && (style.clip !== 'auto' || style.clipPath !== 'none');
  };

  const skipTags = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE', 'NOSCRIPT', 'HEAD', 'BR']);
  const all = [document.documentElement, document.body].concat(
    Array.from(document.body.querySelectorAll('*')),
  );
  const elements = all.filter((el) => el && !skipTags.has(el.tagName));
  const visibleEls = elements.filter(visible);
  const leaves = visibleEls.filter((el) => isLeaf(el) && !screenReaderOnly(el));

  const docEl = document.documentElement;

  // page-overflow (blocker)
  if (docEl.scrollWidth > docEl.clientWidth + 1) {
    add('page-overflow', 'blocker', null, {
      by: Math.round(docEl.scrollWidth - docEl.clientWidth),
    });
  }

  // element-overflow (should)
  // Per axis, the nearest ancestor that does not overflow visibly decides: a
  // scroll container (auto/scroll) can bring the element into view, so it is not
  // a defect; only hidden/clip cuts content off.
  const overflowAncestor = (el, axis) => {
    let parent = el.parentElement;
    while (parent) {
      const style = getComputedStyle(parent);
      const value = axis === 'x' ? style.overflowX : style.overflowY;
      if (value !== 'visible') return { el: parent, value };
      parent = parent.parentElement;
    }
    return null;
  };
  const clips = (found) => found.value === 'hidden' || found.value === 'clip';
  for (const el of leaves) {
    if (matchesList(el, opts.allowOverflow)) continue;
    const rect = el.getBoundingClientRect();
    let by = 0;
    const x = overflowAncestor(el, 'x');
    if (!x) {
      if (rect.right - docEl.clientWidth > 1) by = Math.max(by, rect.right - docEl.clientWidth);
    } else if (clips(x)) {
      const limit = x.el.getBoundingClientRect().right;
      if (rect.right - limit > 1) by = Math.max(by, rect.right - limit);
    }
    // With no clipping ancestor the bottom is never compared: normal pages scroll.
    const y = overflowAncestor(el, 'y');
    if (y && clips(y)) {
      const limit = y.el.getBoundingClientRect().bottom;
      if (rect.bottom - limit > 1) by = Math.max(by, rect.bottom - limit);
    }
    if (by > 1) add('element-overflow', 'should', el, { by: Math.round(by) });
  }

  // clipped-text (should)
  for (const el of leaves) {
    if (!textOf(el)) continue;
    const style = getComputedStyle(el);
    if (style.overflowX === 'visible') continue;
    if (style.textOverflow === 'ellipsis') continue;
    if (el.scrollWidth > el.clientWidth + 1) {
      add('clipped-text', 'should', el, { by: Math.round(el.scrollWidth - el.clientWidth) });
    }
  }

  // overlap (should)
  // Different overlay layers can cover each other intentionally. Within a layer,
  // ordinary siblings must still be checked, including inside fixed app shells.
  const positionedLayer = (el) => {
    let node = el;
    while (node && node.nodeType === 1) {
      const position = getComputedStyle(node).position;
      if (position === 'absolute' || position === 'fixed' || position === 'sticky') return node;
      node = node.parentElement;
    }
    return null;
  };
  const overlapEligible = leaves.filter((el) => {
    if (getComputedStyle(el).display === 'inline') return false;
    return !matchesList(el, opts.allowOverlap);
  });
  const overlapTruncated = overlapEligible.length > 1500;
  // Rects are read once: a getBoundingClientRect() inside the pair loop is O(n²) layout.
  const overlapCandidates = overlapEligible
    .slice(0, 1500)
    .map((el) => ({ el, rect: el.getBoundingClientRect(), layer: positionedLayer(el) }));
  // A link or button stretched over a non-interactive element is a deliberate
  // click target, not a collision.
  const stretchedOver = (cover, covered) => {
    const link = cover.el.closest('a[href], button');
    if (!link || covered.el.closest(opts.interactiveSelector)) return false;
    const box = link.getBoundingClientRect();
    return box.left <= covered.rect.left && box.top <= covered.rect.top &&
      box.right >= covered.rect.right && box.bottom >= covered.rect.bottom;
  };
  for (let i = 0; i < overlapCandidates.length; i += 1) {
    for (let j = i + 1; j < overlapCandidates.length; j += 1) {
      const a = overlapCandidates[i];
      const b = overlapCandidates[j];
      if (a.layer !== b.layer) continue;
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const dx = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
      const dy = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
      if (dx > 4 && dy > 4) {
        if (stretchedOver(a, b) || stretchedOver(b, a)) {
          suppressed.push({
            check: 'overlap',
            selector: selectorOf(a.el),
            with: selectorOf(b.el),
            reason: 'covered by a stretched link or button',
          });
          continue;
        }
        add('overlap', 'should', a.el, {
          with: selectorOf(b.el),
          by: [Math.round(dx), Math.round(dy)],
        });
      }
    }
  }

  // unclickable (blocker) and tap-target (nit)
  const controls = Array.from(document.querySelectorAll(controlSelector)).filter(visible);
  // A modal owns the page while it is open: a backdrop over everything else is
  // the design, not a defect. Only a rendered modal counts — a closed
  // <dialog aria-modal="true"> matches the selector but owns nothing.
  const modal = Array.from(document.querySelectorAll('[aria-modal="true"], dialog[open]')).find(visible) || null;
  const unreachableByDesign = (el) => {
    if (el.closest('[aria-hidden="true"], [inert]')) return true;
    const style = getComputedStyle(el);
    if (style.pointerEvents === 'none' || parseFloat(style.opacity) === 0) return true;
    const rect = el.getBoundingClientRect();
    // A visually-hidden input keeps a 1×1 rect so it stays focusable.
    if (rect.width <= 1 && rect.height <= 1) return true;
    return Boolean(modal) && !modal.contains(el);
  };
  for (const el of controls) {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const inViewport = cx >= 0 && cy >= 0 && cx < docEl.clientWidth && cy < docEl.clientHeight;
    if (inViewport && !unreachableByDesign(el)) {
      const hit = document.elementFromPoint(cx, cy);
      const reachable = hit && (hit === el || el.contains(hit) || hit.contains(el));
      if (!reachable) add('unclickable', 'blocker', el, { blockedBy: selectorOf(hit) });
    }
    if (opts.viewportWidth < 500 && (rect.width < 44 || rect.height < 44)) {
      add('tap-target', 'nit', el, { size: [Math.round(rect.width), Math.round(rect.height)] });
    }
  }

  // broken-image (should)
  for (const img of Array.from(document.images)) {
    if (img.complete && img.naturalWidth === 0) add('broken-image', 'should', img, { src: img.src });
  }

  // theme-leak (should)
  const luminance = (r, g, b) => {
    const channel = (v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };
  if (opts.theme === 'dark') {
    for (const el of visibleEls) {
      const rect = el.getBoundingClientRect();
      if (rect.width * rect.height <= 2000) continue;
      const match = getComputedStyle(el).backgroundColor.match(
        /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?/,
      );
      if (!match) continue;
      const alpha = match[4] === undefined ? 1 : parseFloat(match[4]);
      if (alpha < 0.99) continue;
      if (luminance(+match[1], +match[2], +match[3]) <= 0.9) continue;
      if (matchesList(el, opts.allowLight)) continue;
      add('theme-leak', 'should', el, { background: getComputedStyle(el).backgroundColor });
    }
  }

  // font-fallback (should)
  const fontsStatus = document.fonts ? document.fonts.status : 'loaded';
  const fontProblem = fontsStatus !== 'loaded';
  const normalizedFamily = (family) => family.trim().replace(/^(['"])(.*)\1$/, '$2').toLowerCase();
  const loadedFamilies = new Set(Array.from(document.fonts || [])
    .filter(face => face.status === 'loaded')
    .map(face => normalizedFamily(face.family)));
  const missingFamilies = [];
  for (const family of opts.fonts || []) {
    try {
      if (!loadedFamilies.has(normalizedFamily(family)) ||
          !document.fonts.check('16px "' + family + '"')) missingFamilies.push(family);
    } catch {
      missingFamilies.push(family);
    }
  }
  if (fontProblem || missingFamilies.length) {
    add('font-fallback', 'should', null, {
      message: 'document.fonts.status=' + fontsStatus,
      missingFamilies,
    });
  }

  return {
    checks,
    suppressed,
    overlapTruncated,
    docId: window.__uxDocId || null,
    cls: window.__uxCls || 0,
    clsSources: (window.__uxClsSources || []).slice(),
    fonts: fontsStatus,
  };
};

// ------------------------------------------------- pixel diff (in the browser)

// Both images arrive as data: URLs; file:// is blocked from a blank page.
const inPageDiff = async (opts) => {
  const load = (src) =>
    new Promise((done, failed) => {
      const img = new Image();
      img.onload = () => done(img);
      img.onerror = () => failed(new Error('image failed to decode'));
      img.src = src;
    });
  const head = await load(opts.headUrl);
  const base = await load(opts.baseUrl);
  const w = Math.max(head.naturalWidth, base.naturalWidth);
  const h = Math.max(head.naturalHeight, base.naturalHeight);
  const pixels = (img) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, w, h).data;
  };
  const a = pixels(head);
  const b = pixels(base);
  const tolerance = opts.tolerance;
  const over = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i += 1) {
    const p = i * 4;
    if (
      Math.abs(a[p] - b[p]) > tolerance ||
      Math.abs(a[p + 1] - b[p + 1]) > tolerance ||
      Math.abs(a[p + 2] - b[p + 2]) > tolerance ||
      Math.abs(a[p + 3] - b[p + 3]) > tolerance
    ) {
      over[i] = 1;
    }
  }
  let count = 0;
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = y * w + x;
      if (!over[i]) continue;
      // Antialias guard: a lone over-tolerance pixel is edge noise.
      const neighbour =
        (x > 0 && over[i - 1]) ||
        (x < w - 1 && over[i + 1]) ||
        (y > 0 && over[i - w]) ||
        (y < h - 1 && over[i + w]);
      if (!neighbour) continue;
      count += 1;
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
  }
  return {
    ratio: count / (w * h),
    box: x1 < 0 ? null : [x0, y0, x1 - x0 + 1, y1 - y0 + 1],
    sameSize: head.naturalWidth === base.naturalWidth && head.naturalHeight === base.naturalHeight,
    headWidth: head.naturalWidth,
    headHeight: head.naturalHeight,
  };
};

// Frames onto one canvas at half scale, each labelled underneath.
const inPageStitch = async (opts) => {
  const load = (src) =>
    new Promise((done, failed) => {
      const img = new Image();
      img.onload = () => done(img);
      img.onerror = () => failed(new Error('frame failed to decode'));
      img.src = src;
    });
  const images = [];
  for (const src of opts.frames) images.push(await load(src));
  const gap = 8;
  const pad = 8;
  const labelHeight = 20;
  const widths = images.map((img) => Math.round(img.naturalWidth / 2));
  const heights = images.map((img) => Math.round(img.naturalHeight / 2));
  const canvas = document.getElementById('strip');
  canvas.width = pad * 2 + widths.reduce((sum, n) => sum + n, 0) + gap * (images.length - 1);
  canvas.height = pad * 2 + Math.max(...heights) + labelHeight;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let x = pad;
  for (let i = 0; i < images.length; i += 1) {
    ctx.drawImage(images[i], x, pad, widths[i], heights[i]);
    ctx.fillStyle = '#111111';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(opts.labels[i], x, pad + Math.max(...heights) + 4);
    x += widths[i] + gap;
  }
  return { width: canvas.width, height: canvas.height };
};

// ------------------------------------------------------------------ helpers

function themeConfig(matrix, theme) {
  const cfg = matrix.theme || {};
  const values = cfg.values || {};
  return {
    mode: cfg.mode || 'media',
    target: cfg.target || 'html',
    key: cfg.key || 'theme',
    value: values[theme] === undefined ? theme : values[theme],
  };
}

function severityRank(severity) {
  if (severity === 'blocker') return 2;
  if (severity === 'should') return 1;
  return 0;
}

async function performAction(page, step) {
  const locator = step.selector ? page.locator(step.selector).first() : null;
  if (step.action === 'click') await locator.click({ timeout: WAIT_TIMEOUT });
  else if (step.action === 'hover') await locator.hover({ timeout: WAIT_TIMEOUT });
  else if (step.action === 'focus') await locator.focus({ timeout: WAIT_TIMEOUT });
  else if (step.action === 'fill') await locator.fill(step.value, { timeout: WAIT_TIMEOUT });
  else if (step.action === 'press') {
    if (locator) await locator.press(step.key, { timeout: WAIT_TIMEOUT });
    else await page.keyboard.press(step.key);
  } else if (step.action === 'scroll') {
    await locator.scrollIntoViewIfNeeded({ timeout: WAIT_TIMEOUT });
    await locator.evaluate((el) => el.scrollIntoView({ block: 'start' }));
  }
  if (step.expectFocus) {
    const focused = await page.evaluate(selector => document.activeElement?.matches(selector), step.expectFocus);
    if (!focused) throw new Error(`step ${step.name}: expected focus on ${step.expectFocus}`);
  }
}

// Buffers the per-step console and network findings for one page.
function attachListeners(page) {
  const state = { consoleErrors: [], failedRequests: [] };
  page.on('console', (message) => {
    if (message.type() === 'error') state.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => {
    state.consoleErrors.push(`Uncaught ${error.stack || error.message}`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      state.failedRequests.push(`${response.status()} ${response.url()}`);
    }
  });
  page.on('requestfailed', (request) => {
    state.failedRequests.push(`failed ${request.url()}`);
  });
  return state;
}

function documentCheck(check, severity, message) {
  return { check, severity, selector: null, text: null, message };
}

// One capture entry, in the mechanical.json field order.
function makeEntry(o) {
  const entry = {
    tag: o.tag,
    pathway: o.pathway,
    step: o.step,
    state: o.state,
    width: o.width,
    theme: o.theme,
    dpr: o.dpr,
    files: {
      still: o.still,
      crops: o.crops || [],
      filmstrip: o.filmstrip || null,
      diffCrop: o.diffCrop || null,
    },
    diff: o.diff || null,
    checks: o.checks,
    cls: Number((o.cls || 0).toFixed(4)),
    clsSources: o.clsSources || [],
    console: o.consoleErrors || [],
    failedRequests: o.failedRequests || [],
    fonts: o.fonts,
    axe: o.axe,
  };
  if (o.error) entry.error = o.error;
  // Only recorded when a finding was deliberately suppressed.
  if (o.suppressed && o.suppressed.length) entry.suppressed = o.suppressed;
  // Only recorded when the overlap candidate cap actually applied.
  if (o.overlapTruncated) entry.overlapTruncated = true;
  return entry;
}

// @axe-core/playwright resolves from the project root or not at all.
function axeBuilderOf(mod) {
  const found = mod && (mod.AxeBuilder || (mod.default && mod.default.AxeBuilder) || mod.default);
  return typeof found === 'function' ? found : null;
}

async function loadAxe(projectRoot) {
  let require_;
  let entry;
  try {
    require_ = createRequire(join(projectRoot, 'package.json'));
    entry = require_.resolve('@axe-core/playwright');
  } catch {
    return null;
  }
  // The package resolves to its CJS build, whose exports object is not itself the
  // constructor under Node's interop; require() it and read AxeBuilder off it.
  try {
    const builder = axeBuilderOf(require_('@axe-core/playwright'));
    if (builder) return builder;
  } catch {
    /* an ESM-only build cannot be require()d */
  }
  const builder = axeBuilderOf(await import(pathToFileURL(entry).href));
  if (!builder) throw new Error(`ux-capture: resolved axe module has no AxeBuilder: ${entry}`);
  return builder;
}

// 'unavailable' is reserved for a module that does not resolve; a failing scan
// is 'error', with the reason on stderr.
async function runAxe(AxeBuilder, page, tag) {
  if (!AxeBuilder) return 'unavailable';
  try {
    const results = await new AxeBuilder({ page }).analyze();
    return results.violations || [];
  } catch (err) {
    console.error(`ux-capture: axe scan for ${tag} failed: ${err.message}`);
    return 'error';
  }
}

// One checks[] entry per violation; the raw array stays in the entry's axe field.
function axeChecks(violations) {
  if (violations === 'error') return [documentCheck('axe-error', 'blocker', 'Installed axe scanner failed; see stderr')];
  if (!Array.isArray(violations)) return [];
  return violations.map((violation) => {
    const nodes = violation.nodes || [];
    const target = (nodes[0] && nodes[0].target) || [];
    const first = Array.isArray(target[0]) ? target[0][0] : target[0];
    return {
      check: `axe:${violation.id}`,
      severity:
        violation.impact === 'critical' || violation.impact === 'serious' ? 'should' : 'nit',
      selector: first === undefined ? null : first,
      text: violation.help || null,
      impact: violation.impact || null,
      nodes: nodes.length,
    };
  });
}

async function settle(page) {
  await page
    .evaluate(
      () =>
        new Promise((done) => {
          requestAnimationFrame(() => requestAnimationFrame(() => done(null)));
        }),
    )
    .catch(() => {});
}

async function waitForFonts(page) {
  await page
    .evaluate(
      () =>
        new Promise((done) => {
          if (!document.fonts) {
            done(null);
            return;
          }
          const timer = setTimeout(() => done(null), 3000);
          document.fonts.ready.then(() => {
            clearTimeout(timer);
            done(null);
          });
        }),
    )
    .catch(() => {});
}

// --------------------------------------------------------------------- main

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || !opts.matrix) {
    console.log(USAGE);
    process.exit(opts.help ? 0 : 2);
  }
  if (!opts.out) die(`ux-capture: --out <dir> is required\n\n${USAGE}`, 2);

  const projectRoot = resolve(opts.projectRoot);
  const outDir = resolve(opts.out);
  const matrix = loadMatrix(opts.matrix);

  let storageState;
  if (matrix.storageState) {
    const statePath = resolve(projectRoot, matrix.storageState);
    if (!existsSync(statePath)) die(`ux-capture: storageState not found at ${statePath}`, 2);
    storageState = statePath;
  }
  const missingPathways = opts.pathways.filter(name => !matrix.pathways.some(p => p.name === name));
  if (missingPathways.length) die(`ux-capture: unknown pathways: ${missingPathways.join(', ')}`, 2);
  const AxeBuilder = opts.smoke ? null : await loadAxe(projectRoot);

  const chromium = await resolvePlaywright(projectRoot);
  if (!chromium) die(PLAYWRIGHT_HELP, 2);

  mkdirSync(outDir, { recursive: true });

  let browser;
  try {
    browser = await chromium.launch();
  } catch (err) {
    die(`ux-capture: cannot launch the browser: ${err.message}`, 2);
  }

  const viewports = opts.smoke ? matrix.viewports.slice(0, 1) : matrix.viewports;
  const selected = opts.pathways.length
    ? matrix.pathways.filter((p) => opts.pathways.includes(p.name))
    : matrix.pathways;
  const fullRun = !opts.smoke && opts.pathways.length === 0;
  // --smoke skips axe, filmstrips and reference screens, and ignores --baseline.
  const baselineDir = opts.smoke || !opts.baseline ? null : resolve(opts.baseline);

  const entries = [];
  const captureFailures = new Map();
  const captureFailed = (tag, kind, error) => {
    const message = `${kind} for ${tag} failed: ${error.message}`;
    console.error(`ux-capture: ${message}`);
    if (!captureFailures.has(tag)) captureFailures.set(tag, []);
    captureFailures.get(tag).push(documentCheck('capture-failed', 'blocker', message));
  };
  const base = matrix.baseUrl.replace(/\/$/, '');

  const newContext = async (viewport, theme, extra) => {
    const cfg = themeConfig(matrix, theme);
    const context = await browser.newContext(
      Object.assign(
        {
          viewport: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: (extra && extra.dpr) || viewport.dpr || 1,
          storageState,
          colorScheme: cfg.mode === 'media' ? theme : undefined,
          reducedMotion: extra && extra.reducedMotion,
        },
        extra && extra.recordVideo ? { recordVideo: { dir: join(outDir, 'video') } } : {},
      ),
    );
    await context.addInitScript(themeInit, cfg);
    await context.addInitScript(clsInit);
    return context;
  };

  const runChecks = async (page, viewport, theme) => {
    await waitForFonts(page);
    return page.evaluate(inPageChecks, {
      theme,
      viewportWidth: viewport.width,
      controlSelector: CONTROL_SELECTOR,
      interactiveSelector: INTERACTIVE_SELECTOR,
      allowOverflow: matrix.allowOverflow,
      allowOverlap: matrix.allowOverlap,
      allowLight: matrix.allowLight,
      fonts: matrix.fonts,
    });
  };

  const captureCrops = async (viewport, theme, pathway, steps, upTo, tag) => {
    const step = steps[upTo];
    if (!step.crops || !step.crops.length) return [];
    const context = await newContext(viewport, theme, { dpr: 2 });
    const page = await context.newPage();
    const files = [];
    try {
      await page.goto(base + pathway.path, { waitUntil: 'networkidle', timeout: 30000 });
      for (let i = 0; i <= upTo; i += 1) {
        await performAction(page, steps[i]);
        if (steps[i].waitFor) {
          await page.waitForSelector(steps[i].waitFor, { timeout: WAIT_TIMEOUT });
        }
      }
      await settle(page);
      for (let i = 0; i < step.crops.length; i += 1) {
        const file = `${tag}-crop-${i + 1}.png`;
        await page
          .locator(step.crops[i])
          .first()
          .screenshot({ path: join(outDir, file), animations: 'disabled', caret: 'hide' });
        files.push(file);
      }
    } catch (err) {
      captureFailed(tag, 'crops', err);
    } finally {
      await context.close();
    }
    return files;
  };

  // A page with no theme or CLS instrumentation, for canvas work on image data.
  let scratchPage = null;
  const scratch = async () => {
    if (!scratchPage) {
      const context = await browser.newContext({
        viewport: { width: 800, height: 600 },
        deviceScaleFactor: 1,
      });
      scratchPage = await context.newPage();
      await scratchPage.setContent('<body style="margin:0"><canvas id="strip"></canvas></body>');
    }
    return scratchPage;
  };

  const dataUrl = (file) => `data:image/png;base64,${readFileSync(file).toString('base64')}`;

  // The reduced-motion frame: a second context that replays the pathway.
  const reducedMotionFrame = async (viewport, theme, pathway, steps, upTo, tag) => {
    const context = await newContext(viewport, theme, { reducedMotion: 'reduce' });
    const page = await context.newPage();
    try {
      await page.goto(base + pathway.path, { waitUntil: 'networkidle', timeout: 30000 });
      for (let i = 0; i < upTo; i += 1) {
        await performAction(page, steps[i]);
        if (steps[i].waitFor) {
          await page.waitForSelector(steps[i].waitFor, { timeout: WAIT_TIMEOUT });
        }
      }
      await performAction(page, steps[upTo]);
      await page.waitForTimeout(MOTION_DELAYS[MOTION_DELAYS.length - 1]);
      return await page.screenshot({ type: 'jpeg', quality: 70 });
    } catch (err) {
      captureFailed(tag, 'reduced-motion frame', err);
      return null;
    } finally {
      await context.close();
    }
  };

  const writeFilmstrip = async (frames, labels, tag) => {
    if (frames.length === 0) return null;
    const file = `${tag}-filmstrip.png`;
    try {
      const page = await scratch();
      const size = await page.evaluate(inPageStitch, {
        frames: frames.map((buffer) => `data:image/jpeg;base64,${buffer.toString('base64')}`),
        labels,
      });
      await page.setViewportSize({
        width: Math.min(size.width, 4000),
        height: Math.min(size.height, 4000),
      });
      await page.locator('#strip').screenshot({ path: join(outDir, file) });
      return file;
    } catch (err) {
      captureFailed(tag, 'filmstrip', err);
      return null;
    }
  };

  const diffCapture = async (stillFile, tag) => {
    const basePath = join(baselineDir, stillFile);
    if (!existsSync(basePath)) return { status: 'new', ratio: 0, box: null };
    let raw;
    try {
      raw = await (await scratch()).evaluate(inPageDiff, {
        headUrl: dataUrl(join(outDir, stillFile)),
        baseUrl: dataUrl(basePath),
        tolerance: DIFF_TOLERANCE,
      });
    } catch (err) {
      captureFailed(tag, 'diff', err);
      return null;
    }
    const ratio = Number(raw.ratio.toFixed(6));
    // Images of different sizes are changed, with the box covering the head still.
    if (!raw.sameSize) {
      return { status: 'changed', ratio, box: [0, 0, raw.headWidth, raw.headHeight] };
    }
    if (!raw.box) return { status: 'unchanged', ratio, box: null };
    return { status: 'changed', ratio, box: raw.box };
  };

  // box is in head-still pixels; the clip and its padding are in CSS px.
  const writeDiffCrop = async (page, tag, box, viewport, dpr, fullPage) => {
    const file = `${tag}-diff-crop.png`;
    let x = box[0] / dpr - DIFF_CROP_PADDING;
    let y = box[1] / dpr - DIFF_CROP_PADDING;
    let width = box[2] / dpr + DIFF_CROP_PADDING * 2;
    let height = box[3] / dpr + DIFF_CROP_PADDING * 2;
    if (x < 0) {
      width += x;
      x = 0;
    }
    if (y < 0) {
      height += y;
      y = 0;
    }
    width = Math.min(width, viewport.width - x);
    // A full-page still can hold a box below the fold, so only a viewport still clamps.
    if (!fullPage) height = Math.min(height, viewport.height - y);
    if (width <= 0 || height <= 0) {
      captureFailed(tag, 'diff crop', new Error('changed region lies outside the capture area'));
      return null;
    }
    try {
      // A viewport clip is viewport-relative, so the page keeps the scroll
      // position the step left it at; a fullPage clip is in document
      // coordinates and needs the top of the document.
      if (fullPage) await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: join(outDir, file),
        clip: { x, y, width, height },
        fullPage,
        animations: 'disabled',
        caret: 'hide',
      });
      return file;
    } catch (err) {
      captureFailed(tag, 'diff crop', err);
      return null;
    }
  };

  // Diff, then the crop: the crop scrolls the page, so checks must be done.
  const diffAndCrop = async (page, stillFile, tag, viewport, dpr, fullPage) => {
    if (!baselineDir || !stillFile) return { diff: null, diffCrop: null };
    const diff = await diffCapture(stillFile, tag);
    if (!diff || diff.status !== 'changed' || !diff.box) return { diff, diffCrop: null };
    return {
      diff,
      diffCrop: await writeDiffCrop(page, tag, diff.box, viewport, dpr, fullPage === true),
    };
  };

  for (const viewport of viewports) {
    for (const theme of matrix.themes) {
      for (const pathway of selected) {
        const context = await newContext(viewport, theme, { recordVideo: opts.video });
        const page = await context.newPage();
        const video = opts.video ? page.video() : null;

        const listeners = attachListeners(page);
        let lastCls = 0;
        let lastSources = 0;
        let lastDocId = null;

        let navigationError = null;
        try {
          await page.goto(base + pathway.path, { waitUntil: 'networkidle', timeout: 30000 });
        } catch (err) {
          navigationError = err.message;
        }

        for (let index = 0; index < pathway.steps.length; index += 1) {
          const step = pathway.steps[index];
          const tag = `${pathway.name}-${step.name}-${step.state}-${viewport.width}-${theme}`;
          const still = `${tag}.png`;
          let error = navigationError;

          const capture = step.capture !== false;
          const motion = capture && step.motion === true && !opts.smoke;
          const frames = [];
          if (!error) {
            try {
              await performAction(page, step);
              // Filmstrip frames come between the action and waitFor, animations live.
              // Each delay is measured from the clock at the action's return, so a
              // slow screenshot does not push the later labels off their true time.
              const actionReturned = Date.now();
              for (const delay of motion ? MOTION_DELAYS : []) {
                const remaining = actionReturned + delay - Date.now();
                if (remaining > 0) await page.waitForTimeout(remaining);
                frames.push(await page.screenshot({ type: 'jpeg', quality: 70 }));
              }
              if (step.waitFor) await page.waitForSelector(step.waitFor, { timeout: WAIT_TIMEOUT });
            } catch (err) {
              error = err.message;
            }
          }

          await settle(page);
          let stillWritten = null;
          try {
            if (capture) {
              await page.screenshot({
                path: join(outDir, still),
                animations: 'disabled',
                caret: 'hide',
                fullPage: step.fullPage === true,
              });
              stillWritten = still;
            }
          } catch (err) {
            if (!error) error = `screenshot failed: ${err.message}`;
          }

          const crops = error || !capture ? [] : await captureCrops(viewport, theme, pathway, pathway.steps, index, tag);

          let result = { checks: [], docId: null, cls: 0, clsSources: [], fonts: 'loaded' };
          try {
            result = await runChecks(page, viewport, theme);
          } catch (err) {
            if (!error) error = `mechanical checks failed: ${err.message}`;
          }

          const axe = opts.smoke ? 'skipped' : await runAxe(AxeBuilder, page, tag);

          let filmstrip = null;
          if (motion && frames.length && !error) {
            const reduced = await reducedMotionFrame(
              viewport, theme, pathway, pathway.steps, index, tag,
            );
            const labels = MOTION_DELAYS.map((ms) => `${ms} ms`);
            if (reduced) {
              frames.push(reduced);
              labels.push('reduced motion');
            }
            filmstrip = await writeFilmstrip(frames, labels, tag);
          }

          const checks = result.checks.slice().concat(axeChecks(axe));
          // A fresh document restarted window.__uxCls, so the step's delta is the
          // whole new sum; a same-document navigation keeps the running one.
          if (result.docId !== lastDocId) {
            lastCls = 0;
            lastSources = 0;
            lastDocId = result.docId;
          }
          const clsDelta = result.cls - lastCls;
          const sources = result.clsSources.slice(lastSources);
          lastCls = result.cls;
          lastSources = result.clsSources.length;
          if (clsDelta > 0.1) {
            checks.push({
              check: 'layout-shift',
              severity: 'should',
              selector: null,
              text: null,
              cls: Number(clsDelta.toFixed(4)),
            });
          }
          for (const message of listeners.consoleErrors) {
            checks.push(documentCheck('console-error', 'should', message));
          }
          for (const message of listeners.failedRequests) {
            checks.push(documentCheck('failed-request', 'should', message));
          }
          if (error) checks.push(documentCheck('step-failed', 'blocker', error));

          const dpr = viewport.dpr || 1;
          const diffed = await diffAndCrop(page, stillWritten, tag, viewport, dpr, step.fullPage);
          checks.push(...(captureFailures.get(tag) || []));

          entries.push(
            makeEntry({
              tag,
              pathway: pathway.name,
              step: step.name,
              state: step.state,
              width: viewport.width,
              theme,
              dpr,
              still: stillWritten,
              crops,
              filmstrip,
              diffCrop: diffed.diffCrop,
              diff: diffed.diff,
              checks,
              cls: clsDelta,
              clsSources: sources,
              consoleErrors: listeners.consoleErrors.slice(),
              failedRequests: listeners.failedRequests.slice(),
              fonts: result.fonts,
              axe,
              suppressed: result.suppressed,
              overlapTruncated: result.overlapTruncated,
              error,
            }),
          );

          listeners.consoleErrors = [];
          listeners.failedRequests = [];
          if (error) {
            // The pathway stops here, but the steps it never reached are recorded
            // so a reader sees every step of the matrix in mechanical.json.
            for (let rest = index + 1; rest < pathway.steps.length; rest += 1) {
              const skipped = pathway.steps[rest];
              entries.push(
                makeEntry({
                  tag: `${pathway.name}-${skipped.name}-${skipped.state}-${viewport.width}-${theme}`,
                  pathway: pathway.name,
                  step: skipped.name,
                  state: skipped.state,
                  width: viewport.width,
                  theme,
                  dpr: viewport.dpr || 1,
                  still: null,
                  checks: [
                    documentCheck('step-failed', 'blocker', `skipped after failure of step ${step.name}`),
                  ],
                  fonts: result.fonts,
                  axe: 'skipped',
                  error: `skipped after failure of step ${step.name}`,
                }),
              );
            }
            break;
          }
        }

        await context.close();
        // The webm is only finalised once the context is closed.
        if (video) {
          const named = `${pathway.name}-${viewport.width}-${theme}.webm`;
          try {
            await video.saveAs(join(outDir, 'video', named));
            await video.delete();
          } catch (err) {
            console.error(`ux-capture: video for ${named} failed: ${err.message}`);
          }
        }
      }
    }
  }

  // Reference screens: full runs only, first viewport, every theme.
  if (fullRun && matrix.referenceScreens.length) {
    const viewport = matrix.viewports[0];
    const dpr = viewport.dpr || 1;
    for (const theme of matrix.themes) {
      for (let i = 0; i < matrix.referenceScreens.length; i += 1) {
        const n = i + 1;
        const tag = `reference-${n}-${viewport.width}-${theme}`;
        const context = await newContext(viewport, theme, {});
        const page = await context.newPage();
        const listeners = attachListeners(page);
        let error = null;
        let stillWritten = null;
        let result = { checks: [], docId: null, cls: 0, clsSources: [], fonts: 'loaded' };
        try {
          await page.goto(base + matrix.referenceScreens[i], {
            waitUntil: 'networkidle',
            timeout: 30000,
          });
          await settle(page);
          await page.screenshot({
            path: join(outDir, `${tag}.png`),
            animations: 'disabled',
            caret: 'hide',
          });
          stillWritten = `${tag}.png`;
          result = await runChecks(page, viewport, theme);
        } catch (err) {
          error = err.message;
        }
        const axe = await runAxe(AxeBuilder, page, tag);
        const checks = result.checks.slice().concat(axeChecks(axe));
        for (const message of listeners.consoleErrors) {
          checks.push(documentCheck('console-error', 'should', message));
        }
        for (const message of listeners.failedRequests) {
          checks.push(documentCheck('failed-request', 'should', message));
        }
        if (error) checks.push(documentCheck('step-failed', 'blocker', error));
        const diffed = await diffAndCrop(page, stillWritten, tag, viewport, dpr, false);
        checks.push(...(captureFailures.get(tag) || []));
        entries.push(
          makeEntry({
            tag,
            pathway: 'reference',
            step: String(n),
            state: 'default',
            width: viewport.width,
            theme,
            dpr,
            still: stillWritten,
            crops: [],
            filmstrip: null,
            diffCrop: diffed.diffCrop,
            diff: diffed.diff,
            checks,
            cls: result.cls || 0,
            clsSources: result.clsSources,
            consoleErrors: listeners.consoleErrors,
            failedRequests: listeners.failedRequests,
            fonts: result.fonts,
            axe,
            suppressed: result.suppressed,
            overlapTruncated: result.overlapTruncated,
            error,
          }),
        );
        await context.close();
      }
    }
  }

  await browser.close();
  writeFileSync(
    join(outDir, 'mechanical.json'),
    `${JSON.stringify({ projectRoot, captures: entries }, null, 2)}\n`,
  );

  let worst = 0;
  for (const entry of entries) {
    for (const check of entry.checks) worst = Math.max(worst, severityRank(check.severity));
  }
  process.exit(worst >= 1 ? 1 : 0);
}

main().catch((err) => {
  die(`ux-capture: ${err && err.stack ? err.stack : err}`, 2);
});
