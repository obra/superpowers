"use strict";
/**
 * Code Action Provider for Skill Suggestions
 * Suggests relevant skills based on code context
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
exports.SkillsCodeActionProvider = void 0;
const vscode = __importStar(require("vscode"));
const suggester_1 = require("../skills/suggester");
class SkillsCodeActionProvider {
    constructor(skillsManager) {
        this.skillsManager = skillsManager;
        this.suggester = new suggester_1.SkillSuggester(skillsManager);
    }
    async provideCodeActions(document, range, context, token) {
        const actions = [];
        const code = document.getText(range);
        const fullCode = document.getText();
        const language = document.languageId;
        const suggestions = await this.suggester.suggestForContext(code || fullCode, language);
        for (const suggestion of suggestions.slice(0, 5)) {
            const action = new vscode.CodeAction(`⚡ ${suggestion.skillName}: ${suggestion.reason}`, vscode.CodeActionKind.QuickFix);
            action.command = {
                command: 'superpowers.showSkills',
                title: 'Show Skill',
                arguments: [suggestion.skillName]
            };
            actions.push(action);
        }
        const browseAction = new vscode.CodeAction('🔍 Browse All Skills', vscode.CodeActionKind.QuickFix);
        browseAction.command = {
            command: 'superpowers.showSkills',
            title: 'Browse Skills'
        };
        actions.push(browseAction);
        return actions;
    }
}
exports.SkillsCodeActionProvider = SkillsCodeActionProvider;
SkillsCodeActionProvider.providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
    vscode.CodeActionKind.Refactor
];
//# sourceMappingURL=codeActionProvider.js.map