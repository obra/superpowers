import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { buildActivateSkillHandler, buildListSkillsHandler } from '../src/mcp/tools';
import { SkillLoader } from '../src/mcp/skillLoader';

const SKILLS_DIR = path.join(__dirname, '..', '..', 'skills');
const loader = new SkillLoader(SKILLS_DIR);

describe('activate_skill handler', () => {
  const handler = buildActivateSkillHandler(loader);

  it('returns skill content for a valid skill name', async () => {
    const result = await handler({ skillName: 'brainstorming' });
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Brainstorm');
  });

  it('appends VS Code tool mapping to response', async () => {
    const result = await handler({ skillName: 'brainstorming' });
    expect(result.content[0].text).toContain('VS Code / MCP Tool Mapping');
  });

  it('returns isError true for unknown skill', async () => {
    const result = await handler({ skillName: 'nonexistent-xyz' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('not found');
  });
});

describe('list_skills handler', () => {
  const handler = buildListSkillsHandler(loader);

  it('returns a list of skills', async () => {
    const result = await handler({});
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('brainstorming');
    expect(result.content[0].text).toContain('test-driven-development');
  });

  it('includes descriptions', async () => {
    const result = await handler({});
    expect(result.content[0].text).toContain('**');
  });
});
