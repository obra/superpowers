/**
 * Superpowers plugin for DeepSeek Harness (dsh).
 *
 * Registers this repository's `skills/` as runtime skills through `ctx.skills`,
 * and the `using-superpowers` bootstrap as an ordered system-prompt section
 * through `ctx.systemPrompt`. dsh reassembles the system prompt before every
 * model step, so the bootstrap is present from the first request and after
 * compaction without any per-session opt-in.
 *
 * Node builtins only: dsh nests `@deepseek-ai/*` inside its own installation,
 * so a plugin resolved from a profile cannot import them. Both registries are
 * reached through the injected `ctx` alone.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Cordis plugin name, used by loader diagnostics. */
export const name = 'superpowers';

/** Services this plugin registers into; it stays inactive until both exist. */
export const inject = ['skills', 'systemPrompt'];

const skillsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../skills');

const BOOTSTRAP_SKILL = 'using-superpowers';

/**
 * Prompt order of the bootstrap. dsh reserves -100 for the harness identity,
 * 0 for the deployment persona and 100-199 for tool guidance, so 50 puts the
 * methodology after the persona and before the tools it governs.
 */
const BOOTSTRAP_ORDER = 50;

/**
 * The dsh-specific deltas the skills cannot name themselves: prompt-only
 * subagents, whole-list todos, plan mode, and plain skill names. Keep in sync
 * with `skills/using-superpowers/references/dsh-tools.md` (the plugin test
 * asserts both carry the subagent line).
 */
const TOOL_MAPPING = `## DeepSeek Harness tool mapping

Translate the Superpowers action vocabulary to these dsh tools (full reference: skills/using-superpowers/references/dsh-tools.md):

- Dispatch a subagent → \`subagent\` (standalone prompt; background by default) or \`subagent_fork\` (inherits this conversation). dsh has NO named subagent types — put the role and instructions in the prompt itself. Follow up with \`send_message\`, list with \`list_agents\`, stop with \`interrupt_agent\`. Large multi-agent orchestration → \`workflow\`. Fresh-agent iteration loops → \`ralph\` (only when the human asks for them).
- Create / update todos → \`todo_write\` (send the ENTIRE list every call — it replaces the previous list).
- Plan mode → \`exit_plan_mode\` (present the complete plan as markdown; implement only after approval).
- Invoke a skill → \`skill\` with the exact catalog name: plain \`brainstorming\`, never \`superpowers:brainstorming\`.`;

/**
 * Split one SKILL.md into its frontmatter fields and its instruction body.
 * @param {string} raw - the file contents.
 * @returns {{name?: string, description?: string, whenToUse?: string, body: string}}
 */
const parseSkill = (raw) => {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { body: raw.trim() };

  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z][\w-]*):\s*(.+)$/);
    if (field) fields[field[1]] = field[2].trim().replace(/^(["'])([\s\S]*)\1$/, '$2');
  }
  return { ...fields, body: match[2].trim() };
};

/**
 * Read every bundled skill, skipping (and reporting) unreadable or malformed ones.
 * @param {{warn: (message: string) => void}} logger
 * @returns {Array<{name: string, description: string, whenToUse?: string, content: string, source: string, path: string, resourceBase: {kind: 'directory', path: string}}>}
 */
const readSkills = (logger) => {
  let entries;
  try {
    entries = readdirSync(skillsDir, { withFileTypes: true });
  } catch (error) {
    logger.warn(`superpowers: cannot read ${skillsDir}: ${error.message}`);
    return [];
  }

  const skills = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    const skillDir = join(skillsDir, entry.name);
    const skillPath = join(skillDir, 'SKILL.md');

    let raw;
    try {
      raw = readFileSync(skillPath, 'utf8');
    } catch (error) {
      logger.warn(`superpowers: cannot read ${skillPath}: ${error.message}`);
      continue;
    }

    const skill = parseSkill(raw);
    if (!skill.name || !skill.description || !skill.body) {
      logger.warn(`superpowers: ${skillPath} needs name and description frontmatter and a body`);
      continue;
    }

    skills.push({
      name: skill.name,
      description: skill.description,
      ...(skill.whenToUse ? { whenToUse: skill.whenToUse } : {}),
      content: skill.body,
      source: 'bundled',
      path: skillPath,
      resourceBase: { kind: 'directory', path: skillDir },
    });
  }
  return skills;
};

/**
 * Register the bundled skills and the bootstrap section. Every registration is
 * a Cordis effect disposed with the plugin's own fiber.
 * @param {import('@deepseek-ai/cordis').Context} ctx
 */
export function apply(ctx) {
  const skills = readSkills(ctx.logger);
  for (const skill of skills) ctx.skills.register(skill);

  const bootstrap = skills.find((skill) => skill.name === BOOTSTRAP_SKILL);
  if (!bootstrap) {
    ctx.logger.warn(`superpowers: ${BOOTSTRAP_SKILL} is missing, so no bootstrap section is registered`);
    return;
  }

  ctx.systemPrompt.section({
    name: 'superpowers:bootstrap',
    order: BOOTSTRAP_ORDER,
    text: `<EXTREMELY_IMPORTANT>
You have superpowers.

The using-superpowers skill content is included below and is already loaded for this session. Follow it now. Do not load using-superpowers again with the skill tool.

${bootstrap.content}

${TOOL_MAPPING}
</EXTREMELY_IMPORTANT>`,
  });
}
