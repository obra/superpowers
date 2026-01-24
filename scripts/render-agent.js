#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

function arg(name) {
  const idx = args.indexOf(name);
  return idx === -1 ? null : args[idx + 1];
}

const agent = arg('--agent');
const outDirArg = arg('--out');
const targetsArg = arg('--targets');
const checkOnly = args.includes('--check');
const writeInPlace = args.includes('--write');

if (!agent) {
  console.error('Usage: node scripts/render-agent.js --agent <name> [--out <dir>] [--check] [--write] [--targets <file>]');
  process.exit(1);
}

const repoRoot = path.resolve(__dirname, '..');
const templatesDir = path.join(repoRoot, 'templates');
const targetsPath = targetsArg ? path.resolve(targetsArg) : path.join(templatesDir, 'targets.json');
const agentPath = path.join(repoRoot, 'agents', `${agent}.json`);

if (!fs.existsSync(targetsPath)) {
  throw new Error(`Missing targets: ${targetsPath}`);
}
if (!fs.existsSync(agentPath)) {
  throw new Error(`Missing agent config: ${agentPath}`);
}

const targets = JSON.parse(fs.readFileSync(targetsPath, 'utf8'));
const agentConfig = JSON.parse(fs.readFileSync(agentPath, 'utf8'));
const agentTargets = targets[agent];

if (!agentTargets) {
  throw new Error(`Unknown agent "${agent}". Valid: ${Object.keys(targets).join(', ')}`);
}

const partialsDir = path.join(templatesDir, '_partials');
const unresolved = [];

function loadPartial(name, templateExt) {
  const ext = path.extname(name) || (templateExt || '');
  const extName = ext.startsWith('.') ? ext.slice(1) : ext;
  const base = ext ? name.slice(0, -ext.length) : name;

  const candidateAgent = path.join(partialsDir, `${base}.${agent}.${extName}`);
  const candidateDefault = path.join(partialsDir, `${base}.${extName}`);

  if (fs.existsSync(candidateAgent)) return fs.readFileSync(candidateAgent, 'utf8');
  if (fs.existsSync(candidateDefault)) return fs.readFileSync(candidateDefault, 'utf8');

  throw new Error(`Missing partial "${name}" for agent "${agent}" (looked for ${candidateAgent} or ${candidateDefault})`);
}

function resolvePartials(content, templatePath) {
  const templateExt = path.extname(templatePath);
  const includePattern = /\{\{\>\s*([a-zA-Z0-9._/-]+)\s*\}\}/g;
  let updated = content;
  let iterations = 0;

  while (true) {
    const next = updated.replace(includePattern, (_, name) => loadPartial(name, templateExt));
    if (next === updated) break;
    updated = next;
    iterations += 1;
    if (iterations > 20) {
      throw new Error(`Too many partial resolution passes for ${templatePath}`);
    }
  }

  return updated;
}

function renderTemplate(content, templatePath) {
  let rendered = resolvePartials(content, templatePath);

  rendered = rendered.replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (match, key) => {
    if (!(key in agentConfig)) return match;
    return agentConfig[key];
  });

  return rendered;
}

function walkFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

const expandedTargets = [];
for (const target of agentTargets) {
  if (target.dir) {
    const templateDir = path.join(templatesDir, target.dir);
    const outDir = target.outDir ? target.outDir : target.dir;
    if (!fs.existsSync(templateDir)) {
      throw new Error(`Missing template dir: ${templateDir}`);
    }
    const files = walkFiles(templateDir);
    for (const filePath of files) {
      const rel = path.relative(templateDir, filePath);
      expandedTargets.push({
        template: path.join(target.dir, rel),
        out: path.join(outDir, rel)
      });
    }
  } else {
    expandedTargets.push(target);
  }
}

for (const target of expandedTargets) {
  const templatePath = path.join(templatesDir, target.template);
  const outPath = writeInPlace
    ? path.join(repoRoot, target.out)
    : path.join(outDirArg || path.join(repoRoot, 'generated', agent), target.out);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Missing template: ${templatePath}`);
  }

  const content = fs.readFileSync(templatePath, 'utf8');
  const rendered = renderTemplate(content, templatePath);

  const leftovers = rendered.match(/\{\{\s*[A-Z0-9_]+\s*\}\}/g);
  if (leftovers) {
    unresolved.push({ file: target.template, placeholders: leftovers });
  }
  if (/\{\{\>/.test(rendered)) {
    unresolved.push({ file: target.template, placeholders: ['{{> ...}}'] });
  }

  if (!checkOnly) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, rendered);
  }
}

if (unresolved.length) {
  console.error('Unresolved placeholders:');
  for (const entry of unresolved) {
    console.error(`- ${entry.file}: ${entry.placeholders.join(', ')}`);
  }
  process.exit(1);
}

console.log(`Rendered ${expandedTargets.length} files for ${agent}${checkOnly ? ' (check only)' : ''}.`);
