import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';

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
   * Parse YAML frontmatter from a Markdown file using gray-matter.
   */
  parseFrontmatter(raw: string): ParsedSkill {
    try {
      const parsed = matter(raw);
      return {
        frontmatter: parsed.data as Record<string, string>,
        body: parsed.content,
      };
    } catch (e) {
      return { frontmatter: {}, body: raw };
    }
  }
}
