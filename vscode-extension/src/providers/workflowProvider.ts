import * as vscode from 'vscode';

interface WorkflowStep {
    name: string;
    status: 'pending' | 'active' | 'completed' | 'failed';
}

export class WorkflowProvider implements vscode.TreeDataProvider<WorkflowItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<WorkflowItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private activeSkill: string | null = null;
    private workflowSteps: WorkflowStep[] = [];

    refresh(): void { this._onDidChangeTreeData.fire(); }

    setActiveSkill(skillName: string): void {
        this.activeSkill = skillName;
        this.workflowSteps = [
            { name: 'Initialize', status: 'active' },
            { name: 'Load Instructions', status: 'pending' },
            { name: 'Execute', status: 'pending' },
            { name: 'Verify', status: 'pending' }
        ];
        this.refresh();
    }

    clearActiveSkill(): void {
        this.activeSkill = null;
        this.workflowSteps = [];
        this.refresh();
    }

    getTreeItem(element: WorkflowItem): vscode.TreeItem { return element; }

    getChildren(element?: WorkflowItem): Thenable<WorkflowItem[]> {
        if (!element) {
            if (!this.activeSkill) {
                return Promise.resolve([
                    new WorkflowItem('No Active Workflow', 'Select a skill to start', 'info', vscode.TreeItemCollapsibleState.None)
                ]);
            }

            const items = [
                new WorkflowItem(`Active: ${this.activeSkill}`, '', 'active', vscode.TreeItemCollapsibleState.None)
            ];

            items.push(...this.workflowSteps.map(step =>
                new WorkflowItem(step.name, '', step.status, vscode.TreeItemCollapsibleState.None)
            ));

            return Promise.resolve(items);
        }
        return Promise.resolve([]);
    }
}

class WorkflowItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly description: string,
        public readonly status: 'pending' | 'active' | 'completed' | 'failed' | 'info',
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.description = description;

        const icons: Record<string, string> = {
            'pending': 'circle-outline',
            'active': 'sync~spin',
            'completed': 'check',
            'failed': 'error',
            'info': 'info'
        };

        this.iconPath = new vscode.ThemeIcon(icons[status] || 'circle');
    }
}