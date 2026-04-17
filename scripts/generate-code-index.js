import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const EXCLUDED_DIRS = new Set([
  '.git',
  'node_modules',
  '.spectral',
  '.venv',
  'venv',
  'dist',
  'build'
]);

const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.rb', '.php', '.swift', '.kt', '.kts',
  '.go', '.rs', '.java', '.cs', '.c', '.h', '.cpp', '.cc', '.cxx', '.hpp',
  '.scala', '.dart', '.lua', '.r', '.pl', '.sql',
  '.sh', '.bash', '.zsh', '.ps1', '.psm1', '.psd1',
  '.clj', '.cljs', '.ex', '.exs', '.erl', '.hrl',
  '.fs', '.fsi', '.fsx', '.vue', '.svelte'
]);

const STRUCTURED_TEXT_EXTENSIONS = new Set([
  '.json', '.md', '.yaml', '.yml', '.toml'
]);

const CONFIG_BASENAMES = new Set([
  'package.json',
  'angular.json',
  'tsconfig.json',
  'jsconfig.json',
  'vite.config.ts',
  'vite.config.js',
  'webpack.config.js',
  'next.config.js',
  'next.config.mjs',
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml'
]);

const TREE_SITTER_LANGUAGE_LOADERS = {
  '.js': async () => (await import('tree-sitter-javascript')).default,
  '.jsx': async () => (await import('tree-sitter-javascript')).default,
  '.ts': async () => (await import('tree-sitter-typescript')).typescript,
  '.tsx': async () => (await import('tree-sitter-typescript')).tsx,
  '.py': async () => (await import('tree-sitter-python')).default,
  '.go': async () => (await import('tree-sitter-go')).default,
  '.rs': async () => (await import('tree-sitter-rust')).default,
  '.java': async () => (await import('tree-sitter-java')).default,
  '.cs': async () => (await import('tree-sitter-c-sharp')).default
};

const FEATURE_STOP_WORDS = new Set([
  'src', 'app', 'apps', 'lib', 'libs', 'shared', 'common', 'core', 'components',
  'component', 'services', 'service', 'utils', 'util', 'helpers', 'helper', 'api',
  'server', 'client', 'config', 'configs', 'test', 'tests', 'spec', 'docs', 'doc',
  'assets', 'styles', 'style', 'hooks', 'hook', 'pages', 'page', 'modules', 'module',
  'index', 'main', 'dist', 'build', 'scripts', 'types', 'models', 'model', 'controllers',
  'controller', 'routes', 'route', 'json', 'ts', 'tsx', 'js', 'jsx', 'md', 'yaml', 'yml', 'toml'
]);

const EXTERNAL_IMPORT_PREFIXES = ['@angular/', 'react', 'vue', 'svelte', 'next/', 'express', 'rxjs'];

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

function walkFiles(targetDir, currentDir = targetDir, files = []) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relPath = normalizePath(path.relative(targetDir, fullPath));

    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      walkFiles(targetDir, fullPath, files);
      continue;
    }

    if (entry.isFile()) {
      files.push({ fullPath, relPath });
    }
  }

  return files;
}

function safeReadText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function loadExistingIndex(indexPath) {
  try {
    if (!fs.existsSync(indexPath)) return null;
    const parsed = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function detectLanguage(relPath) {
  const ext = path.extname(relPath).toLowerCase();
  if (ext === '.ts' || ext === '.tsx') return 'typescript';
  if (ext === '.js' || ext === '.jsx' || ext === '.mjs' || ext === '.cjs') return 'javascript';
  if (ext === '.py') return 'python';
  if (ext === '.json') return 'json';
  if (ext === '.md') return 'markdown';
  if (ext === '.yaml' || ext === '.yml') return 'yaml';
  if (ext === '.toml') return 'toml';
  if (ext) return ext.slice(1);
  return 'unknown';
}

function looksCodeLike(text) {
  const sample = text.slice(0, 4000);
  return (
    /(^|\n)\s*(import\s+|from\s+.+\s+import\s+|package\s+[A-Za-z_]|using\s+[A-Za-z_.]+;|#include\s+[<"]|module\s+[A-Za-z_]|namespace\s+[A-Za-z_])/.test(sample) ||
    /(^|\n)\s*(class|interface|struct|enum|def|fn|function)\s+[A-Za-z_]/.test(sample) ||
    /(^|\n)\s*#!/.test(sample)
  );
}

function isStructuredText(relPath) {
  const ext = path.extname(relPath).toLowerCase();
  return STRUCTURED_TEXT_EXTENSIONS.has(ext);
}

function isCodeFile(relPath, text) {
  const ext = path.extname(relPath).toLowerCase();
  if (CODE_EXTENSIONS.has(ext)) return true;
  if (text && looksCodeLike(text)) return true;
  return false;
}

function inferKind(relPath, language) {
  const lcPath = relPath.toLowerCase();
  const base = path.basename(relPath).toLowerCase();

  if (CONFIG_BASENAMES.has(base) || language === 'json' || language === 'yaml' || language === 'toml') {
    if (base.includes('db.json')) return 'module';
    return 'config';
  }

  if (lcPath.includes('/hooks/') || /^use[A-Z]/.test(path.basename(relPath))) return 'hook';
  if (lcPath.includes('/services/') || base.includes('service')) return 'service';
  if (lcPath.includes('/controllers/') || lcPath.includes('/routes/') || base.includes('controller') || base.includes('route') || base.includes('api')) return 'api';
  if (lcPath.includes('/components/') || lcPath.includes('/pages/') || base.includes('component') || base.includes('page') || base.includes('view')) return 'component';
  if (lcPath.includes('/utils/') || lcPath.includes('/helpers/') || base.includes('util') || base.includes('helper')) return 'util';

  if (CODE_EXTENSIONS.has(path.extname(relPath).toLowerCase())) return 'module';
  return 'unknown';
}

function splitWords(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_\-.]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function inferFeatureTags(relPath, text) {
  const fromPath = normalizePath(relPath)
    .split('/')
    .flatMap((token) => splitWords(token))
    .filter((token) => token.length > 2 && !FEATURE_STOP_WORDS.has(token));

  const keywordHits = [];
  const lcText = (text || '').toLowerCase();
  const commonFeatures = ['todo', 'auth', 'user', 'account', 'payment', 'checkout', 'cart', 'order', 'profile', 'search', 'admin', 'chat', 'notification'];
  for (const feature of commonFeatures) {
    if (lcText.includes(feature)) keywordHits.push(feature);
  }

  const tags = Array.from(new Set([...fromPath, ...keywordHits]));
  return tags.slice(0, 4);
}

function inferEntryPoint(relPath, kind, text) {
  const base = path.basename(relPath).toLowerCase();
  const lcPath = relPath.toLowerCase();
  const body = (text || '').toLowerCase();

  const isUiEntry = [
    'main.ts', 'main.js', 'main.tsx', 'main.jsx',
    'index.ts', 'index.js', 'index.tsx', 'index.jsx',
    'app.component.ts', 'app.tsx', 'app.jsx'
  ].includes(base);

  const isApiEntry = (
    base.includes('route') || base.includes('controller') || lcPath.includes('/routes/') || lcPath.includes('/controllers/')
  ) && (
    body.includes('router.') || body.includes('app.get(') || body.includes('app.post(') || body.includes('@controller') || body.includes('fastapi(')
  );

  return isUiEntry || isApiEntry || (kind === 'api' && (base === 'server.ts' || base === 'server.js'));
}

function inferPurposeFromName(name) {
  const words = splitWords(name);
  if (words.length === 0) return 'Performs internal logic for this file.';

  const phrase = words.join(' ');
  if (words[0] === 'get' || words[0] === 'fetch' || words[0] === 'load') return `Retrieves ${words.slice(1).join(' ') || 'data'} for this feature.`;
  if (words[0] === 'create' || words[0] === 'add') return `Creates ${words.slice(1).join(' ') || 'a new record'} for this feature.`;
  if (words[0] === 'update' || words[0] === 'edit') return `Updates ${words.slice(1).join(' ') || 'existing data'} for this feature.`;
  if (words[0] === 'delete' || words[0] === 'remove') return `Removes ${words.slice(1).join(' ') || 'data'} for this feature.`;

  return `Handles ${phrase} logic in this file.`;
}

function extractCalls(snippet) {
  const calls = new Set();

  const memberCallRegex = /\b([A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
  let match = memberCallRegex.exec(snippet);
  while (match) {
    calls.add(match[1]);
    match = memberCallRegex.exec(snippet);
  }

  const simpleCallRegex = /\b([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
  const excluded = new Set(['if', 'for', 'while', 'switch', 'catch', 'return', 'function', 'class', 'new']);
  match = simpleCallRegex.exec(snippet);
  while (match) {
    const callee = match[1];
    if (!excluded.has(callee)) {
      calls.add(callee);
    }
    match = simpleCallRegex.exec(snippet);
  }

  return Array.from(calls).slice(0, 10);
}

async function getTreeSitterRuntime() {
  try {
    const parserModule = await import('tree-sitter');
    return parserModule.default;
  } catch {
    return null;
  }
}

async function getLanguageForExtension(ext) {
  const loader = TREE_SITTER_LANGUAGE_LOADERS[ext];
  if (!loader) return null;
  try {
    return await loader();
  } catch {
    return null;
  }
}

function collectImportsWithRegex(text) {
  const imports = new Set();

  const jsImportRegex = /import\s+[^'"\n]*from\s+['"]([^'"]+)['"]/g;
  const jsSideEffectImportRegex = /import\s+['"]([^'"]+)['"]/g;
  const requireRegex = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
  const pyFromRegex = /^\s*from\s+([A-Za-z0-9_\.]+)\s+import\s+/gm;
  const pyImportRegex = /^\s*import\s+([A-Za-z0-9_\.]+)/gm;
  const goImportRegex = /import\s*(?:\(\s*([\s\S]*?)\)|\s*"([^"]+)")/g;

  let m = jsImportRegex.exec(text);
  while (m) {
    imports.add(m[1]);
    m = jsImportRegex.exec(text);
  }

  m = jsSideEffectImportRegex.exec(text);
  while (m) {
    imports.add(m[1]);
    m = jsSideEffectImportRegex.exec(text);
  }

  m = requireRegex.exec(text);
  while (m) {
    imports.add(m[1]);
    m = requireRegex.exec(text);
  }

  m = pyFromRegex.exec(text);
  while (m) {
    imports.add(m[1]);
    m = pyFromRegex.exec(text);
  }

  m = pyImportRegex.exec(text);
  while (m) {
    imports.add(m[1]);
    m = pyImportRegex.exec(text);
  }

  m = goImportRegex.exec(text);
  while (m) {
    if (m[2]) {
      imports.add(m[2]);
    } else if (m[1]) {
      const block = m[1];
      const paths = block.match(/"([^"]+)"/g) || [];
      for (const p of paths) {
        imports.add(p.replace(/"/g, ''));
      }
    }
    m = goImportRegex.exec(text);
  }

  return Array.from(imports).slice(0, 40);
}

function collectFunctionsWithRegex(text) {
  const signatures = [];
  const patterns = [
    /\bfunction\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g,
    /\b(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g,
    /^\s*def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm,
    /^\s*func\s+(?:\([^)]*\)\s*)?([A-Za-z_][A-Za-z0-9_]*)\s*\(/gm,
    /\b(?:public|private|protected)?\s*(?:static\s+)?[A-Za-z_][A-Za-z0-9_<>,\[\]\s]*\s+([A-Za-z_][A-Za-z0-9_]*)\s*\([^;]*\)\s*\{/g
  ];

  for (const regex of patterns) {
    let match = regex.exec(text);
    while (match) {
      signatures.push({
        name: match[1],
        start: match.index
      });
      match = regex.exec(text);
    }
  }

  signatures.sort((a, b) => a.start - b.start);

  const unique = [];
  const seen = new Set();
  for (const item of signatures) {
    const key = `${item.name}:${item.start}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  const functions = [];
  for (let i = 0; i < unique.length; i += 1) {
    const current = unique[i];
    const next = unique[i + 1];
    const end = next ? Math.min(next.start, current.start + 1200) : Math.min(text.length, current.start + 1200);
    const snippet = text.slice(current.start, end);

    functions.push({
      name: current.name,
      purpose: inferPurposeFromName(current.name),
      calls: extractCalls(snippet)
    });
  }

  return functions.slice(0, 30);
}

function collectFunctionsWithTreeSitter(tree, text) {
  const nodes = [];

  const visit = (node) => {
    const type = node.type || '';
    if (type.includes('function') || type.includes('method')) {
      const snippet = text.slice(node.startIndex, Math.min(node.endIndex, node.startIndex + 1200));
      const header = text.slice(node.startIndex, Math.min(node.endIndex, node.startIndex + 240));
      const nameMatch = header.match(/([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
      const name = nameMatch ? nameMatch[1] : `anonymous_${node.startPosition.row + 1}`;
      nodes.push({
        name,
        purpose: inferPurposeFromName(name),
        calls: extractCalls(snippet)
      });
    }

    for (const child of node.namedChildren || []) {
      visit(child);
    }
  };

  visit(tree.rootNode);

  const deduped = [];
  const seen = new Set();
  for (const fn of nodes) {
    if (seen.has(fn.name)) continue;
    seen.add(fn.name);
    deduped.push(fn);
  }

  return deduped.slice(0, 30);
}

async function extractCodeSemantics(relPath, text, treeSitterParserCtor) {
  const ext = path.extname(relPath).toLowerCase();

  if (treeSitterParserCtor) {
    const language = await getLanguageForExtension(ext);
    if (language) {
      try {
        const parser = new treeSitterParserCtor();
        parser.setLanguage(language);
        const tree = parser.parse(text);

        return {
          parser: 'tree-sitter',
          imports: collectImportsWithRegex(text),
          functions: collectFunctionsWithTreeSitter(tree, text)
        };
      } catch {
        // Fall back to regex extraction.
      }
    }
  }

  return {
    parser: 'regex-fallback',
    imports: collectImportsWithRegex(text),
    functions: collectFunctionsWithRegex(text)
  };
}

function resolveInternalImport(importValue, currentPath, allPathsSet) {
  if (!importValue) return null;

  const normalizedImport = normalizePath(importValue);
  if (EXTERNAL_IMPORT_PREFIXES.some((prefix) => normalizedImport.startsWith(prefix))) {
    return null;
  }

  const baseDir = normalizePath(path.dirname(currentPath));
  const ext = path.extname(normalizedImport);

  const candidateRoots = [];
  if (normalizedImport.startsWith('./') || normalizedImport.startsWith('../')) {
    candidateRoots.push(normalizePath(path.normalize(path.join(baseDir, normalizedImport))));
  } else if (normalizedImport.startsWith('/')) {
    candidateRoots.push(normalizedImport.replace(/^\//, ''));
  } else if (normalizedImport.startsWith('@/')) {
    candidateRoots.push(normalizedImport.slice(2));
    candidateRoots.push(`src/${normalizedImport.slice(2)}`);
  } else if (normalizedImport.includes('.')) {
    candidateRoots.push(normalizedImport.replace(/\./g, '/'));
  }

  const extensionCandidates = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.py', '.go', '.java', '.cs', '.json'];

  for (const root of candidateRoots) {
    if (ext) {
      if (allPathsSet.has(root)) return root;
    }

    for (const suffix of extensionCandidates) {
      const candidate = `${root}${suffix}`;
      if (allPathsSet.has(candidate)) return candidate;
    }

    for (const suffix of extensionCandidates.slice(1)) {
      const candidate = `${root}/index${suffix}`;
      if (allPathsSet.has(candidate)) return candidate;
    }
  }

  return null;
}

function inferResponsibility(kind, relPath, featureTags, functionCount) {
  const primaryFeature = featureTags[0] || 'core';
  const baseName = path.basename(relPath);

  if (kind === 'service') {
    return `Provides ${primaryFeature} business logic and coordination used by other layers.`;
  }
  if (kind === 'component') {
    return `Implements ${primaryFeature} UI behavior and presentation for end users.`;
  }
  if (kind === 'api') {
    return `Handles ${primaryFeature} API routing or controller logic for external requests.`;
  }
  if (kind === 'hook') {
    return `Encapsulates reusable ${primaryFeature} stateful behavior for UI modules.`;
  }
  if (kind === 'util') {
    return `Supplies shared helper logic used across ${primaryFeature} flows.`;
  }
  if (kind === 'config') {
    return `Defines project or runtime configuration that affects ${primaryFeature} behavior.`;
  }

  return `Contains ${primaryFeature} module logic in ${baseName} with ${functionCount} key function(s).`;
}

function buildSummary(responsibility, dependsOn, usedBy, isEntryPoint) {
  const depsText = dependsOn.length === 0 ? 'no internal dependencies' : `${dependsOn.length} internal dependency file(s)`;
  const usedByText = usedBy.length === 0 ? 'is not referenced by indexed files yet' : `is used by ${usedBy.length} file(s)`;
  const entryText = isEntryPoint ? ' It acts as an entry point.' : '';
  return `${responsibility} It has ${depsText} and ${usedByText}.${entryText}`;
}

function buildNonCodeFunctions(text) {
  const lineCount = text ? text.split(/\r?\n/).length : 0;
  return lineCount > 0
    ? [{
      name: 'nonCodeMetadata',
      purpose: 'Provides lightweight metadata for retrieval without source dumping.',
      calls: []
    }]
    : [];
}

async function buildFileEntry(file, allPathsSet, treeSitterParserCtor) {
  const stat = fs.statSync(file.fullPath);
  const text = safeReadText(file.fullPath) || '';
  const language = detectLanguage(file.relPath);

  let parser = 'none';
  let imports = [];
  let functions = [];
  const codeLike = isCodeFile(file.relPath, text);

  if (codeLike) {
    const codeSemantics = await extractCodeSemantics(file.relPath, text, treeSitterParserCtor);
    parser = codeSemantics.parser;
    imports = codeSemantics.imports;
    functions = codeSemantics.functions;
  } else if (isStructuredText(file.relPath)) {
    parser = 'structured-lite';
    functions = buildNonCodeFunctions(text);
  }

  const kind = inferKind(file.relPath, language);
  const featureTags = inferFeatureTags(file.relPath, text);
  const dependsOn = imports
    .map((importPath) => resolveInternalImport(importPath, file.relPath, allPathsSet))
    .filter(Boolean);

  const uniqueDependsOn = Array.from(new Set(dependsOn)).slice(0, 40);
  const uniqueFunctions = Array.from(new Map(functions.map((fn) => [fn.name, fn])).values()).slice(0, 25);

  const responsibility = inferResponsibility(kind, file.relPath, featureTags, uniqueFunctions.length);
  const isEntryPoint = inferEntryPoint(file.relPath, kind, text);

  return {
    language,
    kind,
    responsibility,
    featureTags,
    dependsOn: uniqueDependsOn,
    usedBy: [],
    functions: uniqueFunctions,
    isEntryPoint,
    summary: buildSummary(responsibility, uniqueDependsOn, [], isEntryPoint),
    parser,
    mtimeMs: stat.mtimeMs,
    size: stat.size
  };
}

function createFeaturesMap(filesObject) {
  const features = {};

  for (const [filePath, entry] of Object.entries(filesObject)) {
    const tags = entry.featureTags.length > 0 ? entry.featureTags : ['core'];

    for (const tag of tags) {
      if (!features[tag]) {
        features[tag] = {
          files: [],
          entryPoints: []
        };
      }

      features[tag].files.push(filePath);
      if (entry.isEntryPoint) {
        features[tag].entryPoints.push(filePath);
      }
    }
  }

  for (const feature of Object.values(features)) {
    feature.files = Array.from(new Set(feature.files)).sort();
    feature.entryPoints = Array.from(new Set(feature.entryPoints)).sort();
  }

  return features;
}

function wireReverseDependencies(filesObject) {
  for (const entry of Object.values(filesObject)) {
    entry.usedBy = [];
  }

  for (const [filePath, entry] of Object.entries(filesObject)) {
    for (const dep of entry.dependsOn) {
      if (filesObject[dep]) {
        filesObject[dep].usedBy.push(filePath);
      }
    }
  }

  for (const entry of Object.values(filesObject)) {
    entry.usedBy = Array.from(new Set(entry.usedBy)).sort();
    entry.summary = buildSummary(entry.responsibility, entry.dependsOn, entry.usedBy, entry.isEntryPoint);
  }
}

function summarizeStats(filesObject, operationStats) {
  const stats = {
    ...operationStats,
    totalFiles: 0,
    codeOrCodeLikeFiles: 0,
    entryPoints: 0,
    kinds: {
      component: 0,
      service: 0,
      module: 0,
      util: 0,
      api: 0,
      hook: 0,
      config: 0,
      unknown: 0
    }
  };

  for (const entry of Object.values(filesObject)) {
    stats.totalFiles += 1;
    if (entry.parser !== 'none' || entry.kind === 'module') stats.codeOrCodeLikeFiles += 1;
    if (entry.isEntryPoint) stats.entryPoints += 1;
    if (Object.prototype.hasOwnProperty.call(stats.kinds, entry.kind)) {
      stats.kinds[entry.kind] += 1;
    }
  }

  return stats;
}

function compressIndexObject(indexObject) {
  return JSON.stringify(indexObject);
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

  const files = walkFiles(resolvedTarget);
  const allPathsSet = new Set(files.map((f) => f.relPath));
  const treeSitterParserCtor = await getTreeSitterRuntime();

  const previous = mode === 'incremental' ? loadExistingIndex(outputPath) : null;
  const previousFiles = previous && previous.files && typeof previous.files === 'object' ? previous.files : {};

  const nextFiles = {};
  const currentPathSet = new Set();
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

  for (const file of files) {
    const stat = fs.statSync(file.fullPath);
    const oldEntry = previousFiles[file.relPath];
    currentPathSet.add(file.relPath);

    const isUnchanged = mode === 'incremental' && oldEntry && oldEntry.mtimeMs === stat.mtimeMs && oldEntry.size === stat.size;

    if (isUnchanged) {
      nextFiles[file.relPath] = oldEntry;
      operationStats.reusedFiles += 1;
    } else {
      nextFiles[file.relPath] = await buildFileEntry(file, allPathsSet, treeSitterParserCtor);
      operationStats.reprocessedFiles += 1;
      if (!oldEntry) {
        operationStats.newFiles += 1;
      } else {
        operationStats.changedFiles += 1;
      }
    }

    operationStats.scannedFiles += 1;
  }

  if (mode === 'incremental') {
    for (const prevPath of Object.keys(previousFiles)) {
      if (!currentPathSet.has(prevPath)) {
        operationStats.deletedFiles += 1;
      }
    }
  }

  wireReverseDependencies(nextFiles);
  const features = createFeaturesMap(nextFiles);
  const stats = summarizeStats(nextFiles, operationStats);

  const finalObject = {
    version: 1,
    mode,
    metadataOnly: true,
    generatedAt: new Date().toISOString(),
    root: normalizePath(resolvedTarget),
    files: nextFiles,
    features,
    stats
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const tempPath = `${outputPath}.tmp`;
  fs.writeFileSync(tempPath, compressIndexObject(finalObject), 'utf8');
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
