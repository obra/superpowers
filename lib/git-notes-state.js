import { execSync } from 'child_process';

const REF = 'refs/notes/superpowers';

export function getState() {
    try {
        const output = execSync(`git notes --ref ${REF} show`, { stdio: 'pipe' }).toString();
        return JSON.parse(output);
    } catch (e) {
        return {};
    }
}

export function updateState(newData) {
    const currentState = getState();
    const newState = { ...currentState, ...newData };
    const json = JSON.stringify(newState);
    // Use 'add -f' to overwrite existing note
    const cmd = `git notes --ref ${REF} add -f -m '${json.replace(/'/g, "'\\''")}'`;
    const options = process.platform === 'win32' ? { shell: 'sh' } : {};
    execSync(cmd, options);
}
