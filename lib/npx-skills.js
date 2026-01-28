const { spawnSync } = require('node:child_process');

const ANSI_REGEX = /\u001b\[[0-9;]*m/g;
const SKILL_ID_REGEX = /^[^\s/]+\/[^\s@]+@[^\s@]+$/;

function stripAnsi(input) {
  if (!input) return '';
  return input.replace(ANSI_REGEX, '');
}

function parseFindOutput(output) {
  const lines = stripAnsi(output)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const results = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.startsWith('Install with')) continue;
    if (line.startsWith('└')) continue;
    if (!SKILL_ID_REGEX.test(line)) continue;

    let url = null;
    const next = lines[i + 1];
    if (next && next.startsWith('└')) {
      const maybeUrl = next.replace(/^└\s+/, '').trim();
      if (maybeUrl.startsWith('http')) {
        url = maybeUrl;
        i += 1;
      }
    }

    results.push({ id: line, url });
  }

  return results;
}

function buildNpxArgs(args) {
  return ['--yes', 'skills', ...args];
}

function runNpxSkills(args, options = {}) {
  const runner = options.spawnSync || spawnSync;
  const result = runner('npx', buildNpxArgs(args), {
    shell: false,
    stdio: 'pipe',
    ...options.spawnOptions,
  });

  return {
    status: result.status,
    stdout: result.stdout ? result.stdout.toString() : '',
    stderr: result.stderr ? result.stderr.toString() : '',
  };
}

module.exports = {
  stripAnsi,
  parseFindOutput,
  buildNpxArgs,
  runNpxSkills,
};
