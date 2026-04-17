import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const INDEX_ROOT_CANDIDATES = ['src', 'app', 'lib'];

const EXCLUDED_DIRS = new Set([
  '.git',
  '.vscode',
  '.spectral',
  '.angular',
  'node_modules',
  'dist',
  'build',
  '.cache',
  'coverage'
]);

const EXCLUDED_FILE_NAMES = new Set([
  'package-lock.json'
]);

const EXCLUDED_EXTENSIONS = new Set([
  '.map',
  '.lock',
  '.log',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg'
]);

const CODE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs'
]);

const IMPORTANT_JSON_FILES = new Set([
  'package.json',
  'angular.json',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.base.json'
]);

const FEATURE_STOP_WORDS = new Set([
  'src', 'app', 'lib', 'apps', 'libs', 'shared', 'common', 'core',
  'component', 'components', 'service', 'services', 'module', 'modules',
  'util', 'utils', 'helper', 'helpers', 'config', 'configs',
  'page', 'pages', 'route', 'routes', 'controller', 'controllers',
  'index', 'main', 'test', 'tests', 'spec', 'docs', 'doc',
  'json', 'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'angular', 'vite', 'cache',
  'node', 'modules', 'dist', 'build', 'coverage', 'assets', 'styles', 'style'
]);

const EXTERNAL_IMPORT_PREFIXES = ['@angular/', 'react', 'vue', 'svelte', 'next/', 'rxjs', 'express'];

function normalizePath(p) {
  return p.replace(/\\/g, '/');
}

function parseArgs(argv) {
  const args = {
    out: null,
    target: process.cwd(),
    mode: 'full'
  };

  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];

    if (token === '--out' && next) {
      args.out = next;
      i += 1;
    } else if (token === '--target' && next) {
      args.target = next;
      i += 1;
    } else if (token === '--mode' && next) {
      if (next === 'full' || next === 'incremental') {
        args.mode = next;
      }
      i += 1;
    }
  }

  return args;
}

function loadExistingIndex(indexPath) {
  try {
    if (!fs.existsSync(indexPath)) return null;
    const parsed = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.version !== 2) return null;
    if (!parsed.files || typeof parsed.files !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function getIndexRoots(targetDir) {
  const roots = [];
  for (const folder of INDEX_ROOT_CANDIDATES) {
    const candidate = path.join(targetDir, folder);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      roots.push(candidate);
    }
  }
  return roots;
}

function shouldIgnoreFileName(name) {
  return EXCLUDED_FILE_NAMES.has(name);
}

function shouldIgnoreExtension(ext) {
  return EXCLUDED_EXTENSIONS.has(ext.toLowerCase());
}

function isMeaningfulFile(relPath) {
  const ext = path.extname(relPath).toLowerCase();
  const base = path.basename(relPath);

  if (shouldIgnoreFileName(base) || shouldIgnoreExtension(ext)) return false;
  if (CODE_EXTENSIONS.has(ext)) return true;
  if (ext === '.json' && IMPORTANT_JSON_FILES.has(base)) return true;
  return false;
}

function collectScopedFiles(targetDir) {
  const files = [];
  const roots = getIndexRoots(targetDir);

  const walk = (currentDir) => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relPath = normalizePath(path.relative(targetDir, fullPath));

      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name)) continue;
        walk(fullPath);
        continue;
      }

      if (!entry.isFile()) continue;
      if (isMeaningfulFile(relPath)) {
        files.push({ fullPath, relPath });
      }
    }
  };

  for (const root of roots) {
    walk(root);
  }

  for (const rootJson of IMPORTANT_JSON_FILES) {
    const fullPath = path.join(targetDir, rootJson);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      const relPath = normalizePath(path.relative(targetDir, fullPath));
      if (isMeaningfulFile(relPath)) {
        files.push({ fullPath, relPath });
      }
    }
  }

  const deduped = new Map();
  for (const file of files) {
    deduped.set(file.relPath, file);
  }

  return Array.from(deduped.values()).sort((a, b) => a.relPath.localeCompare(b.relPath));
}

function safeReadText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function detectLanguage(relPath) {
  const ext = path.extname(relPath).toLowerCase();
  if (ext === '.ts' || ext === '.tsx') return 'typescript';
  if (ext === '.js' || ext === '.jsx' || ext === '.mjs' || ext === '.cjs') return 'javascript';
  if (ext === '.json') return 'json';
  return ext ? ext.slice(1) : 'unknown';
}

function splitWords(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_\-.]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function inferKind(relPath, language) {
  const lcPath = relPath.toLowerCase();
  const base = path.basename(lcPath);

  if (language === 'json' || base.includes('config') || IMPORTANT_JSON_FILES.has(path.basename(relPath))) {
    return 'config';
  }
  if (lcPath.includes('/components/') || base.includes('component') || lcPath.includes('/pages/')) {
    return 'component';
  }
  if (lcPath.includes('/services/') || base.includes('service')) {
    return 'service';
  }
  if (lcPath.includes('/utils/') || lcPath.includes('/helpers/') || base.includes('util') || base.includes('helper')) {
    return 'util';
  }

  return 'module';
}

function inferFeatureTags(relPath, text) {
  const tokens = normalizePath(relPath)
    .split('/')
    .flatMap((part) => splitWords(part));

  const fromPath = tokens.filter((token) => token.length > 2 && !FEATURE_STOP_WORDS.has(token));

  const commonFeatures = ['todo', 'auth', 'user', 'account', 'payment', 'checkout', 'cart', 'order', 'profile', 'search', 'admin', 'chat', 'notification'];
  const lcText = text.toLowerCase();
  const fromContent = commonFeatures.filter((feature) => lcText.includes(feature));

  const tags = Array.from(new Set([...fromPath, ...fromContent]));
  return tags.slice(0, 4);
}

function inferResponsibility(kind, relPath, featureTags) {
  const feature = featureTags[0] || 'core';

  if (kind === 'component') return `Renders ${feature} UI behavior and user interactions.`;
  if (kind === 'service') return `Implements ${feature} business logic used by other modules.`;
  if (kind === 'util') return `Provides reusable helper logic for ${feature} flows.`;
  if (kind === 'config') return `Defines configuration used by ${feature} or project setup.`;

  return `Implements ${feature} module behavior in ${path.basename(relPath)}.`;
}

function collectImports(text) {
  const imports = new Set();
  const patterns = [
    /import\s+[^'"\n]*from\s+['"]([^'"]+)['"]/g,
    /import\s+['"]([^'"]+)['"]/g,
    /require\(\s*['"]([^'"]+)['"]\s*\)/g
  ];

  for (const regex of patterns) {
    let match = regex.exec(text);
    while (match) {
      imports.add(match[1]);
      match = regex.exec(text);
    }
  }

  return Array.from(imports).slice(0, 40);
}

function inferPurposeFromName(name) {
  const words = splitWords(name);
  if (words.length === 0) return 'Handles internal file logic.';
  if (words[0] === 'get' || words[0] === 'fetch' || words[0] === 'load') return `Retrieves ${words.slice(1).join(' ') || 'data'} for this feature.`;
  if (words[0] === 'add' || words[0] === 'create') return `Creates ${words.slice(1).join(' ') || 'records'} for this feature.`;
  if (words[0] === 'update' || words[0] === 'edit') return `Updates ${words.slice(1).join(' ') || 'data'} for this feature.`;
  if (words[0] === 'delete' || words[0] === 'remove') return `Removes ${words.slice(1).join(' ') || 'data'} for this feature.`;
  return `Handles ${words.join(' ')} logic.`;
}

function extractCalls(snippet) {
  const calls = new Set();
  const memberCallRegex = /\b([A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
  const simpleCallRegex = /\b([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
  const excluded = new Set(['if', 'for', 'while', 'switch', 'catch', 'return', 'function', 'class', 'new']);

  let match = memberCallRegex.exec(snippet);
  while (match) {
    calls.add(match[1]);
    match = memberCallRegex.exec(snippet);
  }

  match = simpleCallRegex.exec(snippet);
  while (match) {
    if (!excluded.has(match[1])) calls.add(match[1]);
    match = simpleCallRegex.exec(snippet);
  }

  return Array.from(calls).slice(0, 10);
}

function collectFunctions(text) {
  const signatures = [];
  const patterns = [
    /\bfunction\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g,
    /\b(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g,
    /\bclass\s+([A-Za-z_][A-Za-z0-9_]*)\b/g
  ];

  for (const regex of patterns) {
    let match = regex.exec(text);
    while (match) {
      signatures.push({ name: match[1], start: match.index });
      match = regex.exec(text);
    }
  }

  signatures.sort((a, b) => a.start - b.start);

  const functions = [];
  for (let i = 0; i < signatures.length; i += 1) {
    const current = signatures[i];
    const next = signatures[i + 1];
    const end = next ? Math.min(next.start, current.start + 1200) : Math.min(text.length, current.start + 1200);
    const snippet = text.slice(current.start, end);
    functions.push({
      name: current.name,
      purpose: inferPurposeFromName(current.name),
      calls: extractCalls(snippet)
    });
  }

  const deduped = new Map();
  for (const fn of functions) {
    if (!deduped.has(fn.name)) deduped.set(fn.name, fn);
  }

  return Array.from(deduped.values()).slice(0, 25);
}

function resolveInternalImport(importPath, currentFilePath, allPathsSet) {
  if (!importPath) return null;
  if (EXTERNAL_IMPORT_PREFIXES.some((prefix) => importPath.startsWith(prefix))) return null;

  const currentDir = normalizePath(path.dirname(currentFilePath));
  const candidateRoots = [];

  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    candidateRoots.push(normalizePath(path.normalize(path.join(currentDir, importPath))));
  } else if (importPath.startsWith('@/')) {
    candidateRoots.push(`src/${importPath.slice(2)}`);
    candidateRoots.push(importPath.slice(2));
  } else if (importPath.startsWith('/')) {
    candidateRoots.push(importPath.slice(1));
  }

  const ext = path.extname(importPath);
  const extensionCandidates = ext ? [''] : ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'];

  for (const root of candidateRoots) {
    if (ext && allPathsSet.has(root)) return root;

    for (const suffix of extensionCandidates) {
      const candidate = `${root}${suffix}`;
      if (allPathsSet.has(candidate)) return candidate;
    }

    for (const suffix of ['.ts', '.tsx', '.js', '.jsx']) {
      const candidate = `${root}/index${suffix}`;
      if (allPathsSet.has(candidate)) return candidate;
    }
  }

  return null;
}

function buildSummary(entry) {
  const deps = entry.dependsOn.length;
  const users = entry.usedBy.length;
  const depsText = deps === 0 ? 'no indexed dependencies' : `${deps} dependency file(s)`;
  const usersText = users === 0 ? 'no indexed consumers yet' : `${users} dependent file(s)`;
  return `${entry.responsibility} It currently has ${depsText} and ${usersText}.`;
}

function createFeatureMap(files) {
  const features = {};

  for (const [filePath, entry] of Object.entries(files)) {
    if (!entry.featureTags || entry.featureTags.length === 0) continue;

    for (const tag of entry.featureTags) {
      if (!features[tag]) {
        features[tag] = {
          files: []
        };
      }
      features[tag].files.push(filePath);
    }
  }

  for (const feature of Object.values(features)) {
    feature.files = Array.from(new Set(feature.files)).sort();
  }

  return features;
}

function summarizeStats(files, operationStats) {
  const stats = {
    ...operationStats,
    totalFiles: 0,
    kinds: {
      component: 0,
      service: 0,
      module: 0,
      util: 0,
      config: 0
    }
  };

  for (const entry of Object.values(files)) {
    stats.totalFiles += 1;
    stats.kinds[entry.kind] += 1;
  }

  return stats;
}

async function buildFileEntry(file, allPathsSet) {
  const text = safeReadText(file.fullPath);
  const stat = fs.statSync(file.fullPath);
  const language = detectLanguage(file.relPath);
  const kind = inferKind(file.relPath, language);
  const featureTags = inferFeatureTags(file.relPath, text);
  const imports = collectImports(text);

  const dependsOn = imports
    .map((value) => resolveInternalImport(value, file.relPath, allPathsSet))
    .filter(Boolean);

  const uniqueDependsOn = Array.from(new Set(dependsOn)).slice(0, 30);
  const functions = kind === 'config' ? [] : collectFunctions(text);
  const responsibility = inferResponsibility(kind, file.relPath, featureTags);

  return {
    language,
    kind,
    responsibility,
    summary: '',
    featureTags,
    dependsOn: uniqueDependsOn,
    usedBy: [],
    functions,
    mtimeMs: stat.mtimeMs,
    size: stat.size
  };
}

function wireUsedBy(files) {
  for (const entry of Object.values(files)) {
    entry.usedBy = [];
  }

  for (const [filePath, entry] of Object.entries(files)) {
    for (const dep of entry.dependsOn) {
      if (!files[dep]) continue;
      files[dep].usedBy.push(filePath);
    }
  }

  for (const entry of Object.values(files)) {
    entry.usedBy = Array.from(new Set(entry.usedBy)).sort();
    entry.summary = buildSummary(entry);
  }
}

export async function generateCodeIndex({
  targetDir = process.cwd(),
  outPath,
  mode = 'full'
} = {}) {
  const resolvedTarget = path.resolve(targetDir);
  const outputPath = outPath
    ? path.resolve(outPath)
    : path.join(resolvedTarget, '.spectral', 'code_index.json');

  const scopedFiles = collectScopedFiles(resolvedTarget);
  const allPathsSet = new Set(scopedFiles.map((f) => f.relPath));

  const previous = mode === 'incremental' ? loadExistingIndex(outputPath) : null;
  const previousFiles = previous ? previous.files : {};

  const files = {};
  const seen = new Set();
  const operationStats = {
    mode,
    scannedFiles: 0,
    previousIndexLoaded: Boolean(previous),
    reusedFiles: 0,
    newFiles: 0,
    changedFiles: 0,
    deletedFiles: 0,
    reprocessedFiles: 0
  };

  for (const file of scopedFiles) {
    const stat = fs.statSync(file.fullPath);
    const oldEntry = previousFiles[file.relPath];
    seen.add(file.relPath);

    const isUnchanged =
      mode === 'incremental' &&
      oldEntry &&
      oldEntry.mtimeMs === stat.mtimeMs &&
      oldEntry.size === stat.size;

    if (isUnchanged) {
      files[file.relPath] = oldEntry;
      operationStats.reusedFiles += 1;
    } else {
      files[file.relPath] = await buildFileEntry(file, allPathsSet);
      operationStats.reprocessedFiles += 1;
      if (oldEntry) {
        operationStats.changedFiles += 1;
      } else {
        operationStats.newFiles += 1;
      }
    }

    operationStats.scannedFiles += 1;
  }

  if (mode === 'incremental') {
    for (const prevPath of Object.keys(previousFiles)) {
      if (!seen.has(prevPath)) {
        operationStats.deletedFiles += 1;
      }
    }
  }

  wireUsedBy(files);
  const features = createFeatureMap(files);
  const stats = summarizeStats(files, operationStats);

  const result = {
    version: 2,
    mode,
    metadataOnly: true,
    generatedAt: new Date().toISOString(),
    root: normalizePath(resolvedTarget),
    files,
    features,
    stats
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const tempPath = `${outputPath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(result, null, 2), 'utf8');
  fs.renameSync(tempPath, outputPath);

  return {
    outPath: outputPath,
    stats
  };
}

async function cli() {
  const args = parseArgs(process.argv);
  const result = await generateCodeIndex({
    targetDir: args.target,
    outPath: args.out,
    mode: args.mode
  });

  console.log(`Code index generated: ${result.outPath}`);
  console.log(`Mode: ${result.stats.mode}`);
  console.log(`Scanned: ${result.stats.scannedFiles}`);
  console.log(`Reused: ${result.stats.reusedFiles}`);
  console.log(`Changed: ${result.stats.changedFiles}`);
  console.log(`New: ${result.stats.newFiles}`);
  console.log(`Deleted: ${result.stats.deletedFiles}`);
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  cli().catch((error) => {
    console.error(`Failed to generate code index: ${error.message}`);
    process.exit(1);
  });
}
