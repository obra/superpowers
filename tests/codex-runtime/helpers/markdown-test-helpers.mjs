import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const REPO_ROOT = path.resolve(__dirname, '../../..');
export const SKILLS_DIR = path.join(REPO_ROOT, 'skills');

export function listSkillDirs() {
  return fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function listGeneratedSkills() {
  return listSkillDirs().filter((dir) => {
    const tmplPath = path.join(SKILLS_DIR, dir, 'SKILL.md.tmpl');
    return fs.existsSync(tmplPath);
  });
}

export function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

export function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    return null;
  }

  const fields = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    fields[kv[1]] = kv[2];
  }
  return fields;
}

export function getGeneratedHeader(content) {
  const match = content.match(/<!-- AUTO-GENERATED from SKILL\.md\.tmpl — do not edit directly -->\n<!-- Regenerate: node scripts\/gen-skill-docs\.mjs -->/);
  return match ? match[0] : null;
}

export function findUnresolvedPlaceholders(content) {
  return content.match(/\{\{[A-Z_]+\}\}/g) ?? [];
}

export function extractSection(content, headingText) {
  const escaped = headingText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = content.match(new RegExp(`^## ${escaped}\\n([\\s\\S]*?)(?=^## |\\Z)`, 'm'));
  return match ? match[1].trimEnd() : null;
}

export function extractBashBlockUnderHeading(content, headingText) {
  const section = extractSection(content, headingText);
  if (!section) return null;
  const match = section.match(/```bash\n([\s\S]*?)\n```/);
  return match ? match[1] : null;
}

export function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

export function countOccurrences(content, literal) {
  if (!literal) return 0;
  return content.split(literal).length - 1;
}
