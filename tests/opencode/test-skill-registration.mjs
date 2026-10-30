import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';

// Verifies the V2 skill registration payload matches OpenCode 2.0.4's
// Skill.Info contract (packages/schema/src/skill.ts):
//   { id, name, description?, autoinvoke?, path, content }
// Upstream commit 199aabe9e2 (first released in v2.0.4) renamed the required
// file field `location` -> `path`. A wrong field name makes draft.add()
// throw inside the host's transform rebuild, which asynchronously disables
// the whole plugin ("Plugin disabled after skill.transform failed") and
// takes the bootstrap hook down with it — see PR #2106 review by 80avin.

const [, , inputPath] = process.argv;

if (!inputPath) {
  console.error('Usage: node test-skill-registration.mjs PLUGIN_PATH');
  process.exit(2);
}

const pluginPath = fs.realpathSync(inputPath);
const skillsDir = path.resolve(path.dirname(pluginPath), '../../skills');
const mod = await import(pathToFileURL(pluginPath).href);

const failures = [];

// --- Run 1: passive capture of every draft.add payload -------------------
const added = [];
await mod.default.setup(makeCtx({ add: (skill) => added.push(skill) }));

const expectedIds = fs.existsSync(skillsDir)
  ? fs.readdirSync(skillsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .filter((e) => fs.existsSync(path.join(skillsDir, e.name, 'SKILL.md')))
      .map((e) => e.name)
      .sort()
  : [];

if (added.length === 0) {
  failures.push('expected setup() to register at least one skill via draft.add()');
}
if (JSON.stringify(added.map((s) => s.id).sort()) !== JSON.stringify(expectedIds)) {
  failures.push(`expected draft.add() ids to match skills dir contents, got ${JSON.stringify(added.map((s) => s.id))}`);
}

for (const skill of added) {
  if (typeof skill.path !== 'string' || !path.isAbsolute(skill.path)) {
    failures.push(`skill "${skill.id}": expected required absolute Skill.Info field "path", got ${JSON.stringify(skill.path)}`);
  } else if (skill.path !== path.join(skillsDir, skill.id, 'SKILL.md')) {
    failures.push(`skill "${skill.id}": expected path ${path.join(skillsDir, skill.id, 'SKILL.md')}, got ${skill.path}`);
  } else if (!fs.existsSync(skill.path)) {
    failures.push(`skill "${skill.id}": path does not exist on disk: ${skill.path}`);
  }
  // Stale 2.0.3-era fields must not leak into the payload: the host strips
  // unknown keys, but keeping them would silently mask a future regression
  // to a schema that no longer accepts `path`.
  if ('location' in skill) {
    failures.push(`skill "${skill.id}": payload still carries the pre-2.0.4 field "location"`);
  }
  if ('slash' in skill) {
    failures.push(`skill "${skill.id}": payload carries "slash", removed from Skill.Info in 2.0.4`);
  }
  if (typeof skill.id !== 'string' || skill.id.length === 0) failures.push(`skill payload missing non-empty "id"`);
  if (typeof skill.name !== 'string' || skill.name.length === 0) failures.push(`skill "${skill.id}" missing non-empty "name"`);
  if (typeof skill.content !== 'string' || !skill.content.trim()) failures.push(`skill "${skill.id}" missing non-empty "content"`);
  if ('description' in skill && typeof skill.description !== 'string') {
    failures.push(`skill "${skill.id}": "description" must be a string when present`);
  } else if ('description' in skill && /["']$/.test(skill.description)) {
    failures.push(`skill "${skill.id}": description ends with a dangling quote: ${JSON.stringify(skill.description)}`);
  }
  if (typeof skill.content === 'string' && skill.content.startsWith('---')) {
    failures.push(`skill "${skill.id}": content still starts with the frontmatter delimiter`);
  }
}

// --- Run 2: hostile draft.add must not abort the remaining registrations --
// The real host swallows a throw escaping the transform callback and then
// hard-disables the plugin asynchronously. Locally we can only observe the
// synchronous half of that contract: when draft.add() rejects one skill, the
// plugin must keep registering the rest instead of aborting the loop.
const hostileId = added.length > 1 ? added[Math.floor(added.length / 2)].id : null;
const survived = [];
let setupThrew = null;
let survivingContextHook;
try {
  await mod.default.setup(makeCtx({
    add: (skill) => {
      if (skill.id === hostileId) throw new Error('Simulated Skill.Info decode failure');
      survived.push(skill.id);
    },
    onHook: (name, callback) => {
      if (name === 'context') survivingContextHook = callback;
    },
  }));
} catch (err) {
  setupThrew = err;
}
if (setupThrew) {
  failures.push(`expected setup() to contain draft.add() failures, but it threw: ${setupThrew.message}`);
} else if (hostileId) {
  const expectedSurvivors = added.map((s) => s.id).filter((id) => id !== hostileId);
  if (JSON.stringify(survived.sort()) !== JSON.stringify(expectedSurvivors.sort())) {
    failures.push(`expected all non-rejected skills to still register when one draft.add() throws, got ${JSON.stringify(survived)}`);
  }
}
if (typeof survivingContextHook !== 'function') {
  failures.push('expected bootstrap hook to survive a rejected skill');
} else {
  const event = {
    sessionID: 'registration-survival-root',
    messages: [{ role: 'user', content: [{ type: 'text', text: 'Continue' }] }],
  };
  await survivingContextHook(event);
  const count = event.messages.flatMap((message) => message.content).filter(
    (part) => part.type === 'text' && part.text.startsWith('<EXTREMELY_IMPORTANT>\nYou have superpowers.')
  ).length;
  if (count !== 1) failures.push(`expected surviving bootstrap once, got ${count}`);
}

// --- Run 3: quoted and multi-line frontmatter values ---------------------
// The description is what the host shows in its skill list. A quoted value
// that wraps onto indented continuation lines must register as one unquoted
// line, so exercise each layout against a synthetic install: a copy of the
// plugin next to fixture skills, laid out like a real package root.
const frontmatterFixtures = {
  'multi-line-double': {
    frontmatter: 'description: "Use when foo happens\n  and bar continues\n  and baz ends"',
    expected: 'Use when foo happens and bar continues and baz ends',
  },
  'multi-line-single': {
    frontmatter: "description: 'Use when foo happens\n  and bar continues\n  and baz ends'",
    expected: 'Use when foo happens and bar continues and baz ends',
  },
  'single-line-quoted': {
    frontmatter: 'description: "Plain quoted"',
    expected: 'Plain quoted',
  },
  'block-scalar': {
    frontmatter: 'description: >\n  Folded line one\n  line two',
    expected: 'Folded line one line two',
  },
};
const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'superpowers-frontmatter-'));
try {
  const fixturePlugin = path.join(fixtureRoot, '.opencode', 'plugins', 'superpowers.js');
  fs.mkdirSync(path.dirname(fixturePlugin), { recursive: true });
  fs.copyFileSync(pluginPath, fixturePlugin);
  for (const [id, { frontmatter }] of Object.entries(frontmatterFixtures)) {
    const skillDir = path.join(fixtureRoot, 'skills', id);
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), `---\nname: ${id}\n${frontmatter}\n---\n# Title\n\nBody.\n`);
  }
  const fixtureMod = await import(pathToFileURL(fixturePlugin).href);
  const fixtureAdded = [];
  await fixtureMod.default.setup(makeCtx({ add: (skill) => fixtureAdded.push(skill) }));
  for (const [id, { expected }] of Object.entries(frontmatterFixtures)) {
    const skill = fixtureAdded.find((s) => s.id === id);
    if (!skill) {
      failures.push(`fixture "${id}": expected setup() to register it`);
      continue;
    }
    if (skill.description !== expected) {
      failures.push(`fixture "${id}": expected description ${JSON.stringify(expected)}, got ${JSON.stringify(skill.description)}`);
    }
    if (skill.content.startsWith('---')) {
      failures.push(`fixture "${id}": content still starts with the frontmatter delimiter`);
    }
  }
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}

const result = {
  registered: added.length,
  ids: added.map((s) => s.id),
  allPathsValid: added.every((s) => s.path === path.join(skillsDir, s.id, 'SKILL.md') && fs.existsSync(s.path)),
  staleLocationField: added.some((s) => 'location' in s),
  hostileRejectedId: hostileId,
  survivedHostileAdd: JSON.stringify(survived.sort()) === JSON.stringify(added.map((s) => s.id).filter((id) => id !== hostileId).sort()),
};

if (failures.length > 0) {
  console.error(JSON.stringify(result, null, 2));
  for (const failure of failures) {
    console.error(`FAIL: ${failure}`);
  }
  process.exit(1);
}

console.log(JSON.stringify(result, null, 2));

function makeCtx({ add, onHook = () => {} }) {
  return {
    skill: {
      transform: async (fn) => {
        await fn({ list: () => [], get: () => undefined, add, update: () => {}, remove: () => {} });
      },
    },
    session: {
      hook: async (name, callback) => onHook(name, callback),
      get: async ({ sessionID }) => ({ id: sessionID }), // top-level: no parentID
    },
  };
}
