import assert from 'assert';
import { spawnSync } from 'child_process';
import { getState } from '../../lib/git-notes-state.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const recordFindingScript = join(__dirname, '../../lib/record-finding.js');

try {
    console.log("Testing record-finding CLI...");

    // Test recording a simple string finding
    spawnSync('node', [
        recordFindingScript,
        '--role', 'architecture',
        '--key', 'vision',
        '--value', 'modular-amplifiers'
    ], { stdio: 'inherit' });

    let state = getState();
    assert.strictEqual(state.architecture.vision, 'modular-amplifiers');
    assert.ok(state.metadata.timestamp);

    // Test recording a JSON finding
    const jsonValue = JSON.stringify({ pattern: 'adapter', layer: 'bridge' });
    spawnSync('node', [
        recordFindingScript,
        '--role', 'implementation',
        '--key', 'patterns',
        '--value', jsonValue
    ], { stdio: 'inherit' });

    state = getState();
    assert.deepStrictEqual(state.implementation.patterns, { pattern: 'adapter', layer: 'bridge' });

    console.log("PASS: record-finding e2e test");
} catch (e) {
    console.error("FAIL:", e.message);
    process.exit(1);
}
