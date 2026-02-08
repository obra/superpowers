import child_process from 'child_process';
import { validate, deepMerge } from './state-schema.js';

const REF = 'refs/notes/superpowers';

export function getState() {
    try {
        const output = child_process.execSync(`git notes --ref ${REF} show`, { stdio: 'pipe' }).toString();
        return JSON.parse(output);
    } catch (e) {
        return {};
    }
}

export function updateState(newData) {
    validate(newData);
    const currentState = getState();
    const newState = deepMerge(currentState, newData);
    const json = JSON.stringify(newState);
    // Use 'add -f' to overwrite existing note
    const cmd = `git notes --ref ${REF} add -f -m '${json.replace(/'/g, "'\\''")}'`;
    const options = process.platform === 'win32' ? { shell: 'sh' } : {};
    child_process.execSync(cmd, options);
}
