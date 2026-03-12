"use strict";
/**
 * Hover Provider for Skill Hints
 * Shows skill suggestions on hover over relevant code patterns
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
exports.HoverProvider = void 0;
const vscode = __importStar(require("vscode"));
const suggester_1 = require("../skills/suggester");
class HoverProvider {
    constructor(skillsManager) {
        this.skillsManager = skillsManager;
        this.suggester = new suggester_1.SkillSuggester(skillsManager);
    }
    async provideHover(document, position, token) {
        const range = document.getWordRangeAtPosition(position);
        if (!range)
            return undefined;
        const word = document.getText(range);
        const line = document.lineAt(position.line).text;
        const contextRange = new vscode.Range(new vscode.Position(Math.max(0, position.line - 5), 0), new vscode.Position(Math.min(document.lineCount - 1, position.line + 5), 999));
        const context = document.getText(contextRange);
        // Check for skill-triggering patterns
        const suggestions = await this.suggester.suggestForContext(context, document.languageId);
        if (suggestions.length === 0)
            return undefined;
        // Filter to relevant suggestions for this hover
        const relevantSuggestions = suggestions.filter(s => {
            const skill = this.skillsManager.getSkill(s.skillName);
            if (!skill?.triggers)
                return false;
            return skill.triggers.some(t => line.toLowerCase().includes(t.toLowerCase()) ||
                word.toLowerCase() === t.toLowerCase());
        });
        if (relevantSuggestions.length === 0)
            return undefined;
        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;
        markdown.supportHtml = true;
        markdown.appendMarkdown('**⚡ Superpowers Skills**\n\n');
        for (const suggestion of relevantSuggestions.slice(0, 3)) {
            const skill = this.skillsManager.getSkill(suggestion.skillName);
            if (skill) {
                markdown.appendMarkdown(`- [${skill.name}](command:superpowers.showSkills "${skill.description}")\n`);
                markdown.appendMarkdown(`  _${suggestion.reason}_\n`);
            }
        }
        markdown.appendMarkdown('\n---\n');
        markdown.appendMarkdown('[View All Skills](command:superpowers.showSkills)');
        return new vscode.Hover(markdown, range);
    }
}
exports.HoverProvider = HoverProvider;
//# sourceMappingURL=hoverProvider.js.map