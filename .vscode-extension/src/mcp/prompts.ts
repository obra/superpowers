import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SkillLoader } from './skillLoader.js';
import { getVSCodeToolMapping } from './toolMapping.js';

type PromptName = 'brainstorm' | 'debug' | 'tdd' | 'plan' | 'review';

interface PromptArgs {
  topic?: string;
  issue?: string;
  feature?: string;
  design?: string;
  context?: string;
}

interface PromptMessage {
  role: 'user' | 'assistant';
  content: { type: 'text'; text: string };
}

interface PromptResult {
  messages: PromptMessage[];
}

const skillMap: Record<PromptName, string> = {
  brainstorm: 'brainstorming',
  debug: 'systematic-debugging',
  tdd: 'test-driven-development',
  plan: 'writing-plans',
  review: 'requesting-code-review',
};

// Exported for unit testing
export function buildPrompt(
  loader: SkillLoader,
  name: PromptName,
  args: PromptArgs,
): PromptResult {
  const mapping = getVSCodeToolMapping();
  const skillContent = loader.loadSkill(skillMap[name]);
  const systemText = `${skillContent}\n\n${mapping}`;

  const userTextMap: Record<PromptName, string> = {
    brainstorm: `I want to brainstorm: ${args.topic ?? '(describe your feature or idea)'}`,
    debug: `I need to debug: ${args.issue ?? '(describe the bug or unexpected behavior)'}`,
    tdd: `Let's use TDD to build: ${args.feature ?? '(describe the feature or component)'}`,
    plan: `Create an implementation plan for: ${args.design ?? '(paste your design or describe what to build)'}`,
    review: `Please review my code. Context: ${args.context ?? '(describe what you implemented or which task you completed)'}`,
  };

  return {
    messages: [
      { role: 'user', content: { type: 'text', text: `${systemText}\n\n${userTextMap[name]}` } },
    ],
  };
}

/** Register all Superpowers prompt templates on an MCP server instance. */
export function registerPrompts(server: McpServer, loader: SkillLoader): void {
  server.prompt(
    'brainstorm',
    'Start a Superpowers brainstorming session to design a feature before writing code',
    { topic: z.string().describe('What you want to brainstorm (e.g., "a user authentication system")').optional() },
    (args) => buildPrompt(loader, 'brainstorm', args),
  );

  server.prompt(
    'debug',
    'Start a systematic 4-phase debugging session using the Superpowers systematic-debugging skill',
    { issue: z.string().describe('Description of the bug or unexpected behavior').optional() },
    (args) => buildPrompt(loader, 'debug', args),
  );

  server.prompt(
    'tdd',
    'Start a test-driven development session — RED → GREEN → REFACTOR cycle',
    { feature: z.string().describe('The feature or component to build with TDD').optional() },
    (args) => buildPrompt(loader, 'tdd', args),
  );

  server.prompt(
    'plan',
    'Create a detailed step-by-step implementation plan from a design or specification',
    { design: z.string().describe('Your design document or description of what to build').optional() },
    (args) => buildPrompt(loader, 'plan', args),
  );

  server.prompt(
    'review',
    'Request a code review against the original plan and coding standards',
    { context: z.string().describe('What you implemented — task name, description, or completed step').optional() },
    (args) => buildPrompt(loader, 'review', args),
  );
}
