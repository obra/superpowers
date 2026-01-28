const test = require('node:test');
const assert = require('node:assert/strict');
const { stripAnsi, parseFindOutput, buildNpxArgs } = require('../../lib/npx-skills');

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

test('buildNpxArgs uses npx with skills subcommand', () => {
  assert.deepEqual(buildNpxArgs(['find', 'codex']), ['--yes', 'skills', 'find', 'codex']);
});
