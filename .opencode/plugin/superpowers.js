/**
 * Superpowers plugin for OpenCode.ai
 *
 * Provides custom tools for loading and discovering skills,
 * with prompt generation for agent configuration.
 */

import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { tool } from '@opencode-ai/plugin/tool';
import * as skillsCore from '../../lib/skills-core.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const SuperpowersPlugin = async ({ project, client, $, directory, worktree }) => {
  const homeDir = os.homedir();
  const superpowersSkillsDir = path.join(homeDir, '.config/opencode/superpowers/skills');
  const personalSkillsDir = path.join(homeDir, '.config/opencode/skills');
  const promptsDir = path.join(homeDir, '.config/opencode/prompts');
  const promptFile = path.join(promptsDir, 'superpowers.txt');

  return {
    tool: {
      use_skill: tool({
        description: 'Load and read a specific skill to guide your work. Skills contain proven workflows, mandatory processes, and expert techniques.',
        args: {
          skill_name: tool.schema.string().describe('Name of the skill to load (e.g., "superpowers:brainstorming" or "my-custom-skill")')
        },
        execute: async (args, context) => {
          const { skill_name } = args;
          const resolved = skillsCore.resolveSkillPath(skill_name, superpowersSkillsDir, personalSkillsDir);

          if (!resolved) {
            return `Error: Skill "${skill_name}" not found.\n\nRun find_skills to see available skills.`;
          }

          const fullContent = fs.readFileSync(resolved.skillFile, 'utf8');
          const { name, description } = skillsCore.extractFrontmatter(resolved.skillFile);
          const content = skillsCore.stripFrontmatter(fullContent);
          const skillDirectory = path.dirname(resolved.skillFile);

          return `# ${name || skill_name}
# ${description || ''}
# Supporting tools and docs are in ${skillDirectory}
# ============================================

${content}`;
        }
      }),
      find_skills: tool({
        description: 'List all available skills in the superpowers and personal skill libraries.',
        args: {},
        execute: async (args, context) => {
          const superpowersSkills = skillsCore.findSkillsInDir(superpowersSkillsDir, 'superpowers', 3);
          const personalSkills = skillsCore.findSkillsInDir(personalSkillsDir, 'personal', 3);
          const allSkills = [...personalSkills, ...superpowersSkills];

          if (allSkills.length === 0) {
            return 'No skills found. Install superpowers skills to ~/.config/opencode/superpowers/skills/';
          }

          let output = 'Available skills:\n\n';

          for (const skill of allSkills) {
            const namespace = skill.sourceType === 'personal' ? '' : 'superpowers:';
            const skillName = skill.name || path.basename(skill.path);

            output += `${namespace}${skillName}\n`;
            if (skill.description) {
              output += `  ${skill.description}\n`;
            }
            output += `  Directory: ${skill.path}\n\n`;
          }

          return output;
        }
      })
    },
    "chat.message": async (input, output) => {
      // Only inject on first message of session (or every message if needed)
      if (!output.message.system || output.message.system.length === 0) {
        const usingSuperpowersPath = skillsCore.resolveSkillPath('using-superpowers', superpowersSkillsDir, personalSkillsDir);

        if (usingSuperpowersPath) {
          const fullContent = fs.readFileSync(usingSuperpowersPath.skillFile, 'utf8');
          const usingSuperpowersContent = skillsCore.stripFrontmatter(fullContent);

          const toolMapping = `**Tool Mapping for OpenCode:**
When skills reference tools you don't have, substitute OpenCode equivalents:
- \`TodoWrite\` → \`update_plan\`
- \`Task\` tool with subagents → Use OpenCode's subagent system (@mention)
- \`Skill\` tool → \`use_skill\` custom tool
- \`Read\`, \`Write\`, \`Edit\`, \`Bash\` → Your native tools

**Skills naming:**
- Superpowers skills: \`superpowers:skill-name\`
- Personal skills: \`skill-name\`
- Personal skills override superpowers when names match`;

          output.message.system = `<EXTREMELY_IMPORTANT>
You have superpowers.

${usingSuperpowersContent}

${toolMapping}
</EXTREMELY_IMPORTANT>`;
        }
      }
    }
  };
};
