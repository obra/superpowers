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

// Sessions compacted since the last transform, keyed by sessionID.
// Mirrors Pi's `injectBootstrap` flag (set on session_start/session_compact,
// cleared on agent_end). The flag is belt-and-suspenders alongside the
// stateless compaction-artifact check in the transform below, for compactions
// whose summary message is absent from the transform input.
const _pendingCompactionReinject = new Set();

const _markCompactionPending = (sessionID) => {
  if (typeof sessionID === 'string' && sessionID) _pendingCompactionReinject.add(sessionID);
};

const _takeCompactionPending = (sessionID) => {
  if (typeof sessionID !== 'string' || !sessionID) return false;
  const was = _pendingCompactionReinject.has(sessionID);
  _pendingCompactionReinject.delete(sessionID);
  return was;
};

const _sessionIDOf = (output) => {
  for (const m of output.messages || []) {
    for (const p of m.parts || []) {
      if (p && typeof p.sessionID === 'string' && p.sessionID) return p.sessionID;
    }
  }
  return undefined;
};

const _hasBootstrapMarker = (msg) =>
  (msg.parts || []).some(
    (p) => p?.type === 'text' && typeof p.text === 'string' && p.text.includes('EXTREMELY_IMPORTANT'),
  );

// True when a message at/after the most recent compaction artifact already
// carries the bootstrap — i.e. an earlier continue-turn was re-grounded, so
// this compaction needs no further injection (once per compaction).
const _postCompactionGrounded = (messages) => {
  let cutoff = -1;
  messages.forEach((m, i) => {
    if (m.info?.role === 'compactionSummary') cutoff = i;
    else if ((m.parts || []).some((p) => p?.type === 'compaction')) cutoff = i;
  });
  return messages.slice(cutoff + 1).some(_hasBootstrapMarker);
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

    // Mark the session for bootstrap re-injection on its next transform.
    // experimental.session.compacting fires before the LLM generates the
    // continuation summary; injection itself stays in the message transform
    // so the bootstrap bytes stay identical and cached.
    'experimental.session.compacting': async (input) => {
      _markCompactionPending(input?.sessionID);
    },

    // Documented session lifecycle event (OpenCode Plugins docs, Session
    // Events: session.compacted). Covers compactions whose summary message
    // is absent from the transform input.
    event: async ({ event }) => {
      if (!event || event.type !== 'session.compacted') return;
      _markCompactionPending(
        event.properties?.sessionID ?? event.properties?.sessionId ?? event.sessionID
      );
    },

    // Fires after compaction, before the synthetic continue-turn (observed
    // on OpenCode 1.18.x; absent from the public plugin docs, so older or
    // newer builds may simply never call it — which is fine, the two hooks
    // above plus artifact detection already cover the gap). Mark-only, same
    // as the other two signals.
    'experimental.compaction.autocontinue': async (input) => {
      _markCompactionPending(input?.sessionID);
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

      // After compaction the bootstrap has been summarized away, so the
      // post-compaction continue-turn would lose its grounding. Pi handles
      // this via session_compact -> re-inject after leading compactionSummary
      // messages; per-step re-injection alone does not, because it targets
      // the ORIGINAL first user message. Detect the just-compacted case two
      // ways (flag OR artifact) and inject into the continue-turn instead.
      // Non-compacted sessions take the exact same path as before.
      const hasCompactionArtifact = output.messages.some((m) => {
        if (m.info?.role === 'compactionSummary') return true;
        return (m.parts || []).some((p) => p?.type === 'compaction');
      });
      const sessionID = _sessionIDOf(output);
      // Consumed on first use: a set flag means compaction fired since the
      // last transform, so any marker already in history is stale.
      const wasFlagged = _takeCompactionPending(sessionID);
      const justCompacted = wasFlagged || hasCompactionArtifact;

      // Non-compacted path: the absolute first user message — identical to
      // the old `.find()` behavior, so long sessions don't pay per-turn
      // token bloat (#750).
      // Compacted path: the LAST user message (the continue-turn), because
      // history may still hold the stale pre-compaction first user turn. In
      // the truncated-history shape ([compactionSummary, freshTurn]) first
      // and last coincide.
      let target = null;
      if (justCompacted) {
        // Once per compaction: a freshly fired flag means every marker in
        // history is pre-compaction, so only the target turn is checked.
        // On the artifact-only path (flag already consumed), skip when a
        // post-artifact message already carries the bootstrap — an earlier
        // continue-turn was re-grounded and still stands.
        if (!wasFlagged && _postCompactionGrounded(output.messages)) return;
        for (const m of output.messages) {
          if (m.info?.role === 'user') target = m;
        }
      } else {
        target = output.messages.find(m => m.info?.role === 'user');
      }
      if (!target || !target.parts?.length) return;

      // Guard: skip if THIS turn already contains bootstrap.
      // This prevents double injection when OpenCode passes an already
      // transformed in-memory message array through the hook again.
      if (_hasBootstrapMarker(target)) return;

      const ref = target.parts[0];
      target.parts.unshift({ ...ref, type: 'text', text: bootstrap });
    }
  };
};
