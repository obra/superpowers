/**
 * Superpowers plugin for DeepSeek Harness (`dsh`).
 *
 * Wires this repository's skills tree into dsh's runtime so the
 * session skill catalog and the system prompt are populated at load time:
 *
 *   1. `ctx.skills.register()` — every SKILL.md under `skills/`
 *      is read and contributed to dsh's skill registry under its
 *      frontmatter `name`. dsh's native `skill` tool then lists
 *      and loads them.
 *
 *   2. `ctx.systemPrompt.section()` — the `using-superpowers` body is
 *      wrapped in `<EXTREMELY_IMPORTANT>` and registered as an order-50
 *      system-prompt section. dsh reassembles the system prompt before
 *      every model step, so the bootstrap is present from the first
 *      request and survives compaction with no per-session opt-in.
 *
 * The plugin uses Node builtins only. dsh nests its own packages
 * inside its installation, so a plugin resolved from a profile cannot
 * import them — both registries are reached through the injected `ctx`
 * alone.
 *
 * The Cordis loader looks up this file by the path declared in the
 * `dsh.bundle.patch` entry of `package.json` (see `.dsh/cordis.patch.yml`).
 *
 * @module superpowers
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Cordis plugin name; surfaced in loader diagnostics and in the patched row. */
export const name = 'superpowers';

/** Services this plugin writes to; it stays inactive until both exist. */
export const inject = ['skills', 'systemPrompt'];

/**
 * Absolute path of the bundled `skills/` directory. The plugin lives at
 * `<repo>/.dsh/plugins/superpowers.js`, so the skills tree is two
 * levels up + `skills/`.
 */
const SKILLS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'skills');

/** Name of the bootstrap skill whose body fills the system-prompt section. */
const BOOTSTRAP_SKILL = 'using-superpowers';

/**
 * Prompt order of the bootstrap section. dsh reserves -1000 for the
 * harness identity, 0 for the deployment persona, and 1000-2900 for
 * tool guidance (TOOL_BASH starts at 1000, TOOL_REPORT at 2900; non-tool
 * `CONTEXT_ORDERS` occupy 110-120) — 50 puts the methodology after the
 * persona and before the contexts and tools it governs.
 */
const BOOTSTRAP_ORDER = 50;

/**
 * Description prefixes that mark a skill as fork-only and therefore
 * ineligible for registration. Defensive: upstream's `skills/` does
 * not contain any of these, but the same plugin source checked out
 * inside a fork would, and the `safety-check` family of skills is
 * expected to remain fork-internal.
 *
 * @type {ReadonlyArray<string>}
 */
const FORK_ONLY_DESCRIPTION_PREFIXES = Object.freeze(['safety-check']);

/**
 * Path fragments that mark a skill as living under a fork-only subtree
 * and therefore ineligible for registration.
 *
 * @type {ReadonlyArray<string>}
 */
const FORK_ONLY_PATH_FRAGMENTS = Object.freeze(['/fork/']);

/**
 * The dsh-specific deltas the skills cannot name themselves: prompt-only
 * subagents, whole-list todos, plan mode, and plain skill names. The
 * reference file `skills/using-superpowers/references/dsh-tools.md` is
 * the user-facing counterpart; the plugin test asserts both copies
 * carry the load-bearing `subagent` line so the two stay in sync.
 */
const TOOL_MAPPING = `## DeepSeek Harness tool mapping

Translate the Superpowers action vocabulary to these dsh tools (full reference: skills/using-superpowers/references/dsh-tools.md):

- Dispatch a subagent → \`subagent\` (standalone prompt; background by default) or \`subagent_fork\` (inherits this conversation). dsh has NO named subagent types — put the role and instructions in the prompt itself. Follow up with \`send_message\`, list with \`list_agents\`, stop with \`interrupt_agent\`. Large multi-agent orchestration → \`workflow\`. Fresh-agent iteration loops → \`ralph\` (only when the human asks for them).
- Create / update todos → \`todo_write\` (send the ENTIRE list every call — it replaces the previous list).
- Plan mode → \`exit_plan_mode\` (present the complete plan as markdown; implement only after approval).
- Invoke a skill → \`skill\` with the exact catalog name: plain \`brainstorming\`, never \`superpowers:brainstorming\`.`;

/**
 * Decide whether a skill is fork-internal and therefore ineligible for
 * registration. The check is purely structural: a path fragment match
 * catches anything living under a `fork/` subtree (the obvious home for
 * fork-only work), and a description prefix match catches the
 * `safety-check` family of skills, which can live anywhere in `skills/`
 * but always start with that name.
 *
 * @param {{name: string, description: string, path: string}} skill
 * @returns {boolean} `true` if the skill should be skipped.
 */
const isForkOnly = (skill) => {
  for (const fragment of FORK_ONLY_PATH_FRAGMENTS) {
    if (skill.path.includes(fragment)) return true;
  }
  const lower = skill.description.toLowerCase();
  for (const prefix of FORK_ONLY_DESCRIPTION_PREFIXES) {
    if (lower.startsWith(prefix)) return true;
  }
  return false;
};

/**
 * Split one `SKILL.md` into its YAML frontmatter fields and the
 * instruction body that follows. The harness frontmatter convention is
 * `name` (registry key) and `description` (catalog one-liner); a
 * `whenToUse` field is honored when present but never required.
 *
 * @param {string} raw - file contents.
 * @returns {{name?: string, description?: string, whenToUse?: string, body: string}}
 */
const parseSkill = (raw) => {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { body: raw.trim() };

  /** @type {Record<string, string>} */
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z][\w-]*):\s*(.+)$/);
    if (!field) continue;
    let value = field[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    fields[field[1]] = value;
  }
  return { ...fields, body: match[2].trim() };
};

/**
 * Read every bundled skill, skipping (and reporting) unreadable or
 * malformed ones. Skills that pass the frontmatter check but match
 * `isForkOnly()` are registered as well — that is intentional on
 * upstream, where no such skill exists — but the helper stays available
 * so a future plugin author can wire it in without re-deriving the rule.
 *
 * @param {{warn: (message: string) => void}} logger
 * @returns {ReadonlyArray<{name: string, description: string, whenToUse?: string, content: string, source: string, path: string, resourceBase: {kind: 'directory', path: string}}>}
 */
const readSkills = (logger) => {
  let entries;
  try {
    entries = readdirSync(SKILLS_DIR, { withFileTypes: true });
  } catch (error) {
    logger.warn(`superpowers: cannot read ${SKILLS_DIR}: ${error.message}`);
    return [];
  }

  /** @type {Array<{name: string, description: string, whenToUse?: string, content: string, source: string, path: string, resourceBase: {kind: 'directory', path: string}}>} */
  const skills = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;

    const skillDir = join(SKILLS_DIR, entry.name);
    const skillPath = join(skillDir, 'SKILL.md');

    let raw;
    try {
      raw = readFileSync(skillPath, 'utf8');
    } catch (error) {
      logger.warn(`superpowers: cannot read ${skillPath}: ${error.message}`);
      continue;
    }

    const parsed = parseSkill(raw);
    if (!parsed.name || !parsed.description || !parsed.body) {
      logger.warn(`superpowers: ${skillPath} needs name and description frontmatter and a body`);
      continue;
    }

    /** @type {{name: string, description: string, whenToUse?: string, content: string, source: string, path: string, resourceBase: {kind: 'directory', path: string}}} */
    const skill = {
      name: parsed.name,
      description: parsed.description,
      content: parsed.body,
      source: 'bundled',
      path: skillPath,
      resourceBase: { kind: 'directory', path: skillDir },
    };
    if (parsed.whenToUse) skill.whenToUse = parsed.whenToUse;
    skills.push(skill);
  }
  return skills;
};

/**
 * Filter the bundled skills to the public set. Today this is a no-op on
 * upstream `skills/`, but the helper exists so the defensive rule is
 * codified in one place and the test surface can pin it down.
 *
 * @param {ReadonlyArray<{name: string, description: string, path: string}>} skills
 * @returns {ReadonlyArray<{name: string, description: string, path: string}>}
 */
const filterPublic = (skills) => {
  return skills.filter((skill) => !isForkOnly(skill));
};

/**
 * Register the bundled skills and the bootstrap section. Every
 * registration is a Cordis effect disposed with the plugin's own fiber.
 *
 * @param {{
 *   logger: { warn: (message: string) => void },
 *   skills: { register: (skill: object) => void },
 *   systemPrompt: { section: (section: {name: string, order: number, text: string}) => void },
 * }} ctx
 */
export function apply(ctx) {
  const bundled = readSkills(ctx.logger);
  const publicSkills = filterPublic(bundled);
  for (const skill of publicSkills) ctx.skills.register(skill);

  const bootstrap = publicSkills.find((skill) => skill.name === BOOTSTRAP_SKILL);
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
