import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { execSync } from 'child_process';

const TEST_DIR = path.join(process.cwd(), 'tests', 'temp_tm_cli');
const TODO_FILE = 'TODO.md';
const TM_SCRIPT = path.resolve(process.cwd(), 'lib/task-manager.js');

// Helper to run the CLI
function runCLI(args) {
    return execSync(`node ${TM_SCRIPT} ${args}`, { cwd: TEST_DIR, encoding: 'utf8' });
}

try {
    console.log('Running TaskManager Integration tests...');

    // Setup
    if (fs.existsSync(TEST_DIR)) {
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });

    // Test 1: Default (Local) Create Task
    {
        console.log('  Testing "create" command...');
        const output = runCLI('create --title "CLI Task" --desc "From Test"');
        assert.ok(output.includes('Created local task:'), 'Output should confirm creation');

        const content = fs.readFileSync(path.join(TEST_DIR, TODO_FILE), 'utf8');
        assert.ok(content.includes('CLI Task'), 'TODO file should have task');

        // Extract ID for next test
        const match = output.match(/Created local task: (LOCAL-\S+)/);
        if (!match) throw new Error('Could not extract ID from output');
        const taskId = match[1];

        // Test 2: Log Work
        console.log('  Testing "log-work" command...');
        runCLI(`log-work --id ${taskId} --time "30m" --comment "Testing"`);

        const updatedContent = fs.readFileSync(path.join(TEST_DIR, TODO_FILE), 'utf8');
        assert.ok(updatedContent.includes(`Worklog [${taskId}]: 30m - Testing`), 'TODO file should have worklog');
    }

    // Test 3: Subtask
    {
        console.log('  Testing "subtask" command...');
        const output = runCLI('subtask --parent "PARENT-1" --title "Subtask CLI"');
        assert.ok(output.includes('Created local task:'), 'Output should confirm creation');

        const content = fs.readFileSync(path.join(TEST_DIR, TODO_FILE), 'utf8');
        assert.ok(content.includes('Subtask CLI'), 'TODO file should have subtask');
        assert.ok(content.includes('Parent: PARENT-1'), 'TODO file should link parent');
    }

    console.log('  ✔ TaskManager CLI integration tests passed');

} catch (error) {
    console.error('❌ TaskManager tests failed:', error);
    if (error.stdout) console.log('stdout:', error.stdout);
    if (error.stderr) console.error('stderr:', error.stderr);
    process.exit(1);
} finally {
    // Cleanup
    if (fs.existsSync(TEST_DIR)) {
        fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
}
