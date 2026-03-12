/**
 * Workflow Tree View Provider
 * Displays current workflow status and progress
 */

import * as vscode from 'vscode';

/**
 * Represents a step in a workflow.
 */
interface WorkflowStep {
    /** Step name */
    name: string;
    /** Step status */
    status: 'pending' | 'active' | 'completed' | 'failed';
    /** Optional step details */
    details?: string;
}

/**
 * Tree data provider for displaying workflow progress in the sidebar.
 */
export class WorkflowProvider implements vscode.TreeDataProvider<WorkflowItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<WorkflowItem | undefined | null | void> =
        new vscode.EventEmitter<WorkflowItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<WorkflowItem | undefined | null | void> =
        this._onDidChangeTreeData.event;

    private activeSkill: string | null = null;
    private workflowSteps: WorkflowStep[] = [];

    /**
     * Refreshes the tree view.
     */
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Sets the active skill and initializes its workflow steps.
     * @param skillName - Name of the skill to activate
     */
    setActiveSkill(skillName: string): void {
        this.activeSkill = skillName;
        this.workflowSteps = this.getDefaultSteps(skillName);
        this.refresh();
    }

    /**
     * Clears the active skill and workflow steps.
     */
    clearActiveSkill(): void {
        this.activeSkill = null;
        this.workflowSteps = [];
        this.refresh();
    }

    /**
     * Updates the status of a workflow step.
     *
     * TODO: Wire this into executeSkill() to provide real-time progress updates.
     * Call updateStep() at key lifecycle points:
     * - Before execution: updateStep('Initialize', 'active')
     * - During execution: updateStep(stepName, 'active'/'completed', details)
     * - On success: updateStep('Verify Results', 'completed')
     * - On failure: updateStep(currentStep, 'failed', errorMessage)
     *
     * @param stepName - Name of the step to update
     * @param status - New status
     * @param details - Optional details
     */
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

    /**
     * Gets default workflow steps for a skill.
     * @param skillName - Skill name to get steps for
     * @returns Array of workflow steps
     */
    private getDefaultSteps(skillName: string): WorkflowStep[] {
        const commonSteps: WorkflowStep[] = [
            { name: 'Initialize', status: 'active' },
            { name: 'Load Skill Instructions', status: 'pending' },
            { name: 'Analyze Context', status: 'pending' },
            { name: 'Execute Workflow', status: 'pending' },
            { name: 'Verify Results', status: 'pending' }
        ];

        // Skill-specific workflow steps
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

        return skillSteps[skillName.toLowerCase()] || commonSteps;
    }

    /**
     * Gets the tree item for an element.
     */
    getTreeItem(element: WorkflowItem): vscode.TreeItem {
        return element;
    }

    /**
     * Gets children for the tree view.
     * @param element - Parent element, or undefined for root
     */
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

    /**
     * Disposes the provider and its event emitter.
     */
    dispose(): void {
        this._onDidChangeTreeData.dispose();
    }
}

/**
 * Tree item representing a workflow step.
 */
class WorkflowItem extends vscode.TreeItem {
    /**
     * Creates a new WorkflowItem.
     * @param label - Display label
     * @param description - Item description
     * @param status - Step status
     * @param collapsibleState - Collapsible state
     */
    constructor(
        public readonly label: string,
        description: string,
        public readonly status: 'pending' | 'active' | 'completed' | 'failed' | 'info',
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = description;

        // Map status to appropriate icons
        const iconMap: Record<string, string> = {
            'pending': 'circle-outline',
            'active': 'sync~spin',
            'completed': 'check',
            'failed': 'error',
            'info': 'info'
        };

        this.iconPath = new vscode.ThemeIcon(iconMap[status] || 'circle');
    }
}