"use strict";
/**
 * Workflow Tree View Provider
 * Displays current workflow status and progress
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowProvider = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Tree data provider for displaying workflow progress in the sidebar.
 */
class WorkflowProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.activeSkill = null;
        this.workflowSteps = [];
    }
    /**
     * Refreshes the tree view.
     */
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    /**
     * Sets the active skill and initializes its workflow steps.
     * @param skillName - Name of the skill to activate
     */
    setActiveSkill(skillName) {
        this.activeSkill = skillName;
        this.workflowSteps = this.getDefaultSteps(skillName);
        this.refresh();
    }
    /**
     * Clears the active skill and workflow steps.
     */
    clearActiveSkill() {
        this.activeSkill = null;
        this.workflowSteps = [];
        this.refresh();
    }
    /**
     * Updates the status of a workflow step.
     * @param stepName - Name of the step to update
     * @param status - New status
     * @param details - Optional details
     */
    updateStep(stepName, status, details) {
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
    getDefaultSteps(skillName) {
        const commonSteps = [
            { name: 'Initialize', status: 'active' },
            { name: 'Load Skill Instructions', status: 'pending' },
            { name: 'Analyze Context', status: 'pending' },
            { name: 'Execute Workflow', status: 'pending' },
            { name: 'Verify Results', status: 'pending' }
        ];
        // Skill-specific workflow steps
        const skillSteps = {
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
    getTreeItem(element) {
        return element;
    }
    /**
     * Gets children for the tree view.
     * @param element - Parent element, or undefined for root
     */
    getChildren(element) {
        if (!element) {
            if (!this.activeSkill) {
                return Promise.resolve([
                    new WorkflowItem('No Active Workflow', 'Select a skill to start a workflow', 'info', vscode.TreeItemCollapsibleState.None)
                ]);
            }
            const items = [
                new WorkflowItem(`Active: ${this.activeSkill}`, 'Current workflow', 'active', vscode.TreeItemCollapsibleState.Expanded)
            ];
            items.push(...this.workflowSteps.map(step => new WorkflowItem(step.name, step.details || '', step.status, vscode.TreeItemCollapsibleState.None)));
            return Promise.resolve(items);
        }
        return Promise.resolve([]);
    }
    /**
     * Disposes the provider and its event emitter.
     */
    dispose() {
        this._onDidChangeTreeData.dispose();
    }
}
exports.WorkflowProvider = WorkflowProvider;
/**
 * Tree item representing a workflow step.
 */
class WorkflowItem extends vscode.TreeItem {
    /**
     * Creates a new WorkflowItem.
     * @param label - Display label
     * @param description - Item description (removed redundant assignment)
     * @param status - Step status
     * @param collapsibleState - Collapsible state
     */
    constructor(label, description, status, collapsibleState) {
        super(label, collapsibleState);
        this.label = label;
        this.status = status;
        this.collapsibleState = collapsibleState;
        // Use description directly without reassignment (readonly parameter)
        this.tooltip = description;
        // Map status to appropriate icons
        const iconMap = {
            'pending': 'circle-outline',
            'active': 'sync~spin',
            'completed': 'check',
            'failed': 'error',
            'info': 'info'
        };
        this.iconPath = new vscode.ThemeIcon(iconMap[status] || 'circle');
    }
}
//# sourceMappingURL=workflowProvider.js.map