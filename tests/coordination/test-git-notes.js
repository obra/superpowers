import assert from 'assert';
import { updateState, getState } from '../../lib/git-notes-state.js';

try {
    const testData = { architecture: { task: "T1", status: "done" } };
    updateState(testData);
    const state = getState();
    assert.deepStrictEqual(state.architecture.task, "T1");
    console.log("PASS");
} catch (e) {
    console.error("FAIL", e.message);
    process.exit(1);
}
