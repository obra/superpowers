#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(MODULE_DIR, '..');
const SOURCE_PATH = path.join(ROOT, 'agents', 'code-reviewer.instructions.md');
const COPILOT_AGENT_PATH = path.join(ROOT, 'agents', 'code-reviewer.md');
const CODEX_AGENT_PATH = path.join(ROOT, '.codex', 'agents', 'code-reviewer.toml');
const GENERATOR_CMD = 'node scripts/gen-agent-docs.mjs';
const DRY_RUN = process.argv.includes('--check');

function readSource() {
  const raw = fs.readFileSync(SOURCE_PATH, 'utf8');
  if (!raw.startsWith('---\n')) {
    throw new Error(`${SOURCE_PATH} must start with YAML frontmatter.`);
  }

  const frontmatterEnd = raw.indexOf('\n---\n', 4);
  if (frontmatterEnd === -1) {
    throw new Error(`Failed to locate closing frontmatter delimiter in ${SOURCE_PATH}.`);
  }

  const frontmatter = raw.slice(4, frontmatterEnd);
  const body = raw.slice(frontmatterEnd + 5).replace(/^\n+/, '').trimEnd();
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  const blockDescriptionMatch = frontmatter.match(/^description:\s*\|\n((?:[ \t].*\n?)*)/m);
  const scalarDescriptionMatch = frontmatter.match(/^description:\s*(.+)$/m);

  if (!nameMatch) {
    throw new Error(`Missing name in ${SOURCE_PATH} frontmatter.`);
  }

  let description = '';
  if (blockDescriptionMatch) {
    description = blockDescriptionMatch[1]
      .replace(/^[ \t]+/gm, '')
      .replace(/\n+$/, '');
  } else if (scalarDescriptionMatch) {
    description = scalarDescriptionMatch[1].trim();
  } else {
    throw new Error(`Missing description in ${SOURCE_PATH} frontmatter.`);
  }

  return {
    name: nameMatch[1].trim(),
    description,
    body,
  };
}

function escapeTomlBasicString(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function escapeTomlMultilineBasicString(value) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"""/g, '\\"""')
    .replace(/"/g, '\\"');
}

function insertMarkdownHeader(content) {
  const header =
    '<!-- AUTO-GENERATED from agents/code-reviewer.instructions.md — do not edit directly -->\n' +
    `<!-- Regenerate: ${GENERATOR_CMD} -->`;

  const frontmatterEnd = content.indexOf('\n---\n', 4);
  if (frontmatterEnd === -1) {
    throw new Error('Failed to locate closing frontmatter delimiter in generated markdown agent.');
  }

  const prefix = content.slice(0, frontmatterEnd + 5);
  const suffix = content.slice(frontmatterEnd + 5).replace(/^\n+/, '');
  return `${prefix}${header}\n\n${suffix}`;
}

function buildCopilotAgent({ name, description, body }) {
  const lines = [
    '---',
    `name: ${name}`,
    'description: |',
    ...description.split('\n').map((line) => `  ${line}`),
    'model: inherit',
    '---',
    '',
    body,
  ];
  return `${insertMarkdownHeader(lines.join('\n'))}\n`;
}

function buildCodexAgent({ name, description, body }) {
  const condensedDescription = description.replace(/\s+/g, ' ').trim();
  const escapedBody = escapeTomlMultilineBasicString(body);
  return [
    '# AUTO-GENERATED from agents/code-reviewer.instructions.md — do not edit directly',
    `# Regenerate: ${GENERATOR_CMD}`,
    `name = "${escapeTomlBasicString(name)}"`,
    `description = "${escapeTomlBasicString(condensedDescription)}"`,
    'developer_instructions = """',
    escapedBody,
    '"""',
    '',
  ].join('\n');
}

function writeIfChanged(filePath, content, stale) {
  if (DRY_RUN) {
    const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
    if (current !== content) {
      stale.push(path.relative(ROOT, filePath));
    }
    return;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function main() {
  const source = readSource();
  const stale = [];

  writeIfChanged(COPILOT_AGENT_PATH, buildCopilotAgent(source), stale);
  writeIfChanged(CODEX_AGENT_PATH, buildCodexAgent(source), stale);

  if (DRY_RUN) {
    if (stale.length > 0) {
      console.error('Generated agent docs are stale:');
      for (const file of stale) {
        console.error(`- ${file}`);
      }
      process.exit(1);
    }
    console.log('Generated agent docs are up to date.');
  }
}

main();
