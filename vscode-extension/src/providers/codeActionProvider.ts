/**
 * Code Action Provider for Skill Suggestions
 * Suggests relevant skills based on code context
 */

import * as vscode from 'vscode';
import { SkillsManager, Skill } from '../skills/manager';
import { SkillSuggester } from '../skills/suggester';

export class SkillsCodeActionProvider implements vscode.CodeActionProvider {
    static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix,
        vscode.CodeActionKind.Refactor
    ];

    private suggester: SkillSuggester;

    constructor(private skillsManager: SkillsManager) {
        this.suggester = new SkillSuggester(skillsManager);
    }

    async provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.CodeAction[]> {
        const actions: vscode.CodeAction[] = [];

        const code = document.getText(range);
        const fullCode = document.getText();
        const language = document.languageId;

        const suggestions = await this.suggester.suggestForContext(code || fullCode, language);

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

        const browseAction = new vscode.CodeAction(
            '🔍 Browse All Skills',
            vscode.CodeActionKind.QuickFix
        );
        browseAction.command = {
            command: 'superpowers.showSkills',
            title: 'Browse Skills'
        };
        actions.push(browseAction);

        return actions;
    }
}