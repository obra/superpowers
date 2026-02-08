import child_process from 'child_process';
import { getState } from './git-notes-state.js';

/**
 * Parses 'git worktree list' output into an array of objects.
 */
export function getWorktrees() {
    try {
        const output = child_process.execSync('git worktree list', { stdio: 'pipe' }).toString();
        return output.trim().split('\n').filter(Boolean).map(line => {
            const parts = line.trim().split(/\s+/);
            const path = parts[0];
            const hash = parts[1];
            let branch = parts[2];
            if (branch) {
                branch = branch.replace(/[\[\]]/g, '');
            }
            return { path, hash, branch };
        });
    } catch (e) {
        return [];
    }
}

/**
 * Creates a Mermaid graph based on agents and worktrees.
 */
export function generateMermaid(state, worktrees) {
    let mermaid = '```mermaid\ngraph TD\n';
    
    const agents = ['architecture', 'implementation', 'diagnostics', 'registry'];
    
    // Style agents based on status
    mermaid += '  classDef active fill:#f9f,stroke:#333,stroke-width:2px;\n';
    mermaid += '  classDef idle fill:#fff,stroke:#333,stroke-width:1px;\n';

    agents.forEach(agent => {
        const data = state[agent] || {};
        const status = data.status || 'idle';
        const task = data.task || 'no active task';
        const label = `${agent}<br/>(${status})<br/>${task}`;
        mermaid += `  ${agent}["${label}"]\n`;
        
        if (status !== 'idle' && status !== 'done') {
            mermaid += `  class ${agent} active\n`;
        } else {
            mermaid += `  class ${agent} idle\n`;
        }
    });

    // Nodes for worktrees
    worktrees.forEach((wt, index) => {
        const name = wt.path.split(/[/\\]/).pop();
        const wtId = `wt${index}`;
        mermaid += `  ${wtId}["Worktree: ${name}<br/>${wt.branch || 'detached'}"]\n`;
    });

    // For now, no specific connections, just nodes.
    // Future: connect agents to worktrees if state includes that info.

    mermaid += '```';
    return mermaid;
}

/**
 * Creates the status pulse table.
 */
export function generateTable(state) {
    let table = '### Status Pulse\n\n| Agent | Task | Status |\n|-------|------|--------|\n';
    const agents = ['architecture', 'implementation', 'diagnostics', 'registry'];
    agents.forEach(agent => {
        const data = state[agent] || {};
        table += `| ${agent} | ${data.task || '-'} | ${data.status || 'idle'} |\n`;
    });
    return table;
}

/**
 * Combines both into a single Markdown block.
 */
export function generateDashboard() {
    const state = getState();
    const worktrees = getWorktrees();
    
    const table = generateTable(state);
    const mermaid = generateMermaid(state, worktrees);
    
    return `## OpenCode Dashboard\n\n${table}\n\n### Workflow Graph\n\n${mermaid}\n`;
}
