"use strict";
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
class WorkflowProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.activeSkill = null;
        this.workflowSteps = [];
    }
    refresh() { this._onDidChangeTreeData.fire(); }
    setActiveSkill(skillName) {
        this.activeSkill = skillName;
        this.workflowSteps = [
            { name: 'Initialize', status: 'active' },
            { name: 'Load Instructions', status: 'pending' },
            { name: 'Execute', status: 'pending' },
            { name: 'Verify', status: 'pending' }
        ];
        this.refresh();
    }
    clearActiveSkill() {
        this.activeSkill = null;
        this.workflowSteps = [];
        this.refresh();
    }
    getTreeItem(element) { return element; }
    getChildren(element) {
        if (!element) {
            if (!this.activeSkill) {
                return Promise.resolve([
                    new WorkflowItem('No Active Workflow', 'Select a skill to start', 'info', vscode.TreeItemCollapsibleState.None)
                ]);
            }
            const items = [
                new WorkflowItem(`Active: ${this.activeSkill}`, '', 'active', vscode.TreeItemCollapsibleState.None)
            ];
            items.push(...this.workflowSteps.map(step => new WorkflowItem(step.name, '', step.status, vscode.TreeItemCollapsibleState.None)));
            return Promise.resolve(items);
        }
        return Promise.resolve([]);
    }
}
exports.WorkflowProvider = WorkflowProvider;
class WorkflowItem extends vscode.TreeItem {
    constructor(label, description, status, collapsibleState) {
        super(label, collapsibleState);
        this.label = label;
        this.description = description;
        this.status = status;
        this.collapsibleState = collapsibleState;
        this.description = description;
        const icons = {
            'pending': 'circle-outline',
            'active': 'sync~spin',
            'completed': 'check',
            'failed': 'error',
            'info': 'info'
        };
        this.iconPath = new vscode.ThemeIcon(icons[status] || 'circle');
    }
}
//# sourceMappingURL=workflowProvider.js.map