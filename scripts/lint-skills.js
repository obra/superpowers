#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const REQUIRED_FRONTMATTER = ['name', 'description'];
const FRONTMATTER_MAX_CHARS = 1024;
const SKILL_NAME_PATTERN = /^[A-Za-z0-9-]+$/;

const STALE_TOOL_PATTERNS = [
  {
    id: 'stale-tool-pattern',
    pattern: /\b(?:Read|Write|Edit|MultiEdit|Bash|Grep|Glob|LS|WebFetch|WebSearch)\s*\(/g,
    message: 'legacy tool-call syntax; prefer action wording or the per-platform tool mapping',
  },
  {
    id: 'stale-tool-pattern',
    pattern: /\bTask\s*\(\s*(?:general-purpose|superpowers:[^)]+|[a-z][a-z-]*)\s*\)/g,
    message: 'legacy Task(...) subagent syntax; use Subagent (general-purpose): or per-platform mapping',
  },
  {
    id: 'stale-tool-name',
    pattern: /\bTodoWrite\b/g,
    message: 'TodoWrite is platform-specific; prefer task-tracking action wording or per-platform mapping',
  },
];

const STALE_TOOL_ALLOWLIST = [
  {
    id: 'stale-tool-name',
    path: 'skills/using-superpowers/references/claude-code-tools.md',
    contains: 'TodoWrite',
    reason: 'Claude Code compatibility table documents the Agent SDK fallback name',
  },
  {
    id: 'stale-tool-name',
    path: 'skills/using-superpowers/references/antigravity-tools.md',
    contains: 'TodoWrite',
    reason: 'Antigravity compatibility table documents that this tool is not available',
  },
  {
    id: 'stale-tool-name',
    path: 'skills/using-superpowers/references/pi-tools.md',
    contains: 'TodoWrite',
    reason: 'Pi compatibility table maps older docs to the current task-tracking action',
  },
];

const PORTABLE_TILDE_PREFIXES = [
  '~/.agents/',
  '~/.claude/',
  '~/.codex/',
  '~/.config/superpowers/',
  '~/.copilot/',
  '~/.gemini/',
];

const HOME_PATH_PATTERNS = [
  /\/Users\/[A-Za-z0-9._-]+(?:\/[^\s`'")\]}]*)?/g,
  /\/home\/[A-Za-z0-9._-]+(?:\/[^\s`'")\]}]*)?/g,
  /[A-Za-z]:\\Users\\[A-Za-z0-9._-]+(?:\\[^\s`'")\]}]*)?/g,
  /~\/[^\s`'")\]}]*/g,
];

function usage() {
  return `Usage:
  scripts/lint-skills.js [--root <dir>] [--skills-dir <dir>] [path ...]

Checks SKILL.md frontmatter, skill-name/directory consistency, relative links,
stale tool names, and non-portable user-home paths.

By default, scans <root>/skills. Passing paths limits the scan to those files or
directories.`;
}

function parseArgs(argv) {
  const options = {
    root: process.cwd(),
    skillsDir: 'skills',
    paths: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '-h' || arg === '--help') {
      options.help = true;
    } else if (arg === '--root') {
      index += 1;
      if (!argv[index]) {
        throw new Error('--root requires a directory');
      }
      options.root = path.resolve(argv[index]);
    } else if (arg === '--skills-dir') {
      index += 1;
      if (!argv[index]) {
        throw new Error('--skills-dir requires a directory');
      }
      options.skillsDir = argv[index];
    } else if (arg === '--') {
      options.paths.push(...argv.slice(index + 1));
      break;
    } else if (arg.startsWith('-')) {
      throw new Error(`unknown option: ${arg}`);
    } else {
      options.paths.push(arg);
    }
  }

  return options;
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`error: ${error.message}`);
    console.error(usage());
    process.exit(2);
  }

  if (options.help) {
    console.log(usage());
    return;
  }

  const root = path.resolve(options.root);
  const issues = [];

  let skillFiles;
  try {
    skillFiles = collectSkillFiles(root, options.skillsDir, options.paths);
  } catch (error) {
    console.error(`error: ${error.message}`);
    process.exit(2);
  }

  if (skillFiles.length === 0) {
    console.error('error: no SKILL.md files found');
    process.exit(2);
  }

  const markdownFiles = collectMarkdownFilesForSkills(skillFiles);

  for (const skillFile of skillFiles) {
    lintSkillFile(root, skillFile, issues);
  }

  for (const markdownFile of markdownFiles) {
    lintStaleToolPatterns(root, markdownFile, issues);
  }

  issues.sort(compareIssues);

  if (issues.length === 0) {
    console.log(`Skill Doctor checked ${skillFiles.length} skill(s): no issues found.`);
    return;
  }

  console.log(`Skill Doctor found ${issues.length} issue(s) in ${skillFiles.length} skill(s):`);
  for (const issue of issues) {
    const location = `${relativeTo(root, issue.file)}:${issue.line}:${issue.column}`;
    console.log(`${location} [${issue.rule}] ${issue.message}`);
  }
  process.exit(1);
}

function collectSkillFiles(root, skillsDir, requestedPaths) {
  const files = new Set();
  const searchRoots = requestedPaths.length > 0
    ? requestedPaths.map((requestedPath) => resolveRequestedPath(root, requestedPath))
    : [path.isAbsolute(skillsDir) ? skillsDir : path.join(root, skillsDir)];

  for (const searchRoot of searchRoots) {
    if (!fs.existsSync(searchRoot)) {
      throw new Error(`path does not exist: ${searchRoot}`);
    }

    const stat = fs.statSync(searchRoot);
    if (stat.isFile()) {
      if (path.basename(searchRoot) === 'SKILL.md') {
        files.add(searchRoot);
      }
      continue;
    }

    if (stat.isDirectory()) {
      for (const skillFile of findFiles(searchRoot, 'SKILL.md')) {
        files.add(skillFile);
      }
    }
  }

  return [...files].sort();
}

function resolveRequestedPath(root, requestedPath) {
  return path.isAbsolute(requestedPath)
    ? requestedPath
    : path.resolve(root, requestedPath);
}

function collectMarkdownFilesForSkills(skillFiles) {
  const files = new Set();
  for (const skillFile of skillFiles) {
    for (const markdownFile of findMarkdownFiles(path.dirname(skillFile))) {
      files.add(markdownFile);
    }
  }
  return [...files].sort();
}

function findFiles(startDir, basename) {
  const results = [];
  const entries = fs.readdirSync(startDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(startDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath, basename));
    } else if (entry.isFile() && entry.name === basename) {
      results.push(fullPath);
    }
  }
  return results;
}

function findMarkdownFiles(startDir) {
  const results = [];
  const entries = fs.readdirSync(startDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(startDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

function lintSkillFile(root, file, issues) {
  const content = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const frontmatter = parseFrontmatter(content);

  for (const issue of frontmatter.issues) {
    issues.push({ file, ...issue });
  }

  for (const field of REQUIRED_FRONTMATTER) {
    const value = frontmatter.fields[field]?.value.trim() ?? '';
    if (!value) {
      issues.push({
        file,
        line: frontmatter.fields[field]?.line ?? 1,
        column: 1,
        rule: `frontmatter-${field}`,
        message: `missing required frontmatter field: ${field}`,
      });
    }
  }

  const actualName = frontmatter.fields.name?.value.trim();
  const expectedName = path.basename(path.dirname(file));
  if (frontmatter.rawLength > FRONTMATTER_MAX_CHARS) {
    issues.push({
      file,
      line: 1,
      column: 1,
      rule: 'frontmatter-size',
      message: `frontmatter is ${frontmatter.rawLength} characters; keep it at or below ${FRONTMATTER_MAX_CHARS}`,
    });
  }

  if (actualName && !SKILL_NAME_PATTERN.test(actualName)) {
    issues.push({
      file,
      line: frontmatter.fields.name.line,
      column: 1,
      rule: 'frontmatter-name-format',
      message: `frontmatter name "${actualName}" must use only letters, numbers, and hyphens`,
    });
  }

  if (actualName && actualName !== expectedName) {
    issues.push({
      file,
      line: frontmatter.fields.name.line,
      column: 1,
      rule: 'frontmatter-name-match',
      message: `frontmatter name "${actualName}" must match directory "${expectedName}"`,
    });
  }

  lintMarkdownLinks(file, content, issues);
  lintHomePaths(file, content, issues);
}

function parseFrontmatter(content) {
  const lines = content.split(/\r?\n/);
  const fields = {};
  const issues = [];

  if ((lines[0] ?? '').trim() !== '---') {
    return {
      fields,
      rawLength: 0,
      issues: [{
        line: 1,
        column: 1,
        rule: 'frontmatter-block',
        message: 'missing YAML frontmatter block at top of SKILL.md',
      }],
    };
  }

  let closingIndex = -1;
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].trim() === '---') {
      closingIndex = index;
      break;
    }
  }

  if (closingIndex === -1) {
    return {
      fields,
      rawLength: 0,
      issues: [{
        line: 1,
        column: 1,
        rule: 'frontmatter-block',
        message: 'frontmatter block is not closed',
      }],
    };
  }

  for (let index = 1; index < closingIndex; index += 1) {
    const line = lines[index];
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!match) {
      continue;
    }

    fields[match[1]] = {
      value: unquoteYamlScalar(match[2].trim()),
      line: index + 1,
    };
  }

  return {
    fields,
    rawLength: lines.slice(0, closingIndex + 1).join('\n').length,
    issues,
  };
}

function unquoteYamlScalar(value) {
  if (value.length < 2) {
    return value;
  }

  const first = value[0];
  const last = value[value.length - 1];
  if ((first === '"' && last === '"') || (first === '\'' && last === '\'')) {
    return value.slice(1, -1);
  }
  return value;
}

function lintMarkdownLinks(file, content, issues) {
  const masked = maskFencedCode(content);
  const lineStarts = buildLineStarts(masked);
  const links = /!?\[[^\]\n]*\]\(([^)\n]+)\)/g;
  let match;

  while ((match = links.exec(masked)) !== null) {
    const rawTarget = match[1].trim();
    const target = normalizeMarkdownLinkTarget(rawTarget);
    if (!target || shouldSkipLinkTarget(target)) {
      continue;
    }

    const hashIndex = target.indexOf('#');
    const targetPathRaw = hashIndex === -1 ? target : target.slice(0, hashIndex);
    const anchorRaw = hashIndex === -1 ? '' : target.slice(hashIndex + 1);
    const targetPath = stripQueryString(safeDecodeURIComponent(targetPathRaw));
    const targetFile = targetPath
      ? path.resolve(path.dirname(file), targetPath)
      : file;
    const { line, column } = lineColumnFor(lineStarts, match.index + match[0].indexOf(match[1]));

    if (targetPath && !fs.existsSync(targetFile)) {
      issues.push({
        file,
        line,
        column,
        rule: 'markdown-link-target',
        message: `relative markdown link target does not exist: ${targetPathRaw}`,
      });
      continue;
    }

    if (!anchorRaw) {
      continue;
    }

    if (!fs.existsSync(targetFile) || fs.statSync(targetFile).isDirectory() || !isMarkdownFile(targetFile)) {
      continue;
    }

    const anchors = markdownAnchorsFor(targetFile);
    const anchor = safeDecodeURIComponent(anchorRaw).trim();
    if (!anchors.has(anchor)) {
      issues.push({
        file,
        line,
        column,
        rule: 'markdown-link-anchor',
        message: `markdown anchor not found in ${relativeTo(path.dirname(file), targetFile)}: #${anchorRaw}`,
      });
    }
  }
}

function normalizeMarkdownLinkTarget(rawTarget) {
  if (rawTarget.startsWith('<')) {
    const closeIndex = rawTarget.indexOf('>');
    if (closeIndex !== -1) {
      return rawTarget.slice(1, closeIndex);
    }
  }

  const match = /^(\S+)/.exec(rawTarget);
  return match ? match[1] : rawTarget;
}

function shouldSkipLinkTarget(target) {
  return target.startsWith('//')
    || target.startsWith('/')
    || /^[a-z][a-z0-9+.-]*:/i.test(target);
}

function stripQueryString(targetPath) {
  const queryIndex = targetPath.indexOf('?');
  return queryIndex === -1 ? targetPath : targetPath.slice(0, queryIndex);
}

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isMarkdownFile(file) {
  return path.basename(file) === 'SKILL.md' || path.extname(file).toLowerCase() === '.md';
}

function markdownAnchorsFor(file) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  const anchors = new Set();
  const seen = new Map();
  let inFence = false;
  let fenceMarker = '';

  for (const line of lines) {
    const fence = /^(\s*)(`{3,}|~{3,})/.exec(line);
    if (fence) {
      const marker = fence[2][0];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
      } else if (marker === fenceMarker) {
        inFence = false;
        fenceMarker = '';
      }
      continue;
    }

    if (inFence) {
      continue;
    }

    for (const htmlAnchor of line.matchAll(/<a\s+[^>]*(?:id|name)=["']([^"']+)["'][^>]*>/gi)) {
      anchors.add(htmlAnchor[1]);
    }

    const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!heading) {
      continue;
    }

    let headingText = heading[2].trim();
    const explicitAnchor = /\s*\{#([^}]+)\}\s*$/.exec(headingText);
    if (explicitAnchor) {
      anchors.add(explicitAnchor[1]);
      headingText = headingText.slice(0, explicitAnchor.index).trim();
    }

    const baseSlug = githubHeadingSlug(headingText);
    if (!baseSlug) {
      continue;
    }

    const count = seen.get(baseSlug) ?? 0;
    seen.set(baseSlug, count + 1);
    anchors.add(count === 0 ? baseSlug : `${baseSlug}-${count}`);
  }

  return anchors;
}

function githubHeadingSlug(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[`*_~]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function lintHomePaths(file, content, issues) {
  const lineStarts = buildLineStarts(content);

  for (const pattern of HOME_PATH_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const value = match[0];
      if (isAllowedHomePath(value)) {
        continue;
      }

      const { line, column } = lineColumnFor(lineStarts, match.index);
      issues.push({
        file,
        line,
        column,
        rule: 'portable-path',
        message: `non-portable user-home path: ${value}`,
      });
    }
  }
}

function isAllowedHomePath(value) {
  if (!value.startsWith('~/')) {
    return false;
  }
  return PORTABLE_TILDE_PREFIXES.some((prefix) => value === prefix.slice(0, -1) || value.startsWith(prefix));
}

function lintStaleToolPatterns(root, file, issues) {
  const content = fs.readFileSync(file, 'utf8');
  const lineStarts = buildLineStarts(content);
  const relativePath = relativeTo(root, file);

  for (const stalePattern of STALE_TOOL_PATTERNS) {
    stalePattern.pattern.lastIndex = 0;
    let match;
    while ((match = stalePattern.pattern.exec(content)) !== null) {
      if (isAllowedStaleToolMatch(relativePath, stalePattern.id, match[0])) {
        continue;
      }

      const { line, column } = lineColumnFor(lineStarts, match.index);
      issues.push({
        file,
        line,
        column,
        rule: stalePattern.id,
        message: `${stalePattern.message}: ${match[0]}`,
      });
    }
  }
}

function isAllowedStaleToolMatch(relativePath, id, matchText) {
  return STALE_TOOL_ALLOWLIST.some((entry) => (
    entry.id === id
    && entry.path === relativePath
    && matchText.includes(entry.contains)
  ));
}

function maskFencedCode(content) {
  const lines = content.split(/(\r?\n)/);
  let inFence = false;
  let fenceMarker = '';

  return lines.map((part) => {
    if (part === '\n' || part === '\r\n') {
      return part;
    }

    const fence = /^(\s*)(`{3,}|~{3,})/.exec(part);
    if (fence) {
      const marker = fence[2][0];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker;
      } else if (marker === fenceMarker) {
        inFence = false;
        fenceMarker = '';
      }
      return ' '.repeat(part.length);
    }

    if (inFence) {
      return ' '.repeat(part.length);
    }

    return part;
  }).join('');
}

function buildLineStarts(content) {
  const starts = [0];
  for (let index = 0; index < content.length; index += 1) {
    if (content[index] === '\n') {
      starts.push(index + 1);
    }
  }
  return starts;
}

function lineColumnFor(lineStarts, index) {
  let low = 0;
  let high = lineStarts.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lineStarts[mid] <= index) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const lineIndex = Math.max(0, high);
  return {
    line: lineIndex + 1,
    column: index - lineStarts[lineIndex] + 1,
  };
}

function relativeTo(root, file) {
  const relativePath = path.relative(root, file).split(path.sep).join('/');
  return relativePath || '.';
}

function compareIssues(a, b) {
  return relativeTo('/', a.file).localeCompare(relativeTo('/', b.file))
    || a.line - b.line
    || a.column - b.column
    || a.rule.localeCompare(b.rule)
    || a.message.localeCompare(b.message);
}

main();
