import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SkillLoader } from './skillLoader.js';
import { getVSCodeToolMapping } from './toolMapping.js';

// Exported for unit testing
export function buildBootstrapContent(loader: SkillLoader): string {
  const bootstrap = loader.loadBootstrap();
  const mapping = getVSCodeToolMapping();
  return `# Superpowers Bootstrap\n\n${bootstrap}\n\n${mapping}`;
}

// Exported for unit testing
export function buildSkillResourceContent(loader: SkillLoader, dirName: string): string {
  return loader.loadSkill(dirName);
}

/** Register all skill Resources on an MCP server instance. */
export function registerResources(server: McpServer, loader: SkillLoader): void {
  // Bootstrap resource — using-superpowers skill + tool mapping
  server.resource(
    'superpowers-bootstrap',
    'superpowers://bootstrap',
    {
      description:
        'Core Superpowers bootstrap context. Read at session start to understand available skills and how to use them.',
      mimeType: 'text/markdown',
    },
    async (_uri) => ({
      contents: [
        {
          uri: 'superpowers://bootstrap',
          mimeType: 'text/markdown',
          text: buildBootstrapContent(loader),
        },
      ],
    }),
  );

  // One resource per skill
  const skills = loader.listSkills();
  for (const skill of skills) {
    const uri = `superpowers://skills/${skill.dirName}`;

    server.resource(
      `superpowers-skill-${skill.dirName}`,
      uri,
      {
        description: skill.description || `Superpowers skill: ${skill.name}`,
        mimeType: 'text/markdown',
      },
      async (_uri) => ({
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: buildSkillResourceContent(loader, skill.dirName),
          },
        ],
      }),
    );
  }
}
