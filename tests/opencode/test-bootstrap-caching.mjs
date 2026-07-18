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
const plugin = mod.default;

if (!plugin || typeof plugin.setup !== 'function') {
  console.error('FAIL: plugin default export is missing a setup(ctx) function (OpenCode v2 API)');
  process.exit(1);
}

// Drive the v2 plugin: run setup() with a mock context that captures the
// "context" session hook, then invoke that hook the way OpenCode does before
// each model dispatch.
let contextHook;
const mockCtx = {
  skill: {
    transform: async (cb) => cb({ source: () => {}, list: () => [] }),
    reload: async () => {},
  },
  session: {
    hook: async (name, cb) => {
      if (name === 'context') contextHook = cb;
    },
  },
};

await plugin.setup(mockCtx);

if (typeof contextHook !== 'function') {
  console.error('FAIL: plugin.setup did not register a "context" session hook');
  process.exit(1);
}

const firstInput = makeInput(`${scenario} bootstrap first step`);
contextHook(firstInput);
const afterFirst = { existsCount, readCount };

const secondInput = makeInput(`${scenario} bootstrap second step`);
contextHook(secondInput);
const afterSecond = { existsCount, readCount };

const result = {
  scenario,
  firstBootstrapParts: countBootstrapParts(firstInput),
  secondBootstrapParts: countBootstrapParts(secondInput),
  staleMentionMapping: bootstrapText(firstInput).includes('@mention'),
  staleTaskMapping: bootstrapText(firstInput).includes('`Task` tool with subagents'),
  staleApplyPatchMapping: bootstrapText(firstInput).includes('apply_patch'),
  mapsSubagentToTask: bootstrapText(firstInput).includes('`task` with `subagent_type: "general"`'),
  mapsMutationToWriteEdit: bootstrapText(firstInput).includes('`write`')
    && bootstrapText(firstInput).includes('`edit`'),
  firstReadCount: afterFirst.readCount,
  secondReadCount: afterSecond.readCount,
  firstExistsCount: afterFirst.existsCount,
  secondExistsCount: afterSecond.existsCount,
};

const failures = scenario === 'present'
  ? assertPresentBootstrap(result)
  : assertMissingBootstrap(result);

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

// OpenCode v2 message shape: { role, content: [{ type: 'text', text }] }
function makeInput(text) {
  return {
    system: [],
    tools: {},
    messages: [{
      role: 'user',
      content: [{ type: 'text', text }],
    }],
  };
}

function countBootstrapParts(input) {
  return input.messages[0].content.filter(
    (part) => part.type === 'text' && part.text.includes('EXTREMELY_IMPORTANT')
  ).length;
}

function bootstrapText(input) {
  return input.messages[0].content.find(
    (part) => part.type === 'text' && part.text.includes('EXTREMELY_IMPORTANT')
  )?.text || '';
}

function assertPresentBootstrap(result) {
  const failures = [];
  if (result.firstBootstrapParts !== 1) {
    failures.push(`expected first hook to inject one bootstrap part, got ${result.firstBootstrapParts}`);
  }
  if (result.secondBootstrapParts !== 1) {
    failures.push(`expected second hook to inject one bootstrap part, got ${result.secondBootstrapParts}`);
  }
  if (result.firstReadCount !== 1) {
    failures.push(`expected first hook to read SKILL.md once, got ${result.firstReadCount}`);
  }
  if (result.secondReadCount !== result.firstReadCount) {
    failures.push(`expected cached second hook to do no additional reads, got ${result.secondReadCount - result.firstReadCount}`);
  }
  if (result.secondExistsCount !== result.firstExistsCount) {
    failures.push(`expected cached second hook to do no additional exists checks, got ${result.secondExistsCount - result.firstExistsCount}`);
  }
  if (result.staleMentionMapping) {
    failures.push('expected OpenCode bootstrap not to teach @mention subagent syntax');
  }
  if (result.staleTaskMapping) {
    failures.push('expected OpenCode bootstrap not to teach stale Task-tool mapping');
  }
  if (result.staleApplyPatchMapping) {
    failures.push('expected OpenCode v2 bootstrap not to reference the removed apply_patch tool');
  }
  if (!result.mapsSubagentToTask) {
    failures.push('expected OpenCode bootstrap to map general-purpose subagents to task with subagent_type');
  }
  if (!result.mapsMutationToWriteEdit) {
    failures.push('expected OpenCode v2 bootstrap to map file mutation to write/edit');
  }
  return failures;
}

function assertMissingBootstrap(result) {
  const failures = [];
  if (result.firstBootstrapParts !== 0) {
    failures.push(`expected no bootstrap when SKILL.md is missing, got ${result.firstBootstrapParts}`);
  }
  if (result.secondBootstrapParts !== 0) {
    failures.push(`expected no bootstrap on second missing-file hook, got ${result.secondBootstrapParts}`);
  }
  if (result.firstReadCount !== 0 || result.secondReadCount !== 0) {
    failures.push(`expected missing file path to avoid reads, got ${result.secondReadCount}`);
  }
  if (result.firstExistsCount < 1) {
    failures.push('expected first hook to check whether SKILL.md exists');
  }
  if (result.secondExistsCount !== result.firstExistsCount) {
    failures.push(`expected missing-file result to be cached, got ${result.secondExistsCount - result.firstExistsCount} extra exists checks`);
  }
  return failures;
}
