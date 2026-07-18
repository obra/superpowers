/**
 * Superpowers plugin for OpenCode v2.
 *
 * OpenCode v2 replaced the v1 plugin API entirely (v1 plugins do not run under
 * v2). This plugin targets the v2 API documented at
 * https://v2.opencode.ai/build/plugins:
 *
 *   - Default export is a plain `{ id, setup }` object. (`Plugin.define()` from
 *     "@opencode-ai/plugin/v2" is an identity wrapper, so we avoid the runtime
 *     import to keep this a zero-dependency plugin that loads in any layout.)
 *   - `ctx.skill.transform()` registers the bundled skills directory as a skill
 *     source, so OpenCode discovers superpowers skills with no symlinks or
 *     manual `skills.paths` edits.
 *   - `ctx.session.hook("context", ...)` injects the superpowers bootstrap into
 *     the first user message immediately before each model dispatch.
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Bundled skills live two levels up from this plugin file (../../skills).
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
// every model dispatch.  See #1202 for the full analysis.
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
- \`Subagent (general-purpose):\` → \`task\` with \`subagent_type: "general"\` (or \`"explore"\` for codebase exploration)
- Invoke a skill → OpenCode's native \`skill\` tool
- Read files → \`read\`
- Create a file → \`write\`; edit a file → \`edit\`
- Run shell commands → \`bash\`
- Search file contents / find files by name → \`grep\`, \`glob\`
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

export default {
  id: 'superpowers',

  setup: async (ctx) => {
    // Register the bundled skills directory as a skill source so OpenCode
    // discovers superpowers skills without symlinks or manual config edits.
    // Guard against re-adding the same directory if setup runs more than once.
    await ctx.skill.transform((draft) => {
      const alreadyRegistered = draft
        .list()
        .some((source) => source.type === 'directory'
          && path.resolve(source.path) === superpowersSkillsDir);
      if (!alreadyRegistered) {
        draft.source({ type: 'directory', path: superpowersSkillsDir });
      }
    });
    await ctx.skill.reload();

    // Inject bootstrap into the first user message of each request.
    // Using a user message instead of a system message avoids:
    //   1. Token bloat from system messages repeated every turn (#750)
    //   2. Multiple system messages breaking Qwen and other models (#894)
    //
    // The hook fires before every model dispatch, so getBootstrapContent()
    // must avoid repeated disk work (it caches at module level).
    await ctx.session.hook('context', (input) => {
      const bootstrap = getBootstrapContent();
      if (!bootstrap || !input.messages || !input.messages.length) return;

      const firstUser = input.messages.find((m) => m.role === 'user');
      if (!firstUser || !Array.isArray(firstUser.content) || !firstUser.content.length) return;

      // Guard: skip if the first user message already contains the bootstrap.
      // This prevents double injection when the hook re-runs over a message
      // array that was already transformed in a previous dispatch.
      if (firstUser.content.some((part) => part.type === 'text'
        && typeof part.text === 'string'
        && part.text.includes('EXTREMELY_IMPORTANT'))) {
        return;
      }

      firstUser.content.unshift({ type: 'text', text: bootstrap });
    });
  },
};
