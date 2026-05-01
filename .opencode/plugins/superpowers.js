/**
 * Superpowers plugin for OpenCode.ai
 *
 * - Injects superpowers bootstrap context via message transform
 * - Auto-registers skills directory via config hook
 */

import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Extract and strip YAML-style frontmatter
 */
const extractAndStripFrontmatter = (content) => {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content };

  const [, frontmatterStr, body] = match;

  const frontmatter = Object.fromEntries(
    frontmatterStr.split('\n')
      .map(line => {
        const idx = line.indexOf(':');
        if (idx <= 0) return null;
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        return [key, value];
      })
      .filter(Boolean)
  );

  return { frontmatter, content: body };
};

/**
 * Normalize path:
 * - trims whitespace
 * - expands ~
 * - resolves absolute path
 */
const normalizePath = (input, homeDir) => {
  if (typeof input !== 'string') return null;

  let p = input.trim();
  if (!p) return null;

  if (p === '~') return homeDir;
  if (p.startsWith('~/')) return path.join(homeDir, p.slice(2));

  return path.resolve(p);
};

/**
 * Safely read file if it exists
 */
const readFileIfExists = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.warn('[SuperpowersPlugin] Failed to read file:', filePath, err);
    return null;
  }
};

export const SuperpowersPlugin = async ({ client, directory }) => {
  const homeDir = os.homedir();
  const superpowersSkillsDir = path.resolve(__dirname, '../../skills');

  const envConfigDir = normalizePath(process.env.OPENCODE_CONFIG_DIR, homeDir);
  const configDir = envConfigDir ?? path.join(homeDir, '.config/opencode');

  /**
   * Generate bootstrap content
   */
  const getBootstrapContent = () => {
    const skillPath = path.join(
      superpowersSkillsDir,
      'using-superpowers',
      'SKILL.md'
    );

    const file = readFileIfExists(skillPath);
    if (!file) return null;

    const { content } = extractAndStripFrontmatter(file);

    const toolMapping = `
**Tool Mapping for OpenCode:**
When skills reference tools you don't have, substitute OpenCode equivalents:
- \`TodoWrite\` → \`todowrite\`
- \`Task\` tool with subagents → Use OpenCode's subagent system (@mention)
- \`Skill\` tool → OpenCode's native \`skill\` tool
- \`Read\`, \`Write\`, \`Edit\`, \`Bash\` → Your native tools

Use OpenCode's native \`skill\` tool to list and load skills.
`;

    return `<EXTREMELY_IMPORTANT>
You have superpowers.

**IMPORTANT: The using-superpowers skill is already loaded. Do NOT reload it.**

${content}

${toolMapping}
</EXTREMELY_IMPORTANT>`;
  };

  return {
    /**
     * Inject skills path into runtime config
     */
    config: async (config) => {
      if (!config.skills) config.skills = {};
      if (!Array.isArray(config.skills.paths)) config.skills.paths = [];

      if (!config.skills.paths.includes(superpowersSkillsDir)) {
        config.skills.paths.push(superpowersSkillsDir);
      }

      return config;
    },

    /**
     * Inject bootstrap into first user message only
     */
    'experimental.chat.messages.transform': async (_input, output) => {
      if (!output?.messages?.length) return;

      const bootstrap = getBootstrapContent();
      if (!bootstrap) return;

      const firstUser = output.messages.find(
        (m) => m?.info?.role === 'user'
      );

      if (!firstUser?.parts?.length) return;

      const alreadyInjected = firstUser.parts.some(
        (p) =>
          p.type === 'text' &&
          p.text.includes('<EXTREMELY_IMPORTANT>')
      );

      if (alreadyInjected) return;

      const refPart = firstUser.parts[0];

      firstUser.parts.unshift({
        ...refPart,
        type: 'text',
        text: bootstrap,
      });
    },
  };
};
