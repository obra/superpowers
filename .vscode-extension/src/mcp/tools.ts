import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SkillLoader } from './skillLoader.js';
import { getVSCodeToolMapping } from './toolMapping.js';

// Exported for testing — pure handler functions with no MCP dependency
export function buildActivateSkillHandler(loader: SkillLoader) {
  return async (input: { skillName: string }) => {
    try {
      const body = loader.loadSkill(input.skillName);
      const mapping = getVSCodeToolMapping();
      return {
        content: [{
          type: 'text' as const,
          text: `# Skill: ${input.skillName}\n\n${body}\n\n${mapping}`,
        }],
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [{
          type: 'text' as const,
          text: `Skill not found: "${input.skillName}". ${message}\n\nUse list_skills to see available skills.`,
        }],
      };
    }
  };
}

export function buildListSkillsHandler(loader: SkillLoader) {
  return async (_input: Record<string, never>) => {
    const skills = loader.listSkills();
    const lines = skills.map(s => `- **${s.name}** (\`${s.dirName}\`): ${s.description}`);
    return {
      content: [{
        type: 'text' as const,
        text: `# Available Superpowers Skills\n\n${lines.join('\n')}\n\nUse \`activate_skill\` with the name in backticks to load a skill.`,
      }],
    };
  };
}

/** Register all Superpowers tools on an MCP server instance. */
export function registerTools(server: McpServer, loader: SkillLoader): void {
  const activateHandler = buildActivateSkillHandler(loader);
  const listHandler = buildListSkillsHandler(loader);

  server.tool(
    'activate_skill',
    'Load and activate a Superpowers development workflow skill. Returns the full skill content that you MUST follow. ' +
    'Available skills: brainstorming, test-driven-development, systematic-debugging, writing-plans, executing-plans, ' +
    'requesting-code-review, receiving-code-review, verification-before-completion, using-git-worktrees, ' +
    'finishing-a-development-branch, subagent-driven-development, dispatching-parallel-agents, writing-skills.',
    { skillName: z.string().describe('Name of the skill directory (e.g., "brainstorming", "test-driven-development")') },
    activateHandler,
  );

  server.tool(
    'list_skills',
    'List all available Superpowers development workflow skills with their names and descriptions.',
    {},
    listHandler,
  );
}
