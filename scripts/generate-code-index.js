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
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.py',
  '.rb',
  '.php',
  '.swift',
  '.kt',
  '.kts',
  '.go',
  '.rs',
  '.java',
  '.cs',
  '.c',
  '.h',
  '.cpp',
  '.cc',
  '.cxx',
  '.hpp',
  '.scala',
  '.dart',
  '.lua',
  '.r',
  '.pl',
  '.sql',
  '.sh',
  '.bash',
  '.zsh',
  '.ps1',
  '.psm1',
  '.psd1',
  '.clj',
  '.cljs',
  '.ex',
  '.exs',
  '.erl',
  '.hrl',
  '.fs',
  '.fsi',
  '.fsx',
  '.vue',
  '.svelte'
]);

const STRUCTURED_TEXT_EXTENSIONS = new Set([
  '.json',
  '.md',
  '.yaml',
  '.yml',
  '.toml'
]);

const CODE_FILENAMES = new Set([
  'Dockerfile',
  'Makefile',
  'Rakefile',
  'CMakeLists.txt'
]);

const TREE_SITTER_LANGUAGE_LOADERS = {
  '.js': [
    async () => (await import('tree-sitter-javascript')).default
  ],
  '.jsx': [
    async () => (await import('tree-sitter-javascript')).default
  ],
  '.ts': [
    async () => (await import('tree-sitter-typescript')).typescript
  ],
  '.tsx': [
    async () => (await import('tree-sitter-typescript')).tsx
  ],
  '.py': [
    async () => (await import('tree-sitter-python')).default
  ],
  '.go': [
    async () => (await import('tree-sitter-go')).default
  ],
  '.rs': [
    async () => (await import('tree-sitter-rust')).default
  ],
  '.java': [
    async () => (await import('tree-sitter-java')).default
  ],
  '.cs': [
    async () => (await import('tree-sitter-c-sharp')).default
  ]
};

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

function classifyFile(ext, baseName, text = null) {
  if (CODE_EXTENSIONS.has(ext) || CODE_FILENAMES.has(baseName)) return 'code';
  if (STRUCTURED_TEXT_EXTENSIONS.has(ext)) return 'structured-text';

  if (text !== null && looksCodeLike(text)) {
    return 'code';
  }

  return 'other';
}

function looksCodeLike(text) {
  const sample = text.slice(0, 4000);
  return (
    /(^|\n)\s*(import\s+|from\s+.+\s+import\s+|package\s+[A-Za-z_]|using\s+[A-Za-z_.]+;|#include\s+[<"]|module\s+[A-Za-z_]|namespace\s+[A-Za-z_])/.test(sample) ||
    /(^|\n)\s*(class|interface|struct|enum|def|fn|function)\s+[A-Za-z_]/.test(sample) ||
    /(^|\n)\s*#!/.test(sample)
  );
}

function walkFiles(targetDir, currentDir = targetDir, files = []) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relPath = path.relative(targetDir, fullPath);

    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) {
        continue;
      }
      walkFiles(targetDir, fullPath, files);
      continue;
    }

    if (entry.isFile()) {
      files.push({
        fullPath,
        relPath: normalizePath(relPath)
      });
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
    if (!fs.existsSync(indexPath)) {
      return null;
    }
    const raw = fs.readFileSync(indexPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function getLineCount(text) {
  if (!text) return 0;
  if (text.length === 0) return 0;
  return text.split(/\r?\n/).length;
}

function extractMarkdownMetadata(text) {
  const lines = text.split(/\r?\n/);
  let headingCount = 0;
  for (const line of lines) {
    if (/^\s{0,3}#{1,6}\s+/.test(line)) {
      headingCount += 1;
    }
  }

  return {
    lineCount: lines.length,
    headingCount
  };
}

function extractJsonMetadata(text) {
  const lineCount = getLineCount(text);
  try {
    const parsed = JSON.parse(text);
    const topLevelKeyCount = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? Object.keys(parsed).length
      : 0;

    return {
      lineCount,
      topLevelKeyCount
    };
  } catch {
    return {
      lineCount,
      topLevelKeyCount: 0,
      parseError: true
    };
  }
}

function extractYamlLikeMetadata(text) {
  const lines = text.split(/\r?\n/);
  let topLevelKeyCount = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    if (/^[A-Za-z0-9_.-]+\s*:\s*/.test(line)) {
      topLevelKeyCount += 1;
    }
  }

  return {
    lineCount: lines.length,
    estimatedTopLevelKeyCount: topLevelKeyCount
  };
}

function extractTomlMetadata(text) {
  const lines = text.split(/\r?\n/);
  let keyValueCount = 0;
  let tableCount = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    if (/^\[[^\]]+\]$/.test(line)) {
      tableCount += 1;
    } else if (/^[A-Za-z0-9_.-]+\s*=\s*/.test(line)) {
      keyValueCount += 1;
    }
  }

  return {
    lineCount: lines.length,
    tableCount,
    keyValueCount
  };
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
  const loaders = TREE_SITTER_LANGUAGE_LOADERS[ext] || [];
  for (const loadLanguage of loaders) {
    try {
      const language = await loadLanguage();
      if (language) return language;
    } catch {
      // Ignore missing language packages and fall back to lightweight parsing.
    }
  }
  return null;
}

function collectTreeSitterStructure(rootNode, source) {
  const result = {
    imports: [],
    classes: [],
    functions: []
  };

  const visit = (node) => {
    const type = node.type || '';

    if (type.includes('import')) {
      result.imports.push(source.slice(node.startIndex, node.endIndex).trim());
    }

    if (type.includes('class')) {
      result.classes.push({
        type,
        startLine: node.startPosition.row + 1,
        endLine: node.endPosition.row + 1
      });
    }

    if (type.includes('function') || type.includes('method')) {
      result.functions.push({
        type,
        startLine: node.startPosition.row + 1,
        endLine: node.endPosition.row + 1
      });
    }

    for (const child of node.namedChildren || []) {
      visit(child);
    }
  };

  visit(rootNode);

  return {
    imports: Array.from(new Set(result.imports)).slice(0, 200),
    classes: result.classes.slice(0, 500),
    functions: result.functions.slice(0, 2000)
  };
}

function collectRegexStructure(text) {
  const lines = text.split(/\r?\n/);
  const imports = [];
  const classes = [];
  const functions = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (/^(import\s+.+|from\s+.+\s+import\s+.+|using\s+.+;|#include\s+.+)$/.test(trimmed)) {
      imports.push(trimmed);
    }

    if (/\b(class|interface|struct|enum)\s+[A-Za-z_][A-Za-z0-9_]*/.test(trimmed)) {
      classes.push({
        type: 'declaration',
        startLine: i + 1,
        endLine: i + 1
      });
    }

    if (/\b(function\s+[A-Za-z_][A-Za-z0-9_]*\s*\(|def\s+[A-Za-z_][A-Za-z0-9_]*\s*\(|fn\s+[A-Za-z_][A-Za-z0-9_]*\s*\(|(public|private|protected)?\s*(static\s+)?[A-Za-z_][A-Za-z0-9_<>,\[\]\s]*\s+[A-Za-z_][A-Za-z0-9_]*\s*\()/.test(trimmed)) {
      functions.push({
        type: 'declaration',
        startLine: i + 1,
        endLine: i + 1
      });
    }
  }

  return {
    imports: Array.from(new Set(imports)).slice(0, 200),
    classes: classes.slice(0, 500),
    functions: functions.slice(0, 2000)
  };
}

async function extractCodeMetadata(filePath, ext, treeSitterParserCtor) {
  const text = safeReadText(filePath);
  if (text === null) {
    return {
      parser: 'unreadable',
      metadata: {
        imports: [],
        classes: [],
        functions: []
      }
    };
  }

  if (treeSitterParserCtor) {
    const language = await getLanguageForExtension(ext);
    if (language) {
      try {
        const parser = new treeSitterParserCtor();
        parser.setLanguage(language);
        const tree = parser.parse(text);
        return {
          parser: 'tree-sitter',
          metadata: collectTreeSitterStructure(tree.rootNode, text)
        };
      } catch {
        // Fall through to regex parser.
      }
    }
  }

  return {
    parser: 'regex-fallback',
    metadata: collectRegexStructure(text)
  };
}

async function buildIndexEntry(file, treeSitterParserCtor) {
  const ext = path.extname(file.relPath).toLowerCase();
  const stat = fs.statSync(file.fullPath);
  const baseName = path.basename(file.relPath);

  const baseEntry = {
    mtimeMs: stat.mtimeMs,
    size: stat.size
  };

  let type = classifyFile(ext, baseName, null);
  if (type === 'other') {
    const textProbe = safeReadText(file.fullPath);
    type = classifyFile(ext, baseName, textProbe);
  }

  if (type === 'code') {
    const codeData = await extractCodeMetadata(file.fullPath, ext, treeSitterParserCtor);
    return {
      ...baseEntry,
      type,
      parser: codeData.parser,
      metadata: codeData.metadata
    };
  }

  if (type === 'structured-text') {
    const structuredData = extractStructuredTextMetadata(file.fullPath, ext);
    return {
      ...baseEntry,
      type,
      parser: structuredData.parser,
      metadata: structuredData.metadata
    };
  }

  return {
    ...baseEntry,
    type,
    parser: 'none',
    metadata: {}
  };
}

function summarizeIndex(indexEntries) {
  const summary = {
    totalFiles: 0,
    codeFiles: 0,
    structuredTextFiles: 0,
    otherFiles: 0,
    treeSitterFiles: 0,
    fallbackCodeFiles: 0,
    unreadableFiles: 0
  };

  for (const entry of Object.values(indexEntries)) {
    summary.totalFiles += 1;
    if (entry.type === 'code') summary.codeFiles += 1;
    if (entry.type === 'structured-text') summary.structuredTextFiles += 1;
    if (entry.type === 'other') summary.otherFiles += 1;
    if (entry.parser === 'tree-sitter') summary.treeSitterFiles += 1;
    if (entry.parser === 'regex-fallback') summary.fallbackCodeFiles += 1;
    if (entry.parser === 'unreadable') summary.unreadableFiles += 1;
  }

  return summary;
}

function extractStructuredTextMetadata(filePath, ext) {
  const text = safeReadText(filePath);
  if (text === null) {
    return {
      parser: 'unreadable',
      metadata: { lineCount: 0 }
    };
  }

  if (ext === '.json') {
    return {
      parser: 'json-lite',
      metadata: extractJsonMetadata(text)
    };
  }

  if (ext === '.md') {
    return {
      parser: 'markdown-lite',
      metadata: extractMarkdownMetadata(text)
    };
  }

  if (ext === '.yaml' || ext === '.yml') {
    return {
      parser: 'yaml-lite',
      metadata: extractYamlLikeMetadata(text)
    };
  }

  if (ext === '.toml') {
    return {
      parser: 'toml-lite',
      metadata: extractTomlMetadata(text)
    };
  }

  return {
    parser: 'text-lite',
    metadata: { lineCount: getLineCount(text) }
  };
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
  const treeSitterParserCtor = await getTreeSitterRuntime();

  const previous = mode === 'incremental' ? loadExistingIndex(outputPath) : null;
  const previousEntries = {};
  if (previous && typeof previous === 'object') {
    for (const [k, v] of Object.entries(previous)) {
      if (k === '__meta') continue;
      previousEntries[k] = v;
    }
  }

  const nextIndex = {};
  const currentPathSet = new Set();
  const operationStats = {
    mode,
    scannedFiles: 0,
    previousIndexLoaded: previous !== null,
    reusedFiles: 0,
    newFiles: 0,
    changedFiles: 0,
    deletedFiles: 0,
    reprocessedFiles: 0
  };

  for (const file of files) {
    const stat = fs.statSync(file.fullPath);
    currentPathSet.add(file.relPath);

    const oldEntry = previousEntries[file.relPath];
    const isUnchanged =
      mode === 'incremental' &&
      oldEntry &&
      oldEntry.mtimeMs === stat.mtimeMs &&
      oldEntry.size === stat.size;

    if (isUnchanged) {
      nextIndex[file.relPath] = oldEntry;
      operationStats.reusedFiles += 1;
    } else {
      const entry = await buildIndexEntry(file, treeSitterParserCtor);
      nextIndex[file.relPath] = entry;
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
    for (const prevPath of Object.keys(previousEntries)) {
      if (!currentPathSet.has(prevPath)) {
        operationStats.deletedFiles += 1;
      }
    }
  }

  const inventoryStats = summarizeIndex(nextIndex);

  const finalObject = {
    __meta: {
      schemaVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      root: normalizePath(resolvedTarget),
      excludedDirectories: Array.from(EXCLUDED_DIRS),
      stats: {
        ...operationStats,
        ...inventoryStats
      }
    },
    ...nextIndex
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const tempPath = `${outputPath}.tmp`;
  fs.writeFileSync(tempPath, compressIndexObject(finalObject), 'utf8');
  fs.renameSync(tempPath, outputPath);

  return {
    outPath: outputPath,
    stats: finalObject.__meta.stats
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
