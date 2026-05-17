#!/usr/bin/env node
/**
 * PostTaskValidation Hook - Automatic validation after file edits.
 *
 * Reads stdin for edit context, detects modified files, identifies
 * the affected project/stack, and runs verify-local.
 *
 * If validation fails, returns structured error to block the agent.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function main() {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { input += chunk; });
  process.stdin.on('end', () => {
    try {
      const data = JSON.parse(input);
      const modifiedFiles = data.modified_files || [];
      if (modifiedFiles.length === 0) {
        process.stdout.write('{}');
        return;
      }

      const cwd = data.cwd || process.cwd();

      let projectRoot = cwd;
      let current = cwd;
      while (current !== path.parse(current).root) {
        if (fs.existsSync(path.join(current, '.harness-workspace.json'))) {
          projectRoot = current;
          break;
        }
        current = path.dirname(current);
      }

      const cliPath = path.join(__dirname, '..', 'tools', 'harness', 'cli.ts');
      try {
        execSync(`npx ts-node "${cliPath}" local`, { cwd: projectRoot, stdio: 'pipe' });
        process.stdout.write(JSON.stringify({ decision: 'allow', reason: 'Validation passed' }));
      } catch (error) {
        const output = error.stderr?.toString() || error.stdout?.toString() || 'Validation failed';
        process.stdout.write(JSON.stringify({
          decision: 'block',
          reason: `Validation failed: ${output.substring(0, 500)}`
        }));
      }
    } catch (_) {
      process.stdout.write('{}');
    }
  });
}

main();
