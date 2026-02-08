import assert from 'assert';
import { updateState, getState } from '../../lib/git-notes-state.js';

try {
    const testData = { task: "T1", status: "done" };
    updateState(testData);
    const state = getState();
    assert.deepStrictEqual(state.task, "T1");
    console.log("PASS");
} catch (e) {
    console.error("FAIL", e.message);
    process.exit(1);
}
