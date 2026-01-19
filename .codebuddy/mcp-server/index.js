#!/usr/bin/env node

/**
 * Superpowers MCP Server for CodeBuddy
 *
 * This MCP server provides tools for loading and discovering Superpowers skills
 * within CodeBuddy, enabling the same skill system that works with Claude Code,
 * OpenCode, and Codex.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import shared skills core
const skillsCoreModule = path.join(__dirname, '../../lib/skills-core.js');
const { extractFrontmatter, stripFrontmatter, findSkillsInDir, resolveSkillPath, checkForUpdates } = await import(
  'file://' + skillsCoreModule
);

// Create MCP server
const server = new Server(
  {
    name: 'superpowers',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper to get skill directories
const getSkillDirectories = () => {
  const homeDir = os.homedir();
  
  // Multiple search paths for skills (in priority order)
  const searchPaths = [
    path.join(homeDir, '.codebuddy', 'skills'),           // Project/local skills
    path.join(homeDir, '.config', 'codebuddy', 'skills'), // Global CodeBuddy skills
    path.join(__dirname, '../../skills'),                 // Superpowers core skills
  ];

  return {
    superpowersSkillsDir: path.join(__dirname, '../../skills'),
    personalSkillsDir: path.join(homeDir, '.config', 'codebuddy', 'skills'),
    projectSkillsDir: path.join(homeDir, '.codebuddy', 'skills'),
    superpowersRepoDir: path.join(homeDir, '.codebuddy', 'superpowers'),
  };
};

// Helper to generate bootstrap content
const getBootstrapContent = (compact = false) => {
  const { superpowersSkillsDir, personalSkillsDir } = getSkillDirectories();
  const usingSuperpowersPath = resolveSkillPath('using-superpowers', superpowersSkillsDir, personalSkillsDir);
  
  if (!usingSuperpowersPath) return null;

  const fullContent = fs.readFileSync(usingSuperpowersPath.skillFile, 'utf8');
  const content = stripFrontmatter(fullContent);

  const toolMapping = compact
    ? `**Tool Mapping:** TodoWrite->todo_write, Task->task, Skill->use_skill

**Skills naming (priority order):** project: > personal > superpowers:`
    : `**Tool Mapping for CodeBuddy:**
When skills reference tools you don't have, substitute CodeBuddy equivalents:
- \`TodoWrite\` → \`todo_write\`
- \`Task\` tool with subagents → Use CodeBuddy's task system
- \`Skill\` tool → \`use_skill\` MCP tool
- \`Read\`, \`Write\`, \`Edit\`, \`Bash\` → Your native tools

**Skills naming (priority order):**
- Project skills: \`project:skill-name\` (in .codebuddy/skills/ or ~/.config/codebuddy/skills/)
- Personal skills: \`skill-name\` (in ~/.config/codebuddy/skills/)
- Superpowers skills: \`superpowers:skill-name\`
- Project skills override personal, which override superpowers when names match`;

  return `<EXTREMELY_IMPORTANT>
You have superpowers.

**IMPORTANT: The using-superpowers skill content is included below. It is ALREADY LOADED - you are currently following it. Do NOT use the use_skill tool to load "using-superpowers" - that would be redundant. Use use_skill only for OTHER skills.**

${content}

${toolMapping}
</EXTREMELY_IMPORTANT>`;
};

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'use_skill',
        description: 'Load and read a specific skill to guide your work. Skills contain proven workflows, mandatory processes, and expert techniques.',
        inputSchema: {
          type: 'object',
          properties: {
            skill_name: {
              type: 'string',
              description: 'Name of the skill to load (e.g., "superpowers:brainstorming", "my-custom-skill", or "project:my-skill")'
            }
          },
          required: ['skill_name']
        }
      },
      {
        name: 'find_skills',
        description: 'List all available skills in the project, personal, and superpowers skill libraries.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'get_bootstrap',
        description: 'Get the Superpowers bootstrap content with using-superpowers skill and tool mappings.',
        inputSchema: {
          type: 'object',
          properties: {
            compact: {
              type: 'boolean',
              description: 'Use compact version (after context compaction)',
              default: false
            }
          }
        }
      }
    ]
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'use_skill') {
    const { skill_name } = args;
    const { superpowersSkillsDir, personalSkillsDir, projectSkillsDir } = getSkillDirectories();

    // Resolve with priority: project > personal > superpowers
    const forceProject = skill_name.startsWith('project:');
    const actualSkillName = forceProject ? skill_name.replace(/^project:/, '') : skill_name;

    let resolved = null;

    // Try project skills first
    if (forceProject || !skill_name.startsWith('superpowers:')) {
      const projectPath = path.join(projectSkillsDir, actualSkillName);
      const projectSkillFile = path.join(projectPath, 'SKILL.md');
      if (fs.existsSync(projectSkillFile)) {
        resolved = {
          skillFile: projectSkillFile,
          sourceType: 'project',
          skillPath: actualSkillName
        };
      }
    }

    // Fall back to personal/superpowers resolution
    if (!resolved && !forceProject) {
      resolved = resolveSkillPath(skill_name, superpowersSkillsDir, personalSkillsDir);
    }

    if (!resolved) {
      throw new Error(`Skill "${skill_name}" not found. Run find_skills to see available skills.`);
    }

    const fullContent = fs.readFileSync(resolved.skillFile, 'utf8');
    const { name: skillName, description } = extractFrontmatter(resolved.skillFile);
    const content = stripFrontmatter(fullContent);
    const skillDirectory = path.dirname(resolved.skillFile);

    const skillHeader = `# ${skillName || skill_name}
# ${description || ''}
# Supporting tools and docs are in ${skillDirectory}
# ============================================`;

    return {
      content: [
        {
          type: 'text',
          text: `${skillHeader}\n\n${content}`
        }
      ]
    };
  }

  if (name === 'find_skills') {
    const { superpowersSkillsDir, personalSkillsDir, projectSkillsDir } = getSkillDirectories();

    const projectSkills = findSkillsInDir(projectSkillsDir, 'project', 3);
    const personalSkills = findSkillsInDir(personalSkillsDir, 'personal', 3);
    const superpowersSkills = findSkillsInDir(superpowersSkillsDir, 'superpowers', 3);

    // Priority: project > personal > superpowers
    const allSkills = [...projectSkills, ...personalSkills, ...superpowersSkills];

    if (allSkills.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No skills found. Install superpowers skills or add project skills to .codebuddy/skills/'
          }
        ]
      };
    }

    let output = 'Available skills:\n\n';

    for (const skill of allSkills) {
      let namespace;
      switch (skill.sourceType) {
        case 'project':
          namespace = 'project:';
          break;
        case 'personal':
          namespace = '';
          break;
        default:
          namespace = 'superpowers:';
      }
      const skillName = skill.name || path.basename(skill.path);

      output += `${namespace}${skillName}\n`;
      if (skill.description) {
        output += `  ${skill.description}\n`;
      }
      output += `  Directory: ${skill.path}\n\n`;
    }

    return {
      content: [
        {
          type: 'text',
          text: output
        }
      ]
    };
  }

  if (name === 'get_bootstrap') {
    const compact = args.compact || false;
    const bootstrapContent = getBootstrapContent(compact);

    if (!bootstrapContent) {
      throw new Error('using-superpowers skill not found');
    }

    return {
      content: [
        {
          type: 'text',
          text: bootstrapContent
        }
      ]
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Superpowers MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
