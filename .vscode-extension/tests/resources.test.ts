import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { buildBootstrapContent, buildSkillResourceContent } from '../src/mcp/resources';
import { SkillLoader } from '../src/mcp/skillLoader';

const SKILLS_DIR = path.join(__dirname, '..', '..', 'skills');
const loader = new SkillLoader(SKILLS_DIR);

describe('buildBootstrapContent()', () => {
  it('returns a string containing superpowers content', () => {
    const content = buildBootstrapContent(loader);
    expect(content).toBeTruthy();
    expect(content).toContain('Superpowers');
  });

  it('includes VS Code tool mapping', () => {
    const content = buildBootstrapContent(loader);
    expect(content).toContain('VS Code / MCP Tool Mapping');
  });
});

describe('buildSkillResourceContent()', () => {
  it('returns skill content for brainstorming', () => {
    const content = buildSkillResourceContent(loader, 'brainstorming');
    expect(content).toContain('Brainstorm');
  });

  it('returns skill content for test-driven-development', () => {
    const content = buildSkillResourceContent(loader, 'test-driven-development');
    expect(content).toBeTruthy();
  });

  it('throws for unknown skill', () => {
    expect(() => buildSkillResourceContent(loader, 'nonexistent-xyz')).toThrow();
  });
});
