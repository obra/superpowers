import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { buildPrompt } from '../src/mcp/prompts';
import { SkillLoader } from '../src/mcp/skillLoader';

const SKILLS_DIR = path.join(__dirname, '..', '..', 'skills');
const loader = new SkillLoader(SKILLS_DIR);

describe('buildPrompt()', () => {
  it('brainstorm prompt includes skill content and user topic', () => {
    const result = buildPrompt(loader, 'brainstorm', { topic: 'a login page' });
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].role).toBe('user');
    expect(result.messages[0].content.text).toContain('brainstorming');
    expect(result.messages[1].role).toBe('user');
    expect(result.messages[1].content.text).toContain('a login page');
  });

  it('debug prompt includes systematic-debugging skill content', () => {
    const result = buildPrompt(loader, 'debug', { issue: 'null pointer on line 42' });
    expect(result.messages[0].content.text).toContain('debugging');
    expect(result.messages[1].content.text).toContain('null pointer');
  });

  it('tdd prompt includes test-driven-development skill content', () => {
    const result = buildPrompt(loader, 'tdd', { feature: 'user registration' });
    expect(result.messages[0].content.text).toBeTruthy();
  });

  it('plan prompt includes writing-plans skill content', () => {
    const result = buildPrompt(loader, 'plan', { design: 'the auth module design doc' });
    expect(result.messages[0].content.text).toBeTruthy();
  });

  it('review prompt includes requesting-code-review skill content', () => {
    const result = buildPrompt(loader, 'review', { context: 'completed task 3' });
    expect(result.messages[0].content.text).toBeTruthy();
  });
});
