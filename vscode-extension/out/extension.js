"use strict";
/**
 * Superpowers VS Code Extension
 *
 * Main entry point for the extension.
 * Integrates Superpowers skills into VS Code with:
 * - Skill suggestions via Code Actions
 * - Plan visualization in Tree View
 * - Workflow tracking and status
 * - Quick access to skill documentation
 *
 * @author Superpowers Contributors
 * @license MIT
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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const skillsProvider_1 = require("./providers/skillsProvider");
const workflowProvider_1 = require("./providers/workflowProvider");
const codeActionProvider_1 = require("./providers/codeActionProvider");
const client_1 = require("./analytics/client");
const manager_1 = require("./skills/manager");
const suggester_1 = require("./skills/suggester");
const hoverProvider_1 = require("./providers/hoverProvider");
let skillsProvider;
let workflowProvider;
let analyticsClient;
let skillsManager;
async function activate(context) {
    console.log('Superpowers extension is activating...');
    // Initialize core components
    const config = vscode.workspace.getConfiguration('superpowers');
    analyticsClient = new client_1.AnalyticsClient(config.get('analyticsEnabled', true), config.get('analyticsPort', 3334));
    skillsManager = new manager_1.SkillsManager(config.get('skillsPath', ''));
    await skillsManager.initialize();
    // Register tree data providers
    skillsProvider = new skillsProvider_1.SkillsProvider(skillsManager);
    workflowProvider = new workflowProvider_1.WorkflowProvider();
    context.subscriptions.push(vscode.window.registerTreeDataProvider('superpowers.skillsView', skillsProvider), vscode.window.registerTreeDataProvider('superpowers.workflowView', workflowProvider));
    // Register code action provider for skill suggestions
    const documentSelectors = [
        { language: 'javascript' },
        { language: 'typescript' },
        { language: 'python' },
        { language: 'go' },
        { language: 'rust' }
    ];
    documentSelectors.forEach(selector => {
        context.subscriptions.push(vscode.languages.registerCodeActionsProvider(selector, new codeActionProvider_1.SkillsCodeActionProvider(skillsManager), { providedCodeActionKinds: codeActionProvider_1.SkillsCodeActionProvider.providedCodeActionKinds }));
    });
    // Register hover provider for skill hints
    if (config.get('showInlineHints', true)) {
        context.subscriptions.push(vscode.languages.registerHoverProvider(documentSelectors, new hoverProvider_1.HoverProvider(skillsManager)));
    }
    // Register commands
    registerCommands(context);
    // Register status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = '$(zap) Superpowers';
    statusBarItem.tooltip = 'Click to view available skills';
    statusBarItem.command = 'superpowers.showSkills';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    // Track activation
    await analyticsClient.trackEvent('extension_activated', {
        version: context.extension.packageJSON.version,
        platform: process.platform
    });
    console.log('Superpowers extension activated successfully!');
}
function registerCommands(context) {
    // Show Skills Command
    context.subscriptions.push(vscode.commands.registerCommand('superpowers.showSkills', async () => {
        const skills = skillsManager.getAllSkills();
        const items = skills.map(skill => ({
            label: skill.name,
            description: skill.description,
            detail: skill.path,
            skill: skill
        }));
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a skill to view or execute',
            matchOnDescription: true,
            matchOnDetail: true
        });
        if (selected) {
            await showSkillDetails(selected.skill);
        }
        await analyticsClient.trackEvent('skill_viewed', {
            skills_count: skills.length
        });
    }));
    // Suggest Skill Command
    context.subscriptions.push(vscode.commands.registerCommand('superpowers.suggestSkill', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return;
        }
        const suggester = new suggester_1.SkillSuggester(skillsManager);
        const suggestions = await suggester.suggestForContext(editor.document.getText(), editor.document.languageId);
        if (suggestions.length === 0) {
            vscode.window.showInformationMessage('No specific skill suggestions for current context. Try browsing all skills.');
            return;
        }
        const items = suggestions.map(s => ({
            label: s.skillName,
            description: s.reason,
            skill: s
        }));
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Suggested skills for current file'
        });
        if (selected) {
            const skill = skillsManager.getSkill(selected.skill.skillName);
            if (skill) {
                await showSkillDetails(skill);
            }
        }
        await analyticsClient.trackEvent('skill_suggested', {
            suggestions_count: suggestions.length,
            language: editor.document.languageId
        });
    }));
    // Start Brainstorm Command
    context.subscriptions.push(vscode.commands.registerCommand('superpowers.startBrainstorm', async () => {
        const skill = skillsManager.getSkill('brainstorming');
        if (!skill) {
            vscode.window.showErrorMessage('Brainstorming skill not found. Check skill installation.');
            return;
        }
        const input = await vscode.window.showInputBox({
            prompt: 'What would you like to brainstorm?',
            placeHolder: 'Describe your feature or problem...'
        });
        if (input) {
            await executeSkill(skill, { input, context: 'vscode' });
        }
        await analyticsClient.trackEvent('skill_executed', {
            skill: 'brainstorming',
            source: 'command'
        });
    }));
    // Run Debug Command
    context.subscriptions.push(vscode.commands.registerCommand('superpowers.runDebug', async () => {
        const skill = skillsManager.getSkill('systematic-debugging');
        if (!skill) {
            vscode.window.showErrorMessage('Systematic debugging skill not found.');
            return;
        }
        const editor = vscode.window.activeTextEditor;
        const selection = editor?.selection;
        const context = {};
        if (selection && !selection.isEmpty) {
            context.selectedCode = editor?.document.getText(selection);
            context.file = editor?.document.fileName;
        }
        await executeSkill(skill, context);
        await analyticsClient.trackEvent('skill_executed', {
            skill: 'systematic-debugging',
            source: 'command'
        });
    }));
    // Run TDD Command
    context.subscriptions.push(vscode.commands.registerCommand('superpowers.runTDD', async () => {
        const skill = skillsManager.getSkill('test-driven-development');
        if (!skill) {
            vscode.window.showErrorMessage('TDD skill not found.');
            return;
        }
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('Open a file to use TDD workflow');
            return;
        }
        await executeSkill(skill, {
            file: editor.document.fileName,
            language: editor.document.languageId
        });
        await analyticsClient.trackEvent('skill_executed', {
            skill: 'test-driven-development',
            source: 'command'
        });
    }));
    // Open Analytics Command
    context.subscriptions.push(vscode.commands.registerCommand('superpowers.openAnalytics', async () => {
        const port = vscode.workspace.getConfiguration('superpowers')
            .get('analyticsPort', 3334);
        const url = `http://localhost:${port}`;
        const action = await vscode.window.showInformationMessage(`Analytics dashboard runs at ${url}`, 'Open in Browser', 'Copy URL');
        if (action === 'Open in Browser') {
            vscode.env.openExternal(vscode.Uri.parse(url));
        }
        else if (action === 'Copy URL') {
            vscode.env.clipboard.writeText(url);
            vscode.window.showInformationMessage('URL copied to clipboard');
        }
    }));
    // Tree View Commands
    context.subscriptions.push(vscode.commands.registerCommand('superpowers.refreshSkills', () => {
        skillsProvider.refresh();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('superpowers.openSkillFile', async (item) => {
        if (item.skill?.path) {
            const document = await vscode.workspace.openTextDocument(item.skill.path);
            await vscode.window.showTextDocument(document);
        }
    }));
}
async function showSkillDetails(skill) {
    const panel = vscode.window.createWebviewPanel('skillDetails', skill.name, vscode.ViewColumn.Beside, { enableScripts: true });
    panel.webview.html = getSkillWebviewContent(skill);
}
async function executeSkill(skill, context = {}) {
    workflowProvider.setActiveSkill(skill.name);
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Executing ${skill.name}...`,
        cancellable: true
    }, async (progress, token) => {
        progress.report({ message: 'Loading skill instructions' });
        // In a real implementation, this would integrate with Claude Code
        // or send commands to the AI coding agent
        const action = await vscode.window.showInformationMessage(`${skill.name} skill loaded. In a full implementation, this would guide you through the skill workflow.`, 'Open Skill File', 'View Instructions');
        if (action === 'Open Skill File' && skill.path) {
            const document = await vscode.workspace.openTextDocument(skill.path);
            await vscode.window.showTextDocument(document);
        }
        workflowProvider.clearActiveSkill();
        return;
    });
}
function getSkillWebviewContent(skill) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${skill.name}</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            max-width: 800px;
            line-height: 1.6;
        }
        h1 { color: var(--vscode-titleBar-activeForeground); }
        h2 { 
            color: var(--vscode-sideBarTitle-foreground);
            margin-top: 1.5rem;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 0.5rem;
        }
        pre {
            background: var(--vscode-textCodeBlock-background);
            padding: 1rem;
            border-radius: 4px;
            overflow-x: auto;
        }
        code {
            font-family: var(--vscode-editor-font-family);
        }
        .description {
            color: var(--vscode-descriptionForeground);
            font-size: 1.1rem;
            margin-bottom: 1rem;
        }
        .meta {
            display: flex;
            gap: 1rem;
            color: var(--vscode-descriptionForeground);
            font-size: 0.9rem;
        }
        .execute-btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 1rem;
        }
        .execute-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
    </style>
</head>
<body>
    <h1>${skill.name}</h1>
    <div class="description">${skill.description || 'No description available'}</div>
    <div class="meta">
        <span>Path: <code>${skill.path || 'N/A'}</code></span>
    </div>
    <h2>Instructions</h2>
    <div>${skill.content || '<p>Open the skill file to see detailed instructions.</p>'}</div>
    <button class="execute-btn" onclick="executeSkill()">Execute This Skill</button>
    <script>
        const vscode = acquireVsCodeApi();
        function executeSkill() {
            vscode.postMessage({ command: 'execute', skill: '${skill.name}' });
        }
    </script>
</body>
</html>`;
}
function deactivate() {
    console.log('Superpowers extension deactivated');
    analyticsClient?.dispose();
}
//# sourceMappingURL=extension.js.map