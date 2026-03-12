import * as vscode from 'vscode';
import { SkillsManager } from '../skills/manager';
import { SkillSuggester } from '../skills/suggester';

export class SkillsCodeActionProvider implements vscode.CodeActionProvider {
    static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix,
        vscode.CodeActionKind.Refactor
    ];

    constructor(
        private skillsManager: SkillsManager,
        private suggester: SkillSuggester
    ) {}

    async provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        _context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.CodeAction[]> {
        if (token.isCancellationRequested) return [];

        const code = document.getText(range);
        const fullCode = document.getText();
        const suggestions = await this.suggester.suggestForContext(code || fullCode, document.languageId);

        if (token.isCancellationRequested) return [];

        const actions: vscode.CodeAction[] = [];

        for (const suggestion of suggestions.slice(0, 5)) {
            const action = new vscode.CodeAction(
                `⚡ ${suggestion.skillName}: ${suggestion.reason}`,
                vscode.CodeActionKind.QuickFix
            );
            action.command = {
                command: 'superpowers.showSkills',
                title: 'Show Skill',
                arguments: [suggestion.skillName]
            };
            actions.push(action);
        }

        const browseAction = new vscode.CodeAction('🔍 Browse All Skills', vscode.CodeActionKind.QuickFix);
        browseAction.command = { command: 'superpowers.showSkills', title: 'Browse Skills' };
        actions.push(browseAction);

        return actions;
    }
}