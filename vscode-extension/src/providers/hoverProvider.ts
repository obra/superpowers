import * as vscode from 'vscode';
import { SkillsManager } from '../skills/manager';
import { SkillSuggester } from '../skills/suggester';

export class HoverProvider implements vscode.HoverProvider {
    constructor(
        private skillsManager: SkillsManager,
        private suggester: SkillSuggester
    ) {}

    async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | undefined> {
        if (token.isCancellationRequested) return undefined;

        const range = document.getWordRangeAtPosition(position);
        if (!range) return undefined;

        const line = document.lineAt(position.line).text;
        const contextRange = new vscode.Range(
            new vscode.Position(Math.max(0, position.line - 5), 0),
            new vscode.Position(Math.min(document.lineCount - 1, position.line + 5), 999)
        );
        const context = document.getText(contextRange);

        if (token.isCancellationRequested) return undefined;

        const suggestions = await this.suggester.suggestForContext(context, document.languageId);
        if (suggestions.length === 0 || token.isCancellationRequested) return undefined;

        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;
        markdown.appendMarkdown('**⚡ Superpowers Skills**\n\n');

        for (const suggestion of suggestions.slice(0, 3)) {
            const skill = this.skillsManager.getSkill(suggestion.skillName);
            if (skill) {
                markdown.appendMarkdown(`- [${skill.name}](command:superpowers.showSkills "${skill.description}")\n`);
                markdown.appendMarkdown(`  _${suggestion.reason}_\n`);
            }
        }

        markdown.appendMarkdown('\n---\n[View All Skills](command:superpowers.showSkills)');

        return new vscode.Hover(markdown, range);
    }
}