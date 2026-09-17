/**
 * Superpowers plugin for OpenCode.ai
 *
 * Injects superpowers bootstrap context via message transform.
 * Auto-registers skills directory via config hook (no symlinks needed).
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

// Module-level cache for bootstrap content.
// The SKILL.md file does not change during a session, so reading + parsing it
// once eliminates redundant fs.existsSync + fs.readFileSync + regex work on
// every agent step.  See #1202 for the full analysis.
let _bootstrapCache = undefined; // undefined = not yet loaded, null = file missing

// --- Task-subagent (child session) detection --------------------------------
//
// #2160: the bootstrap drives controller workflows (brainstorming, planning,
// approval cycles). Injecting it into task subagent sessions makes workers
// restart design/approval cycles for work the parent already authorised; the
// <SUBAGENT-STOP> note inside the bootstrap relies on model compliance, which
// is not reliable. Detect child sessions structurally instead: OpenCode task
// sessions are created with a parentID, so when the session carrying the
// message has a parentID we skip bootstrap injection. Skills stay registered
// for every session — workers keep explicit access to execution skills.

// sessionID -> is-child decision. parentID never changes for a session, so
// the result is cached for life and the injection hook (which fires on every
// agent step) pays only one client roundtrip per session.
const _childSessionCache = new Map();

// sessionIDs whose lookup failure has already been logged. Failed lookups are
// deliberately not cached (so they can recover), which means the hook retries
// every step; without this guard a persistently failing session would log an
// error on every single step.
const _lookupFailureLogged = new Set();

const logLookupFailure = (sessionID, reason) => {
  if (_lookupFailureLogged.has(sessionID)) return;
  _lookupFailureLogged.add(sessionID);
  console.error('[superpowers] session lookup failed, treating session as top-level:', reason);
};

const isChildSession = async (fetchSession, sessionID) => {
  if (!sessionID) return false; // unknown session: keep current behavior
  if (_childSessionCache.has(sessionID)) return _childSessionCache.get(sessionID);

  let result;
  try {
    result = await fetchSession(sessionID);
  } catch (err) {
    // Fail open: on lookup errors keep injecting (previous behavior) and do
    // not cache, so a transient failure can recover on the next step.
    logLookupFailure(sessionID, err);
    return false;
  }

  // The V1 SDK only throws on non-2xx when called with { throwOnError: true }
  // (sdk error-interceptor.ts); without it an error resolves as
  // { data: undefined, error, response } and never reaches the catch above.
  // Treat that shape as a lookup failure too and never cache it — otherwise
  // one transient error would pin a child session as top-level for its whole
  // life and re-inject the controller bootstrap every step (#2160).
  if (!result || (typeof result === 'object' && result.error)) {
    logLookupFailure(sessionID, result && result.error ? result.error : result);
    return false;
  }

  // The V1 SDK returns { data: Session }; V2's ctx returns the record itself.
  // Prefer .data whenever it is a non-null object — Session records have no
  // `data` field, so the shapes stay unambiguous even if the envelope happens
  // to carry its own parentID key.
  const session = result && typeof result === 'object' && result.data && typeof result.data === 'object'
    ? result.data
    : result;
  const isChild = Boolean(session && typeof session === 'object' && session.parentID);

  if (isChild) {
    // One-time visibility: a missing bootstrap in a subagent session should
    // be explainable from the logs instead of failing silently.
    console.log('[superpowers] skipping controller bootstrap for task subagent session:', sessionID);
  }
  _childSessionCache.set(sessionID, isChild);
  return isChild;
};

export const SuperpowersPlugin = async ({ client, directory }) => {
  const homeDir = os.homedir();
  const superpowersSkillsDir = path.resolve(__dirname, '../../skills');
  const envConfigDir = normalizePath(process.env.OPENCODE_CONFIG_DIR, homeDir);
  const configDir = envConfigDir || path.join(homeDir, '.config/opencode');

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

  return {
    // Inject skills path into live config so OpenCode discovers superpowers skills
    // without requiring manual symlinks or config file edits.
    // This works because Config.get() returns a cached singleton — modifications
    // here are visible when skills are lazily discovered later.
    config: async (config) => {
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
      // This prevents double injection when OpenCode passes an already
      // transformed in-memory message array through the hook again.
      if (firstUser.parts.some(p => p.type === 'text' && p.text.includes('EXTREMELY_IMPORTANT'))) return;

      // #2160: never restart the controller workflow inside task subagent
      // (child) sessions. V1 passes no input to this hook (verified in the
      // 1.18.x bundle: trigger(..., {}, {messages})), so take the sessionID
      // from the message record itself.
      if (client && await isChildSession(
        // throwOnError makes the SDK throw on non-2xx so HTTP errors reach
        // the catch path; isChildSession's result.error check still covers
        // versions/callers that ignore the flag.
        (id) => client.session.get({ path: { id } }, { throwOnError: true }),
        firstUser.info.sessionID,
      )) return;

      const ref = firstUser.parts[0];
      firstUser.parts.unshift({ ...ref, type: 'text', text: bootstrap });
    }
  };
};
