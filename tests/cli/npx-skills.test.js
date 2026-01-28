const test = require('node:test');
const assert = require('node:assert/strict');
const { stripAnsi, parseFindOutput, buildNpxArgs, runNpxSkills } = require('../../lib/npx-skills');

test('stripAnsi removes ANSI codes', () => {
  const input = '\u001b[31mred\u001b[0m text';
  assert.equal(stripAnsi(input), 'red text');
});

test('parseFindOutput extracts skill ids and urls', () => {
  const output = [
    'Install with npx skills add <owner/repo@skill>',
    'softaworks/agent-toolkit@codex',
    '└ https://skills.sh/softaworks/agent-toolkit/codex',
    '',
    'am-will/codex-skills@planner',
    '└ https://skills.sh/am-will/codex-skills/planner'
  ].join('\n');

  assert.deepEqual(parseFindOutput(output), [
    { id: 'softaworks/agent-toolkit@codex', url: 'https://skills.sh/softaworks/agent-toolkit/codex' },
    { id: 'am-will/codex-skills@planner', url: 'https://skills.sh/am-will/codex-skills/planner' }
  ]);
});

test('parseFindOutput tolerates entries without url', () => {
  const output = 'owner/repo@skill';
  assert.deepEqual(parseFindOutput(output), [{ id: 'owner/repo@skill', url: null }]);
});

test('parseFindOutput ignores non-skill @ strings', () => {
  const output = [
    'email@test.com',
    'owner/repo@skill',
  ].join('\n');

  assert.deepEqual(parseFindOutput(output), [
    { id: 'owner/repo@skill', url: null }
  ]);
});

test('buildNpxArgs uses npx with skills subcommand', () => {
  assert.deepEqual(buildNpxArgs(['find', 'codex']), ['--yes', 'skills', 'find', 'codex']);
});

test('runNpxSkills returns stdout/stderr and status', () => {
  const fakeSpawn = (cmd, args, options) => {
    assert.equal(cmd, 'npx');
    assert.deepEqual(args, ['--yes', 'skills', 'find', 'codex']);
    assert.equal(options.shell, false);
    return { status: 0, stdout: Buffer.from('out'), stderr: Buffer.from('') };
  };

  const result = runNpxSkills(['find', 'codex'], { spawnSync: fakeSpawn });
  assert.deepEqual(result, { status: 0, stdout: 'out', stderr: '' });
});
