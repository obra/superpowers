/**
 * Superpowers plugin for OpenCode.ai
 *
 * Injects superpowers bootstrap context via chat.message hook.
 * Auto-registers skills directory via config hook (no symlinks needed).
 */

import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const stripJsonComments = (content) => content
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|\s)\/\/.*$/gm, '$1');

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

const getDisabledBootstrapAgents = (options) => {
  const agents = options?.disableBootstrapForAgents;
  return Array.isArray(agents) ? agents.filter((agent) => typeof agent === 'string' && agent.trim()) : [];
};

const resolveSuperpowersSkillsDir = (configDir) => {
  const candidates = [
    path.join(configDir, 'superpowers', 'skills'),
    path.resolve(__dirname, '..', 'superpowers', 'skills'),
    path.resolve(__dirname, '../../superpowers/skills'),
    path.resolve(__dirname, '../../skills')
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.readdirSync(candidate).length > 0) {
      return candidate;
    }
  }
  return candidates[0];
};

const DEFAULT_OPTIONS = {
  disableBootstrapForAgents: []
};

const loadJsonc = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(stripJsonComments(content));
  } catch {
    return null;
  }
};

const deepMerge = (base, override) => {
  const result = { ...base };
  for (const key of Object.keys(override)) {
    const baseVal = result[key];
    const overrideVal = override[key];
    if (Array.isArray(baseVal) && Array.isArray(overrideVal)) {
      result[key] = [...baseVal, ...overrideVal];
    } else if (typeof baseVal === 'object' && typeof overrideVal === 'object' && baseVal !== null && overrideVal !== null) {
      result[key] = deepMerge(baseVal, overrideVal);
    } else {
      result[key] = overrideVal;
    }
  }
  return result;
};

const loadLayeredOptions = (homeDir, configDir, projectDir) => {
  let options = { ...DEFAULT_OPTIONS };

  const effectiveConfigDir = process.env.OPENCODE_CONFIG_DIR || configDir;
  const userConfigPath = path.join(effectiveConfigDir, 'plugins', 'superpowers.jsonc');
  const userConfig = loadJsonc(userConfigPath);
  if (userConfig) {
    options = deepMerge(options, userConfig);
  }

  if (projectDir) {
    const projectConfigPath = path.join(projectDir, '.opencode', 'plugins', 'superpowers.jsonc');
    const projectConfig = loadJsonc(projectConfigPath);
    if (projectConfig) {
      options = deepMerge(options, projectConfig);
    }
  }

  return options;
};

const getAgentNameFromInput = (input) => {
  const candidates = [
    input?.agent,
    input?.agent?.name,
    input?.session?.agent,
    input?.session?.agent?.name,
    input?.session?.config?.agent,
    input?.session?.config?.agent?.name,
    input?.chat?.agent,
    input?.chat?.agent?.name,
    input?.message?.agent,
    input?.message?.agent?.name,
    input?.metadata?.agent,
    input?.metadata?.agent?.name
  ];
  return candidates.find((candidate) => typeof candidate === 'string' && candidate.trim()) || null;
};

export const SuperpowersPlugin = async ({ client, directory }, options = {}) => {
  const homeDir = os.homedir();
  const envConfigDir = normalizePath(process.env.OPENCODE_CONFIG_DIR, homeDir);
  const configDir = envConfigDir || path.join(homeDir, '.config/opencode');
  const resolvedOptions = { ...loadLayeredOptions(homeDir, configDir, directory), ...options };
  const bootstrappedSessions = new Set();
  const superpowersSkillsDir = resolveSuperpowersSkillsDir(configDir);

  const getBootstrapContent = () => {
    const skillPath = path.join(superpowersSkillsDir, 'using-superpowers', 'SKILL.md');
    if (!fs.existsSync(skillPath)) return null;
    const fullContent = fs.readFileSync(skillPath, 'utf8');
    const { content } = extractAndStripFrontmatter(fullContent);
    const toolMapping = `**Tool Mapping for OpenCode:**
When skills reference tools you don't have, substitute OpenCode equivalents:
- \`TodoWrite\` → \`todowrite\`
- \`Task\` tool with subagents → Use OpenCode's subagent system (@mention)
- \`Skill\` tool → OpenCode's native \`skill\` tool
- \`Read\`, \`Write\`, \`Edit\`, \`Bash\` → Your native tools

Use OpenCode's native \`skill\` tool to list and load skills.`;

    return `<EXTREMELY_IMPORTANT>
You have superpowers.

**IMPORTANT: The using-superpowers skill content is included below. It is ALREADY LOADED - you are currently following it. Do NOT use the skill tool to load "using-superpowers" again - that would be redundant.**

${content}

${toolMapping}
</EXTREMELY_IMPORTANT>`;
  };

  return {
    config: async (config) => {
      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(superpowersSkillsDir)) {
        config.skills.paths.push(superpowersSkillsDir);
      }
    },

    'chat.message': async (input, output) => {
      const agentName = getAgentNameFromInput(input);
      const disabledAgents = getDisabledBootstrapAgents(resolvedOptions);
      if (agentName && disabledAgents.includes(agentName)) return;
      if (input?.sessionID && bootstrappedSessions.has(input.sessionID)) return;

      const bootstrap = getBootstrapContent();
      if (!bootstrap || !output.parts?.length) return;
      if (output.parts.some(p => p.type === 'text' && p.text.includes('EXTREMELY_IMPORTANT'))) return;

      const ref = output.parts[0];
      output.parts.unshift({ ...ref, type: 'text', text: bootstrap });
      if (input?.sessionID) bootstrappedSessions.add(input.sessionID);
    }
  };
};