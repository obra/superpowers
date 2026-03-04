/**
 * Superpowers plugin for OpenCode.ai
 *
 * Injects superpowers bootstrap context via system prompt transform.
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

// OpenCode may attempt to render injected system prompts; strip fenced code blocks
// to avoid renderer-specific crashes (e.g. ```dot blocks) while keeping the core text.
// We replace stripped blocks with a clear placeholder so downstream consumers
// can see that additional content existed but was removed for compatibility.
const stripFencedCodeBlocks = (content) => {
  if (!content || typeof content !== 'string') return content;
  let strippedAny = false;
  const placeholder = '[code block removed for rendering compatibility]';

  const result = content.replace(/```[\s\S]*?```/g, () => {
    strippedAny = true;
    return `\n${placeholder}\n`;
  });

  if (strippedAny) {
    console.warn('[superpowers][opencode] stripped fenced code block(s) from bootstrap content for rendering compatibility');
  }

  return result.trim();
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
    if (process.env.SUPERPOWERS_OPENCODE_DISABLE_BOOTSTRAP === '1') return null;

    // Try to load using-superpowers skill
    const skillPath = path.join(superpowersSkillsDir, 'using-superpowers', 'SKILL.md');

    // If the core bootstrap skill is missing, degrade gracefully with a diagnostic
    if (!fs.existsSync(skillPath)) {
      // Log full path details locally for debugging, but keep injected text generic
      console.error(
        '[superpowers][opencode] using-superpowers skill missing at expected path',
        { skillPath, configDir }
      );

      return `<EXTREMELY_IMPORTANT>
Superpowers for OpenCode appear to be installed, but the critical skill \`using-superpowers/SKILL.md\` is missing.

This usually means the Superpowers skills directory is incomplete or not mounted correctly.

Please verify that Superpowers is installed correctly and that the \`skills/using-superpowers/SKILL.md\` file exists.

Until this is fixed, you should proceed cautiously: you do NOT have the full Superpowers bootstrap instructions loaded.
</EXTREMELY_IMPORTANT>`;
    }

    let content;
    try {
      const fullContent = fs.readFileSync(skillPath, 'utf8');
      ({ content } = extractAndStripFrontmatter(fullContent));
      content = stripFencedCodeBlocks(content);
    } catch (err) {
      // Log full error details locally, but keep injected text generic
      console.error(
        '[superpowers][opencode] failed to load using-superpowers skill',
        { skillPath, err }
      );

      return `<EXTREMELY_IMPORTANT>
Superpowers for OpenCode encountered an error while loading the \`using-superpowers\` skill.

The plugin could not read or parse \`skills/using-superpowers/SKILL.md\`.
Check local logs for detailed error information.

Until this is fixed, you should proceed cautiously: you do NOT have the full Superpowers bootstrap instructions loaded.
</EXTREMELY_IMPORTANT>`;
    }

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

  return {
    // Use system prompt transform to inject bootstrap (fixes #226 agent reset bug)
    'experimental.chat.system.transform': async (_input, output) => {
      try {
        const bootstrap = getBootstrapContent();
        if (bootstrap) {
          (output.system ||= []).push(bootstrap);
        }
      } catch (err) {
          // Log detailed error information locally without leaking it into the prompt
          console.error(
            '[superpowers][opencode] unexpected error generating bootstrap content',
            { err }
          );

        (output.system ||= []).push(`<EXTREMELY_IMPORTANT>
Superpowers for OpenCode failed to generate bootstrap content due to an unexpected error.

An unexpected bootstrap generation error occurred.
Check local logs for detailed error information.

Workaround: set \`SUPERPOWERS_OPENCODE_DISABLE_BOOTSTRAP=1\` and restart OpenCode.
</EXTREMELY_IMPORTANT>`);
      }
    }
  };
};
