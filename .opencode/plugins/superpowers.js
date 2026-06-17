/**
 * Superpowers plugin for OpenCode.ai
 *
 * Injects superpowers bootstrap context via message transform.
 * Skills are discovered via OpenCode's native skill tool from symlinked directory.
 */

import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple frontmatter extraction (avoid dependency on skills-core for bootstrap)
const extractAndStripFrontmatter = (content) => {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content };

  const frontmatterStr = match[1];
  const body = match[2];
  const frontmatter = {};

  for (const line of frontmatterStr.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
      frontmatter[key] = value;
    }
  }

  return { frontmatter, content: body };
};

// Normalize a path: trim whitespace, expand ~, resolve to absolute
const normalizePath = (p, homeDir) => {
  if (!p || typeof p !== 'string') return null;
  let normalized = p.trim();
  if (!normalized) return null;
  if (normalized.startsWith('~/')) {
    normalized = path.join(homeDir, normalized.slice(2));
  } else if (normalized === '~') {
    normalized = homeDir;
  }
  return path.resolve(normalized);
};

export const SuperpowersPlugin = async ({ client, directory }) => {
  const homeDir = os.homedir();
  const superpowersSkillsDir = path.resolve(__dirname, '../../skills');
  const envConfigDir = normalizePath(process.env.OPENCODE_CONFIG_DIR, homeDir);
  const configDir = envConfigDir || path.join(homeDir, '.config/opencode');

  // Helper to generate bootstrap content
  const getBootstrapContent = () => {
    // Try to load using-superpowers skill
    const skillPath = path.join(superpowersSkillsDir, 'using-superpowers', 'SKILL.md');
    if (!fs.existsSync(skillPath)) return null;

    const fullContent = fs.readFileSync(skillPath, 'utf8');
    const { content } = extractAndStripFrontmatter(fullContent);

    const toolMapping = `**Tool Mapping for OpenCode:**
When skills reference tools you don't have, substitute OpenCode equivalents:
- \`TodoWrite\` → \`update_plan\`
- \`Task\` tool with subagents → Use OpenCode's subagent system (@mention)
- \`Skill\` tool → OpenCode's native \`skill\` tool
- \`Read\`, \`Write\`, \`Edit\`, \`Bash\` → Your native tools

**Skills location:**
Superpowers skills are in \`${configDir}/skills/superpowers/\`
Use OpenCode's native \`skill\` tool to list and load skills.`;

    return `<EXTREMELY_IMPORTANT>
You have superpowers.

**IMPORTANT: The using-superpowers skill content is included below. It is ALREADY LOADED - you are currently following it. Do NOT use the skill tool to load "using-superpowers" again - that would be redundant.**

${content}

${toolMapping}
</EXTREMELY_IMPORTANT>`;
  };

  const findMessages = (input, output) => {
    if (Array.isArray(output)) return output;
    if (Array.isArray(output?.messages)) return output.messages;
    if (Array.isArray(input)) return input;
    if (Array.isArray(input?.messages)) return input.messages;
    return null;
  };

  const hasBootstrap = (parts) => {
    return parts.some((part) => {
      return part?.type === 'text' &&
        typeof part.text === 'string' &&
        part.text.includes('<EXTREMELY_IMPORTANT>');
    });
  };

  return {
    // Use a fresh parts array so shared history references stay unmodified.
    'experimental.chat.messages.transform': async (input, output) => {
      const bootstrap = getBootstrapContent();
      if (!bootstrap) return;

      const messages = findMessages(input, output);
      if (!messages?.length) return;

      const firstUserIndex = messages.findIndex((message) => {
        return message?.role === 'user' &&
          Array.isArray(message.parts) &&
          message.parts.length > 0;
      });
      if (firstUserIndex === -1) return;

      const firstUser = messages[firstUserIndex];
      if (hasBootstrap(firstUser.parts)) return;

      const referencePart = firstUser.parts.find((part) => part?.type === 'text') || {};
      messages[firstUserIndex] = {
        ...firstUser,
        parts: [
          { ...referencePart, type: 'text', text: bootstrap },
          ...firstUser.parts
        ]
      };
    }
  };
};
