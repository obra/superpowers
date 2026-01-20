import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { LocalAdapter } from '../../lib/adapters/local-adapter.js';

// Setup
const TEST_DIR = path.join(process.cwd(), 'tests', 'temp_local');
const TODO_FILE = 'TEST_TODO.md';

if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
}

// Change cwd for the test duration so LocalAdapter picks up the right file
const originalCwd = process.cwd();
process.chdir(TEST_DIR);

try {
    console.log('Running LocalAdapter tests...');

    // Test 1: ensureFile() creates file if missing
    {
        if (fs.existsSync(TODO_FILE)) fs.unlinkSync(TODO_FILE);
        const adapter = new LocalAdapter({ todo_file: TODO_FILE });
        adapter.ensureFile();
        assert.ok(fs.existsSync(TODO_FILE), 'TODO file should be created');
        const content = fs.readFileSync(TODO_FILE, 'utf8');
        assert.ok(content.includes('# Tasks'), 'TODO file should have header');
        console.log('  ✔ ensureFile() passed');
    }

    // Test 2: createTask() appends task
    {
        const adapter = new LocalAdapter({ todo_file: TODO_FILE });
        const result = await adapter.createTask('Test Task', 'Description', 'Task');
        assert.ok(result.id.startsWith('LOCAL-'), 'ID should start with LOCAL-');
        const content = fs.readFileSync(TODO_FILE, 'utf8');
        assert.ok(content.includes('Test Task'), 'File should contain task title');
        assert.ok(content.includes('Description'), 'File should contain description');
        console.log('  ✔ createTask() passed');
    }

    // Test 3: logWork() appends log
    {
        const adapter = new LocalAdapter({ todo_file: TODO_FILE });
        const { id } = await adapter.createTask('Work Log Task');
        await adapter.logWork(id, '1h', 'Did stuff');
        const content = fs.readFileSync(TODO_FILE, 'utf8');
        assert.ok(content.includes(`Worklog [${id}]: 1h - Did stuff`), 'File should contain worklog');
        console.log('  ✔ logWork() passed');
    }

    // Test 4: createSubtask()
    {
        const adapter = new LocalAdapter({ todo_file: TODO_FILE });
        const parentId = 'PARENT-123';
        const result = await adapter.createSubtask(parentId, 'Child Task');
        const content = fs.readFileSync(TODO_FILE, 'utf8');
        assert.ok(content.includes('Child Task'), 'File should contain subtask title');
        assert.ok(content.includes(`Parent: ${parentId}`), 'File should link to parent');
        console.log('  ✔ createSubtask() passed');
    }

} catch (error) {
    console.error('❌ LocalAdapter tests failed:', error);
    process.exit(1);
} finally {
    // Cleanup
    process.chdir(originalCwd);
    if (fs.existsSync(path.join(TEST_DIR, TODO_FILE))) {
        fs.unlinkSync(path.join(TEST_DIR, TODO_FILE));
    }
    fs.rmdirSync(TEST_DIR);
}
