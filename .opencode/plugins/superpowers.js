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

// Simple frontmatter extraction (avoid dependency on skills-core for
// bootstrap). Handles plain `key: value` lines, quoted values (including
// quotes that close on an indented continuation line), YAML block scalar
// markers (`>`, `|`) with indented continuation lines, and CRLF line
// endings. Not a full YAML parser — nested maps flatten into their parent
// key's value, which is fine for the name/description fields consumed here.
const extractAndStripFrontmatter = (content) => {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content };

  const frontmatterStr = match[1];
  const body = match[2];
  const frontmatter = {};
  let lastKey = null;

  for (const rawLine of frontmatterStr.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0 && !/^\s/.test(line)) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      // Block scalar markers (>, |, optionally with +/- chomping) carry no
      // value themselves; the indented lines that follow do.
      frontmatter[key] = /^(>[+-]?|\|[+-]?)$/.test(value) ? '' : value;
      lastKey = key;
    } else if (lastKey !== null && line.trim() !== '') {
      // Continuation of a multi-line value: append rather than drop so long
      // descriptions survive parsing. Newlines collapse to spaces — good
      // enough for the single-line name/description fields consumed here.
      frontmatter[lastKey] = `${frontmatter[lastKey]} ${line.trim()}`.trim();
    }
  }

  // A quoted value may close on a continuation line, so unquote only once
  // the value is fully assembled: strip exactly one matching surrounding
  // pair and leave unbalanced quotes alone.
  for (const key of Object.keys(frontmatter)) {
    frontmatter[key] = frontmatter[key].replace(/^(["'])([\s\S]*)\1$/, '$2');
  }

  return { frontmatter, content: body };
};

// Tool mapping injected into the bootstrap, differentiated by host flavor.
// V1 (OpenCode 1.18.x) and V2 (OpenCode 2.0.4/2.0.7) expose different built-in
// tools, so each flavor's injection path picks its own constant below.
// Exported for tests (tests/opencode/test-bootstrap-caching.mjs).

// V1 built-ins: todowrite, task (subagent_type), skill, read, apply_patch,
// bash, grep, glob, webfetch.
export const V1_MAPPING = `**Tool Mapping for OpenCode:**
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

// V2 built-ins: no todo tool at all; task → subagent (agent name in 'agent',
// continuation via sessionID); apply_patch → patch (patchText, same patch
// format); bash → shell. read, write, edit, grep, glob, webfetch, websearch,
// and skill all exist under those names (verified against the 2.0.4 and 2.0.7
// host contracts).
export const V2_MAPPING = `**Tool Mapping for OpenCode:**
When skills request actions, substitute OpenCode equivalents:
- Create or update todos → OpenCode v2 has no todo tool; track the plan in a markdown file (or the harness's plan facility) instead
- \`Subagent (general-purpose):\` → \`subagent\` with \`agent: "general"\` (give it \`description\` and \`prompt\`, optionally \`background\`; pass \`sessionID\` to continue a previous subagent)
- V2 model-role routing: select a named role only when it is available in the subagent catalog: \`superpowers-expert\` for architecture, difficult debugging, security analysis, and final review; \`superpowers-main\` for implementation; \`superpowers-economic\` for exploration and routine work; \`superpowers-economic-fast\` for short, low-risk checks. If the needed role is unavailable, invoke \`subagent\` with \`agent: "general"\` and state that model-role routing is not installed.
- Invoke a skill → OpenCode's native \`skill\` tool
- Read files → \`read\`
- Create, edit, or delete files → use \`patch\` with \`patchText\` when available; otherwise use \`write\` to create or overwrite files, \`edit\` for targeted changes, and \`shell\` for deletion
- Run shell commands → \`shell\` (\`command\`, \`workdir\`, \`timeout\`, \`background\`)
- Search files → \`grep\`, \`glob\`
- Fetch a URL → \`webfetch\`
- Search the web → \`websearch\`

Use OpenCode's native \`skill\` tool to list and load skills.`;

// Module-level cache for bootstrap content, keyed by tool mapping (host
// flavor). The SKILL.md file does not change during a session, so reading +
// parsing it once eliminates redundant fs.existsSync + fs.readFileSync +
// regex work on every agent step.  See #1202 for the full analysis.
const _bootstrapCache = new Map(); // mapping -> bootstrap (null = file missing)

// Helper to generate bootstrap content (cached after first call per mapping)
const getBootstrapContent = (toolMapping) => {
  // Return cached result on subsequent calls
  if (_bootstrapCache.has(toolMapping)) return _bootstrapCache.get(toolMapping);

  // Try to load using-superpowers skill
  const skillPath = path.join(superpowersSkillsDir, 'using-superpowers', 'SKILL.md');
  if (!fs.existsSync(skillPath)) {
    _bootstrapCache.set(toolMapping, null);
    return null;
  }

  const fullContent = fs.readFileSync(skillPath, 'utf8');
  const { content } = extractAndStripFrontmatter(fullContent);

  _bootstrapCache.set(toolMapping, `<EXTREMELY_IMPORTANT>
You have superpowers.

**IMPORTANT: The using-superpowers skill content is included below. It is ALREADY LOADED - you are currently following it. Do NOT use the skill tool to load "using-superpowers" again - that would be redundant.**

${content}

${toolMapping}
</EXTREMELY_IMPORTANT>`);

  return _bootstrapCache.get(toolMapping);
};

// --- Task-subagent (child session) detection --------------------------------
//
// #2160: the bootstrap drives controller workflows (brainstorming, planning,
// approval cycles). Injecting it into task subagent sessions makes workers
// restart design/approval cycles for work the parent already authorised; the
// <SUBAGENT-STOP> note inside the bootstrap relies on model compliance, which
// is not reliable. Detect child sessions structurally instead: a parentID on
// the session is the child signal on both flavors (task sessions are created
// with one; top-level sessions simply lack the field), so when the session
// carrying the message has a parentID we skip bootstrap injection. Skills
// stay registered for every session — workers keep explicit access to
// execution skills.

// sessionID -> is-child decision. parentID never changes for a session, so
// the result is cached until eviction and the injection hook (which fires on
// every agent step) pays only one client roundtrip per session. The V2
// service process is long-lived and sessions accumulate over weeks, so the
// cache is bounded: when full, drop the oldest quarter (Map iterates keys in
// insertion order). An evicted session merely pays one extra lookup if seen
// again.
const CHILD_SESSION_CACHE_MAX = 512;
const _childSessionCache = new Map();

const _cacheChildSession = (sessionID, isChild) => {
  if (_childSessionCache.size >= CHILD_SESSION_CACHE_MAX) {
    let toDrop = Math.ceil(CHILD_SESSION_CACHE_MAX / 4);
    for (const key of _childSessionCache.keys()) {
      if (toDrop-- <= 0) break;
      _childSessionCache.delete(key);
    }
  }
  _childSessionCache.set(sessionID, isChild);
};

const isChildSession = async (fetchSession, sessionID) => {
  if (!sessionID) return false; // unknown session: keep current behavior
  if (_childSessionCache.has(sessionID)) return _childSessionCache.get(sessionID);

  let isChild = false;
  try {
    const result = await fetchSession(sessionID);
    // V1 returns a successful SDK envelope while V2 returns a direct session
    // record. Validate both shapes before classifying or caching the result;
    // resolved SDK errors must follow the same fail-open path as rejections.
    if (!result || typeof result !== 'object' || Array.isArray(result)) {
      throw new Error('Session lookup returned no usable record');
    }
    if (result.error != null || result.response?.ok === false) {
      throw new Error('Session lookup was unsuccessful');
    }
    const session = 'data' in result ? result.data : result;
    if (!session || typeof session !== 'object' || Array.isArray(session) || session.id !== sessionID) {
      throw new Error('Session lookup returned an invalid session identity');
    }
    if (session.parentID !== undefined &&
        (typeof session.parentID !== 'string' || session.parentID.length === 0)) {
      throw new Error('Session lookup returned an invalid parent identity');
    }
    isChild = session.parentID !== undefined;
  } catch (err) {
    // Fail open: on lookup errors keep injecting (previous behavior) and do
    // not cache, so a transient failure can recover on the next step.
    console.error('[superpowers] session lookup failed, treating session as top-level:', err);
    return false;
  }
  _cacheChildSession(sessionID, isChild);
  return isChild;
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

    // Inject bootstrap into the first user message of each top-level session.
    // Using a user message instead of a system message avoids:
    //   1. Token bloat from system messages repeated every turn (#750)
    //   2. Multiple system messages breaking Qwen and other models (#894)
    //
    // The hook fires on every agent step (not just every turn) because
    // opencode's prompt.ts reloads messages from DB each step.  Fresh message
    // arrays may need injection again, so getBootstrapContent() must not do
    // repeated disk work.
    'experimental.chat.messages.transform': async (_input, output) => {
      const bootstrap = getBootstrapContent(V1_MAPPING);
      if (!bootstrap || !output.messages.length) return;
      const firstUser = output.messages.find(m => m.info.role === 'user');
      if (!firstUser || !firstUser.parts.length) return;

      // Guard: skip if first user message already contains bootstrap.
      if (firstUser.parts.some(p => p.type === 'text' && p.text.includes('EXTREMELY_IMPORTANT'))) return;

      // #2160: never restart the controller workflow inside task subagent
      // (child) sessions. V1 passes no input to this hook (verified in the
      // 1.18.x bundle: trigger(..., {}, {messages})), so take the sessionID
      // from the message record itself.
      if (client && await isChildSession(
        (id) => client.session.get({ path: { id } }),
        firstUser.info.sessionID,
      )) return;

      const ref = firstUser.parts[0];
      firstUser.parts.unshift({ ...ref, type: 'text', text: bootstrap });
    }
  };
};

/**
 * V2 Setup Function (default.setup)
 *
 * Called by V2 PluginSupervisor (packages/core/src/plugin/supervisor.ts).
 * Performs two things:
 *
 * 1. Registers every skills/<name>/SKILL.md as a native Skill.Info object
 *    via ctx.skill.transform((draft) => draft.add(info)).
 *    V2 removed the old draft.source() directory registration; the draft API
 *    is now { list, add, update, remove } where add() decodes plain objects
 *    against the host's Skill.Info schema (OpenCode 2.0.4 contract):
 *    { id, name, description?, autoinvoke?, path, content }. The file field
 *    is `path` — renamed from `location` in upstream commit 199aabe9e2,
 *    first released in v2.0.4.
 *    See packages/core/src/plugin/skill.ts and packages/schema/src/skill.ts.
 * 2. Injects bootstrap context via ctx.session.hook("context"), the V2
 *    equivalent of V1's experimental.chat.messages.transform.
 */
async function setup(ctx) {
  // V1 (observed on opencode 1.18.18) also invokes default.setup, but with a
  // V1-shaped ctx that lacks the skill/session domains. Detect it and return
  // quietly — V1 is served entirely by the SuperpowersPlugin named export.
  if (!ctx || !ctx.skill || typeof ctx.skill.transform !== 'function' || !ctx.session || typeof ctx.session.hook !== 'function') {
    return;
  }

  // 1. Register skills (one transform; one draft.add per skill)
  try {
    const skills = [];
    if (fs.existsSync(superpowersSkillsDir)) {
      for (const entry of fs.readdirSync(superpowersSkillsDir, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
        const skillPath = path.join(superpowersSkillsDir, entry.name, 'SKILL.md');
        if (!fs.existsSync(skillPath)) continue;
        const { frontmatter, content } = extractAndStripFrontmatter(fs.readFileSync(skillPath, 'utf8'));
        skills.push({
          id: entry.name,
          name: frontmatter.name || entry.name,
          ...(frontmatter.description ? { description: frontmatter.description } : {}),
          // Skill.Info renamed its required file field `location` -> `path`
          // in OpenCode v2.0.4 (upstream commit 199aabe9e2).
          path: skillPath,
          content,
        });
      }
    }
    await ctx.skill.transform((draft) => {
      // draft.add() decodes against the host's Skill.Info schema and throws
      // synchronously on a mismatch. A throw escaping this callback is what
      // the host escalates into an asynchronous hard-disable of the entire
      // plugin ("Plugin disabled after skill.transform failed") — the
      // try/catch around ctx.skill.transform never sees it, and the
      // bootstrap hook is torn down as collateral. Contain failures per
      // skill so one rejected payload skips that skill instead of killing
      // skills AND bootstrap.
      for (const skill of skills) {
        try {
          draft.add(skill);
        } catch (err) {
          console.error(`[superpowers] skill "${skill.id}" rejected by host, skipping:`, err);
        }
      }
    });
  } catch (err) {
    // Never break plugin activation: one failing plugin takes down the whole
    // V2 generation (including provider/catalog plugins => no models in TUI).
    console.error('[superpowers] skill registration failed:', err);
  }

  // 2. Inject bootstrap into first user message via V2 session context hook
  try {
    await ctx.session.hook('context', async (event) => {
      try {
        const bootstrap = getBootstrapContent(V2_MAPPING);
        if (!bootstrap || !event.messages || !event.messages.length) return;
        const firstUser = event.messages.find(m => m.role === 'user');
        if (firstUser && (!firstUser.content || !firstUser.content.length)) return;
        if (firstUser?.content.some(p => p.type === 'text' && p.text && p.text.includes('EXTREMELY_IMPORTANT'))) return;

        // #2160: the context event carries the sessionID directly. Skip the
        // controller bootstrap when this prompt belongs to a task subagent
        // (child) session. Skills registered above stay available to workers.
        if (typeof ctx.session.get === 'function' && await isChildSession(
          (id) => ctx.session.get({ sessionID: id }),
          event.sessionID,
        )) return;

        // Native compaction can leave only an opaque checkpoint. Keep it
        // intact and append the transient bootstrap as a user message.
        if (firstUser) {
          firstUser.content.unshift({ type: 'text', text: bootstrap });
        } else {
          event.messages.push({ role: 'user', content: [{ type: 'text', text: bootstrap }] });
        }
      } catch (err) {
        // Never let hook callback errors break the request pipeline.
        console.error('[superpowers] context hook failed:', err);
      }
    });
  } catch (err) {
    console.error('[superpowers] session hook registration failed:', err);
  }
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
