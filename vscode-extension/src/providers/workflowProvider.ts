/**
 * Workflow Tree View Provider
 * Displays current workflow status and progress
 */

import * as vscode from 'vscode';

interface WorkflowStep {
    name: string;
    status: 'pending' | 'active' | 'completed' | 'failed';
    details?: string;
}

export class WorkflowProvider implements vscode.TreeDataProvider<WorkflowItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<WorkflowItem | undefined | null | void> = 
        new vscode.EventEmitter<WorkflowItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<WorkflowItem | undefined | null | void> = 
        this._onDidChangeTreeData.event;

    private activeSkill: string | null = null;
    private workflowSteps: WorkflowStep[] = [];

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    setActiveSkill(skillName: string): void {
        this.activeSkill = skillName;
        this.workflowSteps = this.getDefaultSteps(skillName);
        this.refresh();
    }

    clearActiveSkill(): void {
        this.activeSkill = null;
        this.workflowSteps = [];
        this.refresh();
    }

    updateStep(stepName: string, status: WorkflowStep['status'], details?: string): void {
        const step = this.workflowSteps.find(s => s.name === stepName);
        if (step) {
            step.status = status;
            if (details) {
                step.details = details;
            }
            this.refresh();
        }
    }

    private getDefaultSteps(skillName: string): WorkflowStep[] {
        const commonSteps: WorkflowStep[] = [
            { name: 'Initialize', status: 'active' },
            { name: 'Load Skill Instructions', status: 'pending' },
            { name: 'Analyze Context', status: 'pending' },
            { name: 'Execute Workflow', status: 'pending' },
            { name: 'Verify Results', status: 'pending' }
        ];

        // Skill-specific steps
        const skillSteps: Record<string, WorkflowStep[]> = {
            'brainstorming': [
                { name: 'Explore Project Context', status: 'pending' },
                { name: 'Ask Clarifying Questions', status: 'pending' },
                { name: 'Propose Approaches', status: 'pending' },
                { name: 'Present Design', status: 'pending' },
                { name: 'Write Spec Document', status: 'pending' }
            ],
            'systematic-debugging': [
                { name: 'Identify Problem', status: 'pending' },
                { name: 'Trace Root Cause', status: 'pending' },
                { name: 'Develop Fix', status: 'pending' },
                { name: 'Verify Fix', status: 'pending' },
                { name: 'Defense in Depth', status: 'pending' }
            ],
            'test-driven-development': [
                { name: 'Write Failing Test', status: 'pending' },
                { name: 'Run Test (RED)', status: 'pending' },
                { name: 'Write Minimal Code', status: 'pending' },
                { name: 'Run Test (GREEN)', status: 'pending' },
                { name: 'Refactor', status: 'pending' }
            ],
            'writing-plans': [
                { name: 'Load Spec', status: 'pending' },
                { name: 'Break Into Tasks', status: 'pending' },
                { name: 'Define Steps', status: 'pending' },
                { name: 'Add Verification', status: 'pending' },
                { name: 'Review Plan', status: 'pending' }
            ]
        };

        return skillSteps[skillName.toLowerCase().replace(/-/g, '-')] || commonSteps;
    }

    getTreeItem(element: WorkflowItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: WorkflowItem): Thenable<WorkflowItem[]> {
        if (!element) {
            if (!this.activeSkill) {
                return Promise.resolve([
                    new WorkflowItem(
                        'No Active Workflow',
                        'Select a skill to start a workflow',
                        'info',
                        vscode.TreeItemCollapsibleState.None
                    )
                ]);
            }

            const items: WorkflowItem[] = [
                new WorkflowItem(
                    `Active: ${this.activeSkill}`,
                    'Current workflow',
                    'active',
                    vscode.TreeItemCollapsibleState.Expanded
                )
            ];

            items.push(...this.workflowSteps.map(step => 
                new WorkflowItem(
                    step.name,
                    step.details || '',
                    step.status,
                    vscode.TreeItemCollapsibleState.None
                )
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
        
        const colors: Record<string, string> = {
            'pending': '',
            'active': 'charts.yellow',
            'completed': 'charts.green',
            'failed': 'charts.red',
            'info': ''
        };

        if (colors[status]) {
            // this.iconPath = new vscode.ThemeIcon(icons[status], new vscode.ThemeColor(colors[status]));
        }
    }
}
