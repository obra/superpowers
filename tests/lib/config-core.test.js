
import { loadConfig } from '../../lib/config-core.js';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';

const TEST_DIR = path.join(os.tmpdir(), 'superpowers-test-' + Date.now());
const USER_CONFIG_DIR = path.join(TEST_DIR, 'home', '.superpowers');
const PROJECT_DIR = path.join(TEST_DIR, 'project');
const PROJECT_CONFIG_DIR = path.join(PROJECT_DIR, '.superpowers');

// Mock homedir for test
const originalHomedir = os.homedir;
os.homedir = () => path.join(TEST_DIR, 'home');

function setup() {
    fs.mkdirSync(USER_CONFIG_DIR, { recursive: true });
    fs.mkdirSync(PROJECT_CONFIG_DIR, { recursive: true });
}

function teardown() {
    os.homedir = originalHomedir;
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
}

async function runTests() {
    console.log('Running config-core tests...');

    try {
        setup();

        // Test 1: Defaults (no config files)
        console.log('Test 1: Defaults (no config files)');
        let config = loadConfig(PROJECT_DIR);
        assert.deepStrictEqual(config, {});

        // Test 2: User config only
        console.log('Test 2: User config only');
        fs.writeFileSync(path.join(USER_CONFIG_DIR, 'config.json'), JSON.stringify({
            storage: { provider: 'local' },
            project_management: { provider: 'notion' }
        }));
        config = loadConfig(PROJECT_DIR);
        assert.strictEqual(config.storage.provider, 'local');
        assert.strictEqual(config.project_management.provider, 'notion');

        // Test 3: Project config overrides user config
        console.log('Test 3: Project config overrides user config');
        fs.writeFileSync(path.join(PROJECT_CONFIG_DIR, 'config.json'), JSON.stringify({
            project_management: { provider: 'jira' }
        }));
        config = loadConfig(PROJECT_DIR);
        assert.strictEqual(config.storage.provider, 'local'); // Inherited
        assert.strictEqual(config.project_management.provider, 'jira'); // Overridden

        // Test 4: Project config adds new keys
        console.log('Test 4: Project config adds new keys');
        fs.writeFileSync(path.join(PROJECT_CONFIG_DIR, 'config.json'), JSON.stringify({
            project_management: { provider: 'jira' },
            extra: { key: 'value' }
        }));
        config = loadConfig(PROJECT_DIR);
        assert.strictEqual(config.extra.key, 'value');

        console.log('All tests passed!');
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    } finally {
        teardown();
    }
}

runTests();
