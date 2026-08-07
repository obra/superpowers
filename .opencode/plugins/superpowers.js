/**
 * Superpowers plugin for OpenCode.ai
 *
 * Dual-compatible with OpenCode V1 and V2.
 *
 * V1 (opencode): loaded via named export SuperpowersPlugin — provides config
 * hook for skills registration and experimental.chat.messages.transform for
 * bootstrap injection.
 *
 * V2 (opencode2): loaded via default export { id, setup } by PluginSupervisor.
 * setup() registers skills natively via ctx.skill.transform(), and injects
 * bootstrap context via ctx.session.hook("context").
 *
 * No external dependencies — pure JavaScript works in both V1 and V2 without
 * installing @opencode-ai/plugin or effect.
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Skills directory shared by V1 (config hook) and V2 (setup/ctx.skill.transform)
const superpowersSkillsDir = path.resolve(__dirname, '../../skills');

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

// Module-level cache for bootstrap content.
// The SKILL.md file does not change during a session, so reading + parsing it
// once eliminates redundant fs.existsSync + fs.readFileSync + regex work on
// every agent step.  See #1202 for the full analysis.
let _bootstrapCache = undefined; // undefined = not yet loaded, null = file missing

// Helper to generate bootstrap content (cached after first call)
const getBootstrapContent = () => {
  // Return cached result on subsequent calls
  if (_bootstrapCache !== undefined) return _bootstrapCache;

  // Try to load using-superpowers skill
  const skillPath = path.join(superpowersSkillsDir, 'using-superpowers', 'SKILL.md');
  if (!fs.existsSync(skillPath)) {
    _bootstrapCache = null;
    return null;
  }

  const fullContent = fs.readFileSync(skillPath, 'utf8');
  const { content } = extractAndStripFrontmatter(fullContent);

  const toolMapping = `**Tool Mapping for OpenCode:**
When skills request actions, substitute OpenCode equivalents:
- Create or update todos → \`todowrite\`
- \`Subagent (general-purpose):\` → \`task\` with \`subagent_type: "general"\`
- Invoke a skill → OpenCode's native \`skill\` tool
- Read files → \`read\`
- Create, edit, or delete files → \`apply_patch\`
- Run shell commands → \`bash\`
- Search files → \`grep\`, \`glob\`
- Fetch a URL → \`webfetch\`

Use OpenCode's native \`skill\` tool to list and load skills.`;

  _bootstrapCache = `<EXTREMELY_IMPORTANT>
You have superpowers.

**IMPORTANT: The using-superpowers skill content is included below. It is ALREADY LOADED - you are currently following it. Do NOT use the skill tool to load "using-superpowers" again - that would be redundant.**

${content}

${toolMapping}
</EXTREMELY_IMPORTANT>`;

  return _bootstrapCache;
};

/**
 * V1 Plugin Function (named export + default.server)
 *
 * Used by V1 (OpenCode 1.x): discovered via named export scanning.
 * Provides: config hook (V1 skills registration) + bootstrap injection
 * (experimental.chat.messages.transform).
 */
export const SuperpowersPlugin = async ({ client, directory }) => {
  return {
    // Inject skills path into live config so OpenCode discovers superpowers skills
    // without requiring manual symlinks or config file edits.
    config: async (config) => {
      // V2: skills is a flat array — skip, setup() handles V2 skill registration
      if (Array.isArray(config.skills)) return;

      // V1: skills is { paths: [...] }
      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(superpowersSkillsDir)) {
        config.skills.paths.push(superpowersSkillsDir);
      }
    },

    // Inject bootstrap into the first user message of each session.
    // Using a user message instead of a system message avoids:
    //   1. Token bloat from system messages repeated every turn (#750)
    //   2. Multiple system messages breaking Qwen and other models (#894)
    //
    // The hook fires on every agent step (not just every turn) because
    // opencode's prompt.ts reloads messages from DB each step.  Fresh message
    // arrays may need injection again, so getBootstrapContent() must not do
    // repeated disk work.
    'experimental.chat.messages.transform': async (_input, output) => {
      const bootstrap = getBootstrapContent();
      if (!bootstrap || !output.messages.length) return;
      const firstUser = output.messages.find(m => m.info.role === 'user');
      if (!firstUser || !firstUser.parts.length) return;

      // Guard: skip if first user message already contains bootstrap.
      if (firstUser.parts.some(p => p.type === 'text' && p.text.includes('EXTREMELY_IMPORTANT'))) return;

      const ref = firstUser.parts[0];
      firstUser.parts.unshift({ ...ref, type: 'text', text: bootstrap });
    }
  };
};

/**
 * V2 Setup Function (default.setup)
 *
 * Called by V2 PluginSupervisor (packages/core/src/plugin/).
 * Performs two things:
 *
 * 1. Registers the skills directory natively via ctx.skill.transform().
 * 2. Injects bootstrap context via ctx.session.hook("context"), the V2
 *    equivalent of V1's experimental.chat.messages.transform.
 */
async function setup(ctx) {
  // 1. Register skills
  await ctx.skill.transform((draft) => {
    draft.source({
      type: 'directory',
      path: superpowersSkillsDir,
    });
  });

  // 2. Inject bootstrap into first user message via V2 session context hook
  await ctx.session.hook('context', (event) => {
    const bootstrap = getBootstrapContent();
    if (!bootstrap || !event.messages || !event.messages.length) return;
    const firstUser = event.messages.find(m => m.role === 'user');
    if (!firstUser || !firstUser.content || !firstUser.content.length) return;
    if (firstUser.content.some(p => p.type === 'text' && p.text && p.text.includes('EXTREMELY_IMPORTANT'))) return;
    firstUser.content.unshift({ type: 'text', text: bootstrap });
  });
}

/**
 * Default Export: { id, server, setup }
 *
 * V2 PluginSupervisor reads { id, setup }.
 * V1 reads named export SuperpowersPlugin.
 * server() is exported for V1 compatibility.
 */
export default {
  id: 'superpowers',
  server: SuperpowersPlugin,
  setup,
};
