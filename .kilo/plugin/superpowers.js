/** Native Kilo Code server plugin; no runtime dependencies. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const skillsDir = fileURLToPath(new URL('../../skills/', import.meta.url)).replace(/[\\/]$/, '');
const marker = '<EXTREMELY_IMPORTANT>\nYou have superpowers.';
const mapping = `**Tool Mapping for Kilo Code:**
When skills request actions, substitute Kilo Code equivalents:
- Create or update todos → \`todowrite\`
- \`Subagent (general-purpose):\` → \`task\` with \`subagent_type: "general"\`
- Invoke a skill → Kilo Code's native \`skill\` tool
- Read files → \`read\`
- Create or edit files → \`write\` or \`edit\`; delete files with \`bash\`
- Run shell commands → \`bash\`
- Search files → \`grep\`, \`glob\`
- Fetch a URL → \`webfetch\`

Use Kilo Code's native \`skill\` tool to list and load skills.`;
let bootstrap;
function getBootstrap() {
  if (bootstrap !== undefined) return bootstrap;
  const skillPath = path.join(skillsDir, 'using-superpowers', 'SKILL.md');
  if (!fs.existsSync(skillPath)) return (bootstrap = null);
  const content = fs.readFileSync(skillPath, 'utf8').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  bootstrap = `${marker}

**IMPORTANT: The using-superpowers skill content is included below. It is ALREADY LOADED - you are currently following it. Do NOT use the skill tool to load "using-superpowers" again - that would be redundant.**

${content}

${mapping}
</EXTREMELY_IMPORTANT>`;
  return bootstrap;
}

export default {
  id: 'superpowers',
  server: async ({ client }) => {
    // A server may outlive hundreds of sessions. Keep only successful lookups,
    // bound retained identities, and never share classifications across servers.
    const children = new Map();
    const isChild = async (id) => {
      if (!id) return false;
      if (children.has(id)) return children.get(id);
      try {
        // Kilo 7.8.17 exposes the legacy SDK to server plugins (verified live).
        const result = await client.session.get({ path: { id } });
        const session = result?.data;
        if (result?.error != null || result?.response?.ok === false ||
            !session || session.id !== id ||
            (session.parentID !== undefined &&
             (typeof session.parentID !== 'string' || !session.parentID))) {
          throw new Error('Session lookup returned no valid session identity');
        }
        const child = session.parentID !== undefined;
        if (children.size >= 512) {
          for (const key of [...children.keys()].slice(0, 128)) children.delete(key);
        }
        children.set(id, child);
        return child;
      } catch (error) {
        console.error('[superpowers] Kilo session lookup failed; retrying next request:', error);
        return false;
      }
    };
    return {
      config: async (config) => {
        config.skills ??= {};
        config.skills.paths ??= [];
        if (!config.skills.paths.includes(skillsDir)) config.skills.paths.push(skillsDir);
        // Kilo 7.8.17 requires provenance for plugin-owned markdown outside the
        // active project. Scope this to our install directory, never arbitrary
        // user paths. The host still downgrades files resolving into the project.
        config.skill_path_origins ??= {};
        config.skill_path_origins[skillsDir] ??= { trusted: true };
      },
      // Kilo's system prompt discourages clarifying questions. A user-message
      // bootstrap lost that conflict in real sessions, so use the native system
      // hook instead. Append to the last block to avoid extra system messages.
      'experimental.chat.system.transform': async ({ sessionID }, output) => {
        const content = getBootstrap();
        if (!content || output.system.some(text => text.includes(marker))) return;
        if (await isChild(sessionID)) return;
        if (output.system.length) output.system[output.system.length - 1] += `\n\n${content}`;
        else output.system.push(content);
      },
    };
  },
};
