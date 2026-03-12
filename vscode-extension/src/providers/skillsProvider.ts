import * as vscode from 'vscode';
import { SkillsManager, Skill } from '../skills/manager';

export class SkillsProvider implements vscode.TreeDataProvider<SkillItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<SkillItem | undefined | null | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(private skillsManager: SkillsManager) {}

    refresh(): void { this._onDidChangeTreeData.fire(); }

    getTreeItem(element: SkillItem): vscode.TreeItem { return element; }

    getChildren(element?: SkillItem): Thenable<SkillItem[]> {
        if (!element) {
            const categories = this.skillsManager.getCategories();
            return Promise.resolve(
                categories.map(cat => new SkillItem(
                    cat.name,
                    `${cat.count} skills`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    undefined,
                    cat.name
                ))
            );
        } else if (element.category) {
            const skills = this.skillsManager.getSkillsByCategory(element.category);
            return Promise.resolve(
                skills.map(skill => new SkillItem(
                    skill.name,
                    skill.description || '',
                    vscode.TreeItemCollapsibleState.None,
                    skill,
                    undefined,
                    { command: 'superpowers.openSkillFile', title: 'Open', arguments: [skill] }
                ))
            );
        }
        return Promise.resolve([]);
    }
}

export class SkillItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly description: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly skill?: Skill,
        public readonly category?: string,
        command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.description = description;
        this.command = command;

        if (skill) {
            this.tooltip = skill.description || skill.name;
            this.contextValue = 'skill';
            this.iconPath = new vscode.ThemeIcon('zap');
        } else if (category) {
            this.iconPath = new vscode.ThemeIcon('folder');
            this.contextValue = 'category';
        }
    }
}