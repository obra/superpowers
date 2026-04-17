import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
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

  // Dynamic resources for skills
  server.resource(
    'superpowers-skill',
    new ResourceTemplate('superpowers://skills/{skillName}', {
      list: async () => {
        const skills = loader.listSkills();
        return {
          resources: skills.map((skill) => ({
            uri: `superpowers://skills/${skill.dirName}`,
            name: `superpowers-skill-${skill.dirName}`,
            description: skill.description || `Superpowers skill: ${skill.name}`,
            mimeType: 'text/markdown',
          })),
        };
      },
    }),
    async (uri, { skillName }) => {
      const skills = loader.listSkills();
      const skill = skills.find((s) => s.dirName === skillName);
      if (!skill) {
        throw new Error(`Skill not found: ${skillName}`);
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/markdown',
            text: buildSkillResourceContent(loader, skill.dirName),
          },
        ],
      };
    },
  );
}
