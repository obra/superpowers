/**
 * Hover Provider for Skill Hints
 * Shows skill suggestions on hover over relevant code patterns
 */

import * as vscode from 'vscode';
import { SkillsManager } from '../skills/manager';
import { SkillSuggester } from '../skills/suggester';

export class HoverProvider implements vscode.HoverProvider {
    constructor(
        private skillsManager: SkillsManager,
        private suggester: SkillSuggester
    ) {}

    /**
     * Provides hover information for skill suggestions.
     * @param document - The active text document
     * @param position - The cursor position
     * @param token - Cancellation token
     * @returns A Hover with skill suggestions, or undefined
     */
    async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | undefined> {
        // Check for cancellation early
        if (token.isCancellationRequested) {
            return undefined;
        }

        const range = document.getWordRangeAtPosition(position);
        if (!range) {
            return undefined;
        }

        const word = document.getText(range);
        const line = document.lineAt(position.line).text;

        // Get surrounding context (5 lines before and after)
        const contextRange = new vscode.Range(
            new vscode.Position(Math.max(0, position.line - 5), 0),
            new vscode.Position(Math.min(document.lineCount - 1, position.line + 5), 999)
        );
        const context = document.getText(contextRange);

        // Check cancellation before expensive operation
        if (token.isCancellationRequested) {
            return undefined;
        }

        // Get suggestions based on context
        const suggestions = await this.suggester.suggestForContext(
            context,
            document.languageId
        );

        if (suggestions.length === 0) {
            return undefined;
        }

        // Check cancellation after async operation
        if (token.isCancellationRequested) {
            return undefined;
        }

        // Filter to relevant suggestions for this hover
        const relevantSuggestions = suggestions.filter(s => {
            const skill = this.skillsManager.getSkill(s.skillName);
            if (!skill?.triggers) {
                return false;
            }
            return skill.triggers.some(t =>
                line.toLowerCase().includes(t.toLowerCase()) ||
                word.toLowerCase() === t.toLowerCase()
            );
        });

        if (relevantSuggestions.length === 0) {
            return undefined;
        }

        const markdown = new vscode.MarkdownString();
        // Only trust specific command, not all commands
        markdown.isTrusted = { enabledCommands: ['superpowers.showSkills'] };
        markdown.supportHtml = false;

        markdown.appendMarkdown('**⚡ Superpowers Skills**\n\n');

        for (const suggestion of relevantSuggestions.slice(0, 3)) {
            const skill = this.skillsManager.getSkill(suggestion.skillName);
            if (skill) {
                // Escape skill name for safe display (use appendText for user content)
                markdown.appendText(`• ${skill.name}`);
                markdown.appendMarkdown(' ');
                // Build safe command URI with encoded argument
                const encodedArg = encodeURIComponent(JSON.stringify([skill.name]));
                markdown.appendMarkdown(`[View Details](command:superpowers.showSkills?${encodedArg})`);
                markdown.appendMarkdown('\n');
                // Use appendText for reason to prevent markdown interpretation
                markdown.appendText(`  ${suggestion.reason}\n`);
            }
        }

        markdown.appendMarkdown('\n---\n');
        markdown.appendMarkdown(
            '[View All Skills](command:superpowers.showSkills)'
        );

        return new vscode.Hover(markdown, range);
    }
}
