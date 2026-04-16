import { describe, it, expect, beforeAll } from 'vitest';
import * as path from 'path';
import { SkillLoader } from '../src/mcp/skillLoader';

// Point to the real skills directory relative to the repo root
const SKILLS_DIR = path.join(__dirname, '..', '..', 'skills');

let loader: SkillLoader;

beforeAll(() => {
  loader = new SkillLoader(SKILLS_DIR);
});

describe('SkillLoader.listSkills()', () => {
  it('returns a non-empty array', () => {
    const skills = loader.listSkills();
    expect(skills.length).toBeGreaterThan(0);
  });

  it('each skill has a name and description', () => {
    const skills = loader.listSkills();
    for (const skill of skills) {
      expect(skill.name, `skill ${skill.dirName} is missing name`).toBeTruthy();
      expect(skill.description, `skill ${skill.dirName} is missing description`).toBeTruthy();
      expect(skill.dirName, `skill entry missing dirName`).toBeTruthy();
    }
  });

  it('includes brainstorming skill', () => {
    const skills = loader.listSkills();
    const found = skills.find(s => s.dirName === 'brainstorming');
    expect(found).toBeDefined();
    expect(found!.name).toBe('brainstorming');
  });

  it('includes test-driven-development skill', () => {
    const skills = loader.listSkills();
    const found = skills.find(s => s.dirName === 'test-driven-development');
    expect(found).toBeDefined();
  });
});

describe('SkillLoader.loadSkill()', () => {
  it('returns content for a known skill', () => {
    const content = loader.loadSkill('brainstorming');
    expect(content).toBeTruthy();
    expect(content.length).toBeGreaterThan(100);
  });

  it('strips YAML frontmatter from content', () => {
    const content = loader.loadSkill('brainstorming');
    expect(content).not.toContain('---\nname:');
    expect(content).not.toMatch(/^---\n/);
  });

  it('throws on unknown skill name', () => {
    expect(() => loader.loadSkill('nonexistent-skill-xyz')).toThrow();
  });
});

describe('SkillLoader.loadBootstrap()', () => {
  it('returns using-superpowers content', () => {
    const content = loader.loadBootstrap();
    expect(content).toBeTruthy();
    expect(content).toContain('Superpowers');
  });
});

describe('SkillLoader.parseFrontmatter()', () => {
  it('extracts name and description', () => {
    const raw = `---\nname: my-skill\ndescription: "Does something"\n---\n\n# Body`;
    const result = loader.parseFrontmatter(raw);
    expect(result.frontmatter.name).toBe('my-skill');
    expect(result.frontmatter.description).toBe('Does something');
    expect(result.body).toContain('# Body');
  });

  it('handles content without frontmatter', () => {
    const raw = `# Just a heading\n\nSome content.`;
    const result = loader.parseFrontmatter(raw);
    expect(result.frontmatter).toEqual({});
    expect(result.body).toContain('# Just a heading');
  });
});
