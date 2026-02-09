import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../');
const commandsDir = path.join(rootDir, 'commands');

const memorizeCmd = path.join(commandsDir, 'memorize.js');
const recallCmd = path.join(commandsDir, 'recall.js');
const snapshotCmd = path.join(commandsDir, 'snapshot-memory.js');

const snapshotPath = path.join(rootDir, 'docs/memory/SNAPSHOT.md');

// Helper to run command
const run = (cmd, args = []) => {
  // Simple quoting for args - this is basic but sufficient for this test case
  const command = `node "${cmd}" ${args.join(' ')}`;
  console.log(`Running: ${command}`);
  try {
    return execSync(command, { cwd: rootDir, encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    if (error.stderr) console.error(error.stderr);
    if (error.stdout) console.log(error.stdout);
    throw error;
  }
};

try {
  console.log('--- Starting E2E Memory Test ---');

  // 1. Memorize a decision
  const decisionValue = "Use standard JSON format for all memory files to ensure compatibility.";
  console.log('1. Memorizing decision...');
  // We wrap value in quotes for shell
  run(memorizeCmd, ['knowledge_base.decisions', '--value', `"${decisionValue}"`]);

  // 2. Recall the decision
  console.log('2. Recalling decision...');
  const recallOutput = run(recallCmd, ['knowledge_base.decisions']);
  console.log('Recall output:', recallOutput);
  
  if (!recallOutput.includes(decisionValue)) {
    throw new Error('Recalled value does not match memorized value.');
  }

  // 3. Snapshot the memory
  console.log('3. Creating snapshot...');
  run(snapshotCmd);

  // 4. Verify SNAPSHOT.md
  console.log('4. Verifying SNAPSHOT.md...');
  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`Snapshot file not found at ${snapshotPath}`);
  }

  const snapshotContent = fs.readFileSync(snapshotPath, 'utf8');
  console.log('Snapshot content preview:', snapshotContent.substring(0, 200));

  if (!snapshotContent.includes(decisionValue)) {
    throw new Error('Snapshot does not contain the memorized decision.');
  }

  console.log('--- E2E Memory Test PASSED ---');

} catch (error) {
  console.error('--- E2E Memory Test FAILED ---');
  console.error(error);
  process.exit(1);
}
