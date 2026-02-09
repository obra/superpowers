
import assert from 'assert';
import { execSync } from 'child_process';
import { updateState, getState } from '../../lib/git-notes-state.js';
import * as memoryOps from '../../lib/memory-ops.js';

const TEST_REF = 'refs/notes/superpowers-test';
process.env.SUPERPOWERS_NOTES_REF = TEST_REF;

function clearTestNotes() {
    try {
        execSync(`git notes --ref ${TEST_REF} remove`, { stdio: 'ignore' });
    } catch (e) {
        // Ignore if no notes exist
    }
}

async function runTests() {
    console.log('Running Memory Ops Tests...');
    
    // Setup
    clearTestNotes();
    updateState({
        knowledge_base: {
            decisions: [],
            patterns: [],
            glossary: {}
        }
    });

    try {
        // Test queryMemory
        console.log('Test: queryMemory');
        const initialState = {
            knowledge_base: {
                decisions: [{ id: 1, text: 'test decision' }],
                glossary: { term1: 'def1' }
            }
        };
        updateState(initialState);

        const result = memoryOps.queryMemory('knowledge_base.decisions');
        assert.deepStrictEqual(result, [{ id: 1, text: 'test decision' }]);
        
        const term = memoryOps.queryMemory('knowledge_base.glossary.term1');
        assert.strictEqual(term, 'def1');

        const nonExistent = memoryOps.queryMemory('knowledge_base.nonexistent');
        assert.strictEqual(nonExistent, undefined);
        console.log('PASS: queryMemory');

        // Test appendToMemory (Array)
        console.log('Test: appendToMemory (Array)');
        // Reset state for clean test
        clearTestNotes();
        updateState({
             knowledge_base: {
                decisions: [],
                patterns: [],
                glossary: {}
            }
        });
        
        memoryOps.appendToMemory('knowledge_base.decisions', { id: 1, text: 'd1' });
        let state = getState();
        assert.deepStrictEqual(state.knowledge_base.decisions, [{ id: 1, text: 'd1' }]);

        memoryOps.appendToMemory('knowledge_base.decisions', { id: 2, text: 'd2' });
        state = getState();
        assert.deepStrictEqual(state.knowledge_base.decisions, [
            { id: 1, text: 'd1' },
            { id: 2, text: 'd2' }
        ]);
        console.log('PASS: appendToMemory (Array)');

        // Test appendToMemory (Object Merge)
        console.log('Test: appendToMemory (Object Merge)');
        memoryOps.appendToMemory('knowledge_base.glossary', { term1: 'd1' });
        state = getState();
        assert.deepStrictEqual(state.knowledge_base.glossary, { term1: 'd1' });

        memoryOps.appendToMemory('knowledge_base.glossary', { term2: 'd2' });
        state = getState();
        assert.deepStrictEqual(state.knowledge_base.glossary, { 
            term1: 'd1',
            term2: 'd2'
        });
        console.log('PASS: appendToMemory (Object Merge)');

    } catch (e) {
        console.error('FAIL:', e);
        process.exit(1);
    } finally {
        // Teardown
        clearTestNotes();
    }
}

runTests();
