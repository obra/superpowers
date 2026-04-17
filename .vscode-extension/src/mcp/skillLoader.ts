import * as fs from 'fs';
import * as path from 'path';

export interface SkillMeta {
  dirName: string;
  name: string;
  description: string;
}

export interface ParsedSkill {
  frontmatter: Record<string, string>;
  body: string;
}

export class SkillLoader {
  private skillsDir: string;
  private cache: Map<string, string> = new Map();

  constructor(skillsDir: string) {
    if (!fs.existsSync(skillsDir)) {
      throw new Error(`Skills directory not found: ${skillsDir}`);
    }
    this.skillsDir = skillsDir;
  }

  /**
   * List all skills by scanning directories that contain a SKILL.md file.
   * Reads frontmatter for name and description.
   */
  listSkills(): SkillMeta[] {
    const entries = fs.readdirSync(this.skillsDir, { withFileTypes: true });
    const skills: SkillMeta[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const skillPath = path.join(this.skillsDir, entry.name, 'SKILL.md');
      if (!fs.existsSync(skillPath)) continue;

      const raw = fs.readFileSync(skillPath, 'utf8');
      const { frontmatter } = this.parseFrontmatter(raw);

      skills.push({
        dirName: entry.name,
        name: frontmatter.name || entry.name,
        description: frontmatter.description || '',
      });
    }

    return skills.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Load a skill's content by directory name.
   * Strips YAML frontmatter, returns the body.
   * Throws if the skill directory or SKILL.md does not exist.
   */
  loadSkill(dirName: string): string {
    const cached = this.cache.get(dirName);
    if (cached !== undefined) return cached;

    const skillPath = path.join(this.skillsDir, dirName, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      throw new Error(`Skill not found: ${dirName} (looked in ${skillPath})`);
    }

    const raw = fs.readFileSync(skillPath, 'utf8');
    const { body } = this.parseFrontmatter(raw);
    this.cache.set(dirName, body);
    return body;
  }

  /**
   * Load the bootstrap context: using-superpowers skill content.
   */
  loadBootstrap(): string {
    return this.loadSkill('using-superpowers');
  }

  /**
   * Parse YAML frontmatter from a Markdown file.
   * Frontmatter is delimited by --- ... --- at the top.
   */
  parseFrontmatter(raw: string): ParsedSkill {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) {
      return { frontmatter: {}, body: raw };
    }

    const frontmatterStr = match[1];
    const body = match[2];
    const frontmatter: Record<string, string> = {};

    for (const line of frontmatterStr.split('\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx < 1) continue;
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
      frontmatter[key] = value;
    }

    return { frontmatter, body };
  }
}
