/**
 * skills.js
 *
 * Discovers and reads skills from the skills/ directory.
 * Serves skills/[name]/SKILL.md -- universal/skills/ is ignored (mirror only).
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { parseFrontmatter } from './frontmatter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Canonical paths -- resolved relative to this file's location in .mcp/lib/
export const SKILLS_DIR   = path.resolve(__dirname, '../../skills');
export const UNIVERSAL_DIR = path.resolve(__dirname, '../../universal');

/**
 * List all skills by scanning skills/[name]/SKILL.md and reading frontmatter only.
 * Body content is NOT read here -- preserves lazy loading.
 *
 * @returns {Array<{ name: string, description: string }>}
 */
export function listSkills() {
  if (!fs.existsSync(SKILLS_DIR)) {
    throw new Error(`Skills directory not found: ${SKILLS_DIR}`);
  }

  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  const skills = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillFile = path.join(SKILLS_DIR, entry.name, 'SKILL.md');
    if (!fs.existsSync(skillFile)) continue;

    const raw = fs.readFileSync(skillFile, 'utf8');
    const { frontmatter } = parseFrontmatter(raw);

    skills.push({
      name: frontmatter.name || entry.name,
      description: frontmatter.description || '',
    });
  }

  // Sort alphabetically for stable output
  skills.sort((a, b) => a.name.localeCompare(b.name));
  return skills;
}

/**
 * Load a single skill's full body content (frontmatter stripped).
 *
 * @param {string} name - Skill directory name (e.g. "brainstorming")
 * @returns {{ name: string, description: string, content: string }}
 * @throws {Error} if skill not found
 */
export function loadSkill(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('Skill name must be a non-empty string');
  }

  // Sanitize: reject any path traversal attempts
  const safeName = path.basename(name);
  if (safeName !== name) {
    throw new Error(`Invalid skill name: "${name}"`);
  }

  const skillFile = path.join(SKILLS_DIR, safeName, 'SKILL.md');
  if (!fs.existsSync(skillFile)) {
    throw new Error(`Skill not found: "${name}"`);
  }

  const raw = fs.readFileSync(skillFile, 'utf8');
  const { frontmatter, body } = parseFrontmatter(raw);

  return {
    name: frontmatter.name || safeName,
    description: frontmatter.description || '',
    content: body,
  };
}

/**
 * Read universal/CAPABILITIES.md content.
 *
 * @returns {string}
 */
export function readCapabilities() {
  const capFile = path.join(UNIVERSAL_DIR, 'CAPABILITIES.md');
  if (!fs.existsSync(capFile)) {
    throw new Error(`CAPABILITIES.md not found: ${capFile}`);
  }
  return fs.readFileSync(capFile, 'utf8');
}

/**
 * Read universal/bootstrap.md content.
 *
 * @returns {string}
 */
export function readBootstrap() {
  const bootstrapFile = path.join(UNIVERSAL_DIR, 'bootstrap.md');
  if (!fs.existsSync(bootstrapFile)) {
    throw new Error(`bootstrap.md not found: ${bootstrapFile}`);
  }
  return fs.readFileSync(bootstrapFile, 'utf8');
}
