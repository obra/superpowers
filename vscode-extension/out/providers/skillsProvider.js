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
exports.SkillItem = exports.SkillsProvider = void 0;
const vscode = __importStar(require("vscode"));
class SkillsProvider {
    constructor(skillsManager) {
        this.skillsManager = skillsManager;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() { this._onDidChangeTreeData.fire(); }
    getTreeItem(element) { return element; }
    getChildren(element) {
        if (!element) {
            const categories = this.skillsManager.getCategories();
            return Promise.resolve(categories.map(cat => new SkillItem(cat.name, `${cat.count} skills`, vscode.TreeItemCollapsibleState.Collapsed, undefined, cat.name)));
        }
        else if (element.category) {
            const skills = this.skillsManager.getSkillsByCategory(element.category);
            return Promise.resolve(skills.map(skill => new SkillItem(skill.name, skill.description || '', vscode.TreeItemCollapsibleState.None, skill, undefined, { command: 'superpowers.openSkillFile', title: 'Open', arguments: [skill] })));
        }
        return Promise.resolve([]);
    }
}
exports.SkillsProvider = SkillsProvider;
class SkillItem extends vscode.TreeItem {
    constructor(label, description, collapsibleState, skill, category, command) {
        super(label, collapsibleState);
        this.label = label;
        this.description = description;
        this.collapsibleState = collapsibleState;
        this.skill = skill;
        this.category = category;
        this.description = description;
        this.command = command;
        if (skill) {
            this.tooltip = skill.description || skill.name;
            this.contextValue = 'skill';
            this.iconPath = new vscode.ThemeIcon('zap');
        }
        else if (category) {
            this.iconPath = new vscode.ThemeIcon('folder');
            this.contextValue = 'category';
        }
    }
}
exports.SkillItem = SkillItem;
//# sourceMappingURL=skillsProvider.js.map