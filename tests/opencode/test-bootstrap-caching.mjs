import fs from 'fs';
import { pathToFileURL } from 'url';

const [, , pluginPath, scenario] = process.argv;

if (!pluginPath || !['present', 'missing'].includes(scenario)) {
  console.error('Usage: node test-bootstrap-caching.mjs PLUGIN_PATH present|missing');
  process.exit(2);
}

let existsCount = 0;
let readCount = 0;

const originalExistsSync = fs.existsSync;
const originalReadFileSync = fs.readFileSync;

fs.existsSync = function (...args) {
  if (isBootstrapSkillPath(args[0])) {
    existsCount += 1;
  }
  return originalExistsSync.apply(this, args);
};

fs.readFileSync = function (...args) {
  if (isBootstrapSkillPath(args[0])) {
    readCount += 1;
  }
  return originalReadFileSync.apply(this, args);
};

const mod = await import(pathToFileURL(pluginPath).href);
const plugin = await mod.SuperpowersPlugin({ client: {}, directory: '.' });
const transform = plugin['experimental.chat.messages.transform'];

// Mapping constants are flavor-specific (#opencode-v2): V1 keeps the 1.18.x
// tool names, V2 teaches the renamed tools. Assert both directly.
const mappingFailures = assertMappingConstants(mod);

const firstOutput = makeOutput(`${scenario} bootstrap first step`);
await transform({}, firstOutput);
const afterFirst = { existsCount, readCount };

const secondOutput = makeOutput(`${scenario} bootstrap second step`);
await transform({}, secondOutput);
const afterSecond = { existsCount, readCount };

// Exercise the V2 path (setup() + ctx.session.hook("context")) with a mock
// ctx so the V2_MAPPING wiring is verified, not just the constant. Run after
// the V1 count snapshots: setup() reads SKILL.md files during registration.
const v2Result = await runV2ContextHook(mod);

const result = {
  scenario,
  firstBootstrapParts: countBootstrapParts(firstOutput),
  secondBootstrapParts: countBootstrapParts(secondOutput),
  staleMentionMapping: bootstrapText(firstOutput).includes('@mention'),
  staleTaskMapping: bootstrapText(firstOutput).includes('`Task` tool with subagents'),
  mapsSubagentToTask: bootstrapText(firstOutput).includes('`task` with `subagent_type: "general"`'),
  mapsMutationToApplyPatch: bootstrapText(firstOutput).includes('`apply_patch`'),
  firstReadCount: afterFirst.readCount,
  secondReadCount: afterSecond.readCount,
  firstExistsCount: afterFirst.existsCount,
  secondExistsCount: afterSecond.existsCount,
  v2BootstrapParts: v2Result.bootstrapParts,
  mapsV2SubagentTool: v2Result.text.includes('`subagent` with `agent: "general"`'),
  mapsV2SessionIDContinuation: v2Result.text.includes('`sessionID` to continue a previous subagent'),
  mapsV2NoTodoTool: v2Result.text.includes('no todo tool'),
  mapsV2MutationToPatch: v2Result.text.includes('`patch` with `patchText`'),
  mapsV2Shell: v2Result.text.includes('`shell`'),
  staleV1ToolsInV2: v2Result.text.includes('`apply_patch`') || v2Result.text.includes('`todowrite`') || v2Result.text.includes('`subagent_type`'),
};

const failures = scenario === 'present'
  ? assertPresentBootstrap(result)
  : assertMissingBootstrap(result);

if (scenario === 'present') {
  failures.push(...assertV2Bootstrap(result));
}
failures.push(...mappingFailures);

if (failures.length > 0) {
  console.error(JSON.stringify(result, null, 2));
  for (const failure of failures) {
    console.error(`FAIL: ${failure}`);
  }
  process.exit(1);
}

console.log(JSON.stringify(result, null, 2));

function isBootstrapSkillPath(filePath) {
  return String(filePath).replaceAll('\\', '/').includes('using-superpowers/SKILL.md');
}

function makeOutput(text) {
  return {
    messages: [{
      info: { role: 'user' },
      parts: [{ type: 'text', text }],
    }],
  };
}

function countBootstrapParts(output) {
  return output.messages[0].parts.filter(
    (part) => part.type === 'text' && part.text.includes('EXTREMELY_IMPORTANT')
  ).length;
}

function bootstrapText(output) {
  return output.messages[0].parts.find(
    (part) => part.type === 'text' && part.text.includes('EXTREMELY_IMPORTANT')
  )?.text || '';
}

function assertPresentBootstrap(result) {
  const failures = [];
  if (result.firstBootstrapParts !== 1) {
    failures.push(`expected first transform to inject one bootstrap part, got ${result.firstBootstrapParts}`);
  }
  if (result.secondBootstrapParts !== 1) {
    failures.push(`expected second transform to inject one bootstrap part, got ${result.secondBootstrapParts}`);
  }
  if (result.firstReadCount !== 1) {
    failures.push(`expected first transform to read SKILL.md once, got ${result.firstReadCount}`);
  }
  if (result.secondReadCount !== result.firstReadCount) {
    failures.push(`expected cached second transform to do no additional reads, got ${result.secondReadCount - result.firstReadCount}`);
  }
  if (result.secondExistsCount !== result.firstExistsCount) {
    failures.push(`expected cached second transform to do no additional exists checks, got ${result.secondExistsCount - result.firstExistsCount}`);
  }
  if (result.staleMentionMapping) {
    failures.push('expected OpenCode bootstrap not to teach @mention subagent syntax');
  }
  if (result.staleTaskMapping) {
    failures.push('expected OpenCode bootstrap not to teach stale Task-tool mapping');
  }
  if (!result.mapsSubagentToTask) {
    failures.push('expected OpenCode bootstrap to map general-purpose subagents to task with subagent_type');
  }
  if (!result.mapsMutationToApplyPatch) {
    failures.push('expected OpenCode bootstrap to map file mutation to apply_patch');
  }
  return failures;
}

function assertMissingBootstrap(result) {
  const failures = [];
  if (result.firstBootstrapParts !== 0) {
    failures.push(`expected no bootstrap when SKILL.md is missing, got ${result.firstBootstrapParts}`);
  }
  if (result.secondBootstrapParts !== 0) {
    failures.push(`expected no bootstrap on second missing-file transform, got ${result.secondBootstrapParts}`);
  }
  if (result.firstReadCount !== 0 || result.secondReadCount !== 0) {
    failures.push(`expected missing file path to avoid reads, got ${result.secondReadCount}`);
  }
  if (result.firstExistsCount < 1) {
    failures.push('expected first transform to check whether SKILL.md exists');
  }
  if (result.secondExistsCount !== result.firstExistsCount) {
    failures.push(`expected missing-file result to be cached, got ${result.secondExistsCount - result.firstExistsCount} extra exists checks`);
  }
  return failures;
}

function assertMappingConstants(mod) {
  const failures = [];
  if (typeof mod.V1_MAPPING !== 'string' || typeof mod.V2_MAPPING !== 'string') {
    failures.push('expected plugin to export V1_MAPPING and V2_MAPPING string constants');
    return failures;
  }
  for (const needle of ['`todowrite`', '`task` with `subagent_type: "general"`', '`apply_patch`', '`bash`']) {
    if (!mod.V1_MAPPING.includes(needle)) {
      failures.push(`expected V1_MAPPING to keep the 1.18.x tool name ${needle}`);
    }
  }
  for (const needle of [
    '`subagent` with `agent: "general"`',
    '`sessionID` to continue a previous subagent',
    'no todo tool',
    '`patch` with `patchText`',
    '`shell`',
    '`read`',
    '`grep`, `glob`',
    '`webfetch`',
  ]) {
    if (!mod.V2_MAPPING.includes(needle)) {
      failures.push(`expected V2_MAPPING to teach the V2 tool ${needle}`);
    }
  }
  for (const stale of ['`todowrite`', '`task` with', '`apply_patch`', '`bash`']) {
    if (mod.V2_MAPPING.includes(stale)) {
      failures.push(`expected V2_MAPPING not to teach the V1-only tool name ${stale}`);
    }
  }
  return failures;
}

// Drive setup() with a mock V2 ctx and fire the captured "context" hook on a
// top-level (parentID-less) session. Returns the injected-part count and the
// injected bootstrap text ('' when nothing was injected).
async function runV2ContextHook(mod) {
  let contextHook = null;
  const ctx = {
    skill: {
      transform: async (fn) => {
        fn({ add: () => {} });
      },
    },
    session: {
      hook: async (name, cb) => {
        if (name === 'context') contextHook = cb;
      },
      get: async ({ sessionID }) => ({ id: sessionID }), // top-level: no parentID
    },
  };
  try {
    await mod.default.setup(ctx);
  } catch (err) {
    console.error('[test] V2 setup() threw:', err);
    return { bootstrapParts: 0, text: '' };
  }
  if (typeof contextHook !== 'function') {
    return { bootstrapParts: 0, text: '' };
  }
  const event = {
    sessionID: 'sess-v2-top',
    messages: [{ role: 'user', content: [{ type: 'text', text: 'v2 bootstrap step' }] }],
  };
  await contextHook(event);
  const parts = event.messages[0].content.filter(
    (part) => part.type === 'text' && part.text.includes('EXTREMELY_IMPORTANT')
  );
  return { bootstrapParts: parts.length, text: parts[0]?.text || '' };
}

function assertV2Bootstrap(result) {
  const failures = [];
  if (result.v2BootstrapParts !== 1) {
    failures.push(`expected V2 context hook to inject one bootstrap part, got ${result.v2BootstrapParts}`);
    return failures;
  }
  if (!result.mapsV2SubagentTool) {
    failures.push('expected V2 bootstrap to map general-purpose subagents to subagent with agent');
  }
  if (!result.mapsV2SessionIDContinuation) {
    failures.push('expected V2 bootstrap to teach sessionID continuation for subagents');
  }
  if (!result.mapsV2NoTodoTool) {
    failures.push('expected V2 bootstrap to state that V2 has no todo tool');
  }
  if (!result.mapsV2MutationToPatch) {
    failures.push('expected V2 bootstrap to map file mutation to patch with patchText');
  }
  if (!result.mapsV2Shell) {
    failures.push('expected V2 bootstrap to map shell commands to the shell tool');
  }
  if (result.staleV1ToolsInV2) {
    failures.push('expected V2 bootstrap not to teach V1-only tool names (apply_patch/todowrite/subagent_type)');
  }
  return failures;
}
