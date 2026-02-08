import assert from 'assert';
import { updateState, getState } from '../../lib/git-notes-state.js';

function runTests() {
    console.log("Running schema validation tests...");

    // Test 1: Recursive Merge
    console.log("Test: Recursive Merge");
    // Reset state for test
    // Note: This might affect the actual git notes in the repo. 
    // In a real test environment we'd use a temporary repo, 
    // but here I'll just try to work with what I have.
    
    updateState({ architecture: { component: 'A' } });
    updateState({ architecture: { details: 'B' } });
    let state = getState();
    assert.deepStrictEqual(state.architecture, { component: 'A', details: 'B' });

    // Test 2: Schema Validation (Rejection of invalid top-level keys)
    console.log("Test: Schema Validation (Invalid keys)");
    try {
        updateState({ invalid_key: 'value' });
        assert.fail("Should have thrown error for invalid top-level key");
    } catch (e) {
        assert.ok(e.message.includes('Validation failed'), `Expected validation error, got: ${e.message}`);
    }

    // Test 3: Metadata Validation
    console.log("Test: Metadata Validation");
    try {
        updateState({ metadata: { last_agent: 123 } }); // last_agent should be string
        assert.fail("Should have thrown error for invalid metadata type");
    } catch (e) {
        assert.ok(e.message.includes('Validation failed'), `Expected validation error, got: ${e.message}`);
    }

    console.log("All schema validation tests PASSED");
}

try {
    runTests();
} catch (e) {
    console.error("Tests FAILED:", e.message);
    process.exit(1);
}
