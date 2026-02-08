import assert from 'assert';
import { test, mock } from 'node:test';
import child_process from 'child_process';
import * as visualization from '../../lib/visualize-workflow.js';

test('generateDashboard should contain table and mermaid block with mocked data', async () => {
    const mockedWorktrees = `C:/Przemek/superpowers                                6e97d3e [main]
C:/Przemek/superpowers/.worktrees/opencode-dashboard  6e97d3e [feature/opencode-dashboard]`;
    
    const mockedNotes = JSON.stringify({
        architecture: { task: "Design UI", status: "active" },
        implementation: { task: "Coding components", status: "active" }
    });

    const execMock = mock.method(child_process, 'execSync', (cmd) => {
        if (cmd.includes('worktree list')) {
            return Buffer.from(mockedWorktrees);
        }
        if (cmd.includes('notes') && cmd.includes('show')) {
            return Buffer.from(mockedNotes);
        }
        return Buffer.from('');
    });

    try {
        const dashboard = visualization.generateDashboard();
        
        assert.ok(dashboard.includes('### Status Pulse'), 'Should contain Status Pulse header');
        assert.ok(dashboard.includes('| architecture | Design UI | active |'), 'Should contain architecture task');
        assert.ok(dashboard.includes('| implementation | Coding components | active |'), 'Should contain implementation task');
        assert.ok(dashboard.includes('| diagnostics | - | idle |'), 'Should show idle for diagnostics');
        
        assert.ok(dashboard.includes('```mermaid'), 'Should contain mermaid block');
        assert.ok(dashboard.includes('architecture["architecture<br/>(active)<br/>Design UI"]'), 'Should contain architecture node in mermaid');
        assert.ok(dashboard.includes('wt0["Worktree: superpowers<br/>main"]'), 'Should contain worktree 0 in mermaid');
        assert.ok(dashboard.includes('wt1["Worktree: opencode-dashboard<br/>feature/opencode-dashboard"]'), 'Should contain worktree 1 in mermaid');
        
        // Check if active class is applied
        assert.ok(dashboard.includes('class architecture active'), 'Should apply active class to architecture');
        assert.ok(dashboard.includes('class implementation active'), 'Should apply active class to implementation');
        assert.ok(dashboard.includes('class diagnostics idle'), 'Should apply idle class to diagnostics');
    } finally {
        execMock.mock.restore();
    }
});
