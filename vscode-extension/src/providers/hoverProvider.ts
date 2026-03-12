/**
 * Hover Provider for Skill Hints
 * Shows skill suggestions on hover over relevant code patterns
 */

import * as vscode from 'vscode';
import { SkillsManager } from '../skills/manager';
import { SkillSuggester } from '../skills/suggester';

export class HoverProvider implements vscode.HoverProvider {
    private suggester: SkillSuggester;

    constructor(private skillsManager: SkillsManager) {
        this.suggester = new SkillSuggester(skillsManager);
    }

    async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | undefined> {
        const range = document.getWordRangeAtPosition(position);
        if (!range) return undefined;

        const word = document.getText(range);
        const line = document.lineAt(position.line).text;
        const contextRange = new vscode.Range(
            new vscode.Position(Math.max(0, position.line - 5), 0),
            new vscode.Position(Math.min(document.lineCount - 1, position.line + 5), 999)
        );
        const context = document.getText(contextRange);

        // Check for skill-triggering patterns
        const suggestions = await this.suggester.suggestForContext(
            context,
            document.languageId
        );

        if (suggestions.length === 0) return undefined;

        // Filter to relevant suggestions for this hover
        const relevantSuggestions = suggestions.filter(s => {
            const skill = this.skillsManager.getSkill(s.skillName);
            if (!skill?.triggers) return false;
            return skill.triggers.some(t => 
                line.toLowerCase().includes(t.toLowerCase()) ||
                word.toLowerCase() === t.toLowerCase()
            );
        });

        if (relevantSuggestions.length === 0) return undefined;

        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;
        markdown.supportHtml = true;

        markdown.appendMarkdown('**⚡ Superpowers Skills**\n\n');
        
        for (const suggestion of relevantSuggestions.slice(0, 3)) {
            const skill = this.skillsManager.getSkill(suggestion.skillName);
            if (skill) {
                markdown.appendMarkdown(
                    `- [${skill.name}](command:superpowers.showSkills "${skill.description}")\n`
                );
                markdown.appendMarkdown(`  _${suggestion.reason}_\n`);
            }
        }

        markdown.appendMarkdown('\n---\n');
        markdown.appendMarkdown(
            '[View All Skills](command:superpowers.showSkills)'
        );

        return new vscode.Hover(markdown, range);
    }
}
