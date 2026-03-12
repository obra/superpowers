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
/** Module-level state for extension components */
let skillsProvider;
let workflowProvider;
let analyticsClient;
let skillsManager;
let skillSuggester;
/**
 * Escape HTML entities to prevent XSS attacks.
 * @param unsafe - Raw string that may contain HTML special characters
 * @returns Sanitized string safe for HTML interpolation
 */
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
/**
 * Activates the Superpowers extension.
 * Initializes all components, registers providers and commands,
 * and sets up the status bar item.
 * @param context - VS Code extension context for subscriptions
 */
async function activate(context) {
    console.log('Superpowers extension is activating...');
    try {
        // Initialize core components
        const config = vscode.workspace.getConfiguration('superpowers');
        analyticsClient = new client_1.AnalyticsClient(config.get('analyticsEnabled', true), config.get('analyticsPort', 3334));
        skillsManager = new manager_1.SkillsManager(config.get('skillsPath', ''));
        await skillsManager.initialize();
        // Initialize singleton suggester (avoid repeated instantiation)
        skillSuggester = new suggester_1.SkillSuggester(skillsManager);
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
        documentSelectors.forEach((selector) => {
            context.subscriptions.push(vscode.languages.registerCodeActionsProvider(selector, new codeActionProvider_1.SkillsCodeActionProvider(skillsManager, skillSuggester), { providedCodeActionKinds: codeActionProvider_1.SkillsCodeActionProvider.providedCodeActionKinds }));
        });
        // Register hover provider for skill hints
        if (config.get('showInlineHints', true)) {
            context.subscriptions.push(vscode.languages.registerHoverProvider(documentSelectors, new hoverProvider_1.HoverProvider(skillsManager, skillSuggester)));
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
    catch (error) {
        console.error('Failed to activate Superpowers extension:', error);
        vscode.window.showErrorMessage(`Failed to activate Superpowers: ${error}`);
    }
}
/**
 * Registers all extension commands with VS Code.
 * @param context - Extension context for managing subscriptions
 */
function registerCommands(context) {
    // Show Skills Command - accepts optional skill name argument
    context.subscriptions.push(vscode.commands.registerCommand('superpowers.showSkills', async (arg) => {
        try {
            // If argument provided, try to resolve to a skill
            if (arg) {
                let skill;
                if (typeof arg === 'string') {
                    // Direct skill name passed
                    skill = skillsManager.getSkill(arg);
                }
                else if (arg && typeof arg === 'object' && 'skill' in arg) {
                    // SkillItem passed
                    skill = arg.skill;
                }
                if (skill) {
                    await showSkillDetails(skill, context);
                    await analyticsClient.trackEvent('skill_viewed', {
                        skill: skill.name,
                        source: 'direct'
                    });
                    return;
                }
            }
            // No argument or not found - show picker
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
                await showSkillDetails(selected.skill, context);
            }
            await analyticsClient.trackEvent('skill_viewed', {
                skills_count: skills.length
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to show skills: ${error}`);
        }
    }));
    // Suggest Skill Command
    context.subscriptions.push(vscode.commands.registerCommand('superpowers.suggestSkill', async () => {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No active editor');
                return;
            }
            const suggestions = await skillSuggester.suggestForContext(editor.document.getText(), editor.document.languageId);
            if (suggestions.length === 0) {
                vscode.window.showInformationMessage('No specific skill suggestions for current context. Try browsing all skills.');
                return;
            }
            const items = suggestions.map(s => ({
                label: s.skillName,
                description: s.reason,
                skillName: s.skillName
            }));
            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Suggested skills for current file'
            });
            if (selected) {
                const skill = skillsManager.getSkill(selected.skillName);
                if (skill) {
                    await showSkillDetails(skill, context);
                }
            }
            await analyticsClient.trackEvent('skill_suggested', {
                suggestions_count: suggestions.length,
                language: editor.document.languageId
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to suggest skills: ${error}`);
        }
    }));
    // Start Brainstorm Command
    context.subscriptions.push(vscode.commands.registerCommand('superpowers.startBrainstorm', async () => {
        try {
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
                const execContext = { input, source: 'vscode' };
                await executeSkill(skill, execContext);
            }
            await analyticsClient.trackEvent('skill_executed', {
                skill: 'brainstorming',
                source: 'command'
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to start brainstorming: ${error}`);
        }
    }));
    // Run Debug Command
    context.subscriptions.push(vscode.commands.registerCommand('superpowers.runDebug', async () => {
        try {
            const skill = skillsManager.getSkill('systematic-debugging');
            if (!skill) {
                vscode.window.showErrorMessage('Systematic debugging skill not found.');
                return;
            }
            const editor = vscode.window.activeTextEditor;
            const execContext = {};
            if (editor?.selection && !editor.selection.isEmpty) {
                execContext.selectedCode = editor.document.getText(editor.selection);
                execContext.file = editor.document.fileName;
            }
            await executeSkill(skill, execContext);
            await analyticsClient.trackEvent('skill_executed', {
                skill: 'systematic-debugging',
                source: 'command'
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to run debugging: ${error}`);
        }
    }));
    // Run TDD Command
    context.subscriptions.push(vscode.commands.registerCommand('superpowers.runTDD', async () => {
        try {
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
            const execContext = {
                file: editor.document.fileName,
                language: editor.document.languageId
            };
            await executeSkill(skill, execContext);
            await analyticsClient.trackEvent('skill_executed', {
                skill: 'test-driven-development',
                source: 'command'
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to run TDD: ${error}`);
        }
    }));
    // Open Analytics Command
    context.subscriptions.push(vscode.commands.registerCommand('superpowers.openAnalytics', async () => {
        try {
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
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to open analytics: ${error}`);
        }
    }));
    // Tree View Commands
    context.subscriptions.push(vscode.commands.registerCommand('superpowers.refreshSkills', () => {
        skillsProvider.refresh();
    }));
    // Open Skill File - accepts both Skill and SkillItem
    context.subscriptions.push(vscode.commands.registerCommand('superpowers.openSkillFile', async (item) => {
        try {
            // Handle both Skill and SkillItem types
            let skillPath;
            let isBuiltIn = false;
            if ('path' in item && item.path) {
                // Direct Skill object
                skillPath = item.path;
                isBuiltIn = item.path === 'built-in';
            }
            else if ('skill' in item && item.skill?.path) {
                // SkillItem with nested skill
                skillPath = item.skill.path;
                isBuiltIn = item.skill.path === 'built-in';
            }
            if (isBuiltIn || !skillPath) {
                vscode.window.showInformationMessage('This is a built-in skill. Install the full Superpowers package for skill files.');
                return;
            }
            const document = await vscode.workspace.openTextDocument(skillPath);
            await vscode.window.showTextDocument(document);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to open skill file: ${error}`);
        }
    }));
}
/**
 * Displays a skill's details in a webview panel.
 * @param skill - The skill to display
 * @param context - Extension context for managing subscriptions
 */
async function showSkillDetails(skill, context) {
    const panel = vscode.window.createWebviewPanel('skillDetails', skill.name, vscode.ViewColumn.Beside, {
        enableScripts: true,
        retainContextWhenHidden: true
    });
    panel.skill = skill;
    panel.webview.html = getSkillWebviewContent(skill);
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(async (message) => {
        if (message.command === 'execute') {
            const skillToExecute = skillsManager.getSkill(message.skill);
            if (skillToExecute) {
                await executeSkill(skillToExecute, { source: 'webview' });
            }
        }
    }, undefined, context.subscriptions);
}
/**
 * Executes a skill with progress tracking and cleanup.
 * Uses try/finally to ensure workflowProvider.clearActiveSkill() is always called.
 * @param skill - The skill to execute
 * @param execContext - Context for skill execution
 */
async function executeSkill(skill, execContext = {}) {
    workflowProvider.setActiveSkill(skill.name);
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Executing ${skill.name}...`,
        cancellable: true
    }, async (progress, token) => {
        progress.report({ message: 'Loading skill instructions' });
        try {
            // Check for cancellation
            if (token.isCancellationRequested) {
                return;
            }
            // In a real implementation, this would integrate with Claude Code
            // or send commands to the AI coding agent
            const action = await vscode.window.showInformationMessage(`${skill.name} skill loaded. In a full implementation, this would guide you through the skill workflow.`, 'Open Skill File', 'View Instructions');
            if (token.isCancellationRequested) {
                return;
            }
            if (action === 'Open Skill File' && skill.path && skill.path !== 'built-in') {
                const document = await vscode.workspace.openTextDocument(skill.path);
                await vscode.window.showTextDocument(document);
            }
        }
        finally {
            // Always clear active skill, even on exception or cancellation
            workflowProvider.clearActiveSkill();
        }
    });
}
/**
 * Generates the HTML content for a skill webview panel.
 * All user-provided content is escaped to prevent XSS.
 * @param skill - The skill to render
 * @returns Escaped HTML string for the webview
 */
function getSkillWebviewContent(skill) {
    // Escape all user-provided content to prevent XSS
    const safeName = escapeHtml(skill.name);
    const safeDescription = escapeHtml(skill.description || 'No description available');
    const safePath = escapeHtml(skill.path || 'N/A');
    const safeContent = skill.content
        ? escapeHtml(skill.content)
        : '<p>Open the skill file to see detailed instructions.</p>';
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
    <title>${safeName}</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            max-width: 800px;
            line-height: 1.6;
            color: var(--vscode-foreground);
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
            font-size: 1rem;
        }
        .execute-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .execute-btn:focus {
            outline: 2px solid var(--vscode-focusBorder);
        }
    </style>
</head>
<body>
    <h1>${safeName}</h1>
    <div class="description">${safeDescription}</div>
    <div class="meta">
        <span>Path: <code>${safePath}</code></span>
    </div>
    <h2>Instructions</h2>
    <div>${safeContent}</div>
    <button class="execute-btn" onclick="executeSkill()">Execute This Skill</button>
    <script>
        const vscode = acquireVsCodeApi();
        function executeSkill() {
            vscode.postMessage({ command: 'execute', skill: '${safeName}' });
        }
    </script>
</body>
</html>`;
}
/**
 * Deactivates the extension and disposes all resources.
 * Ensures analytics client flushes before disposal.
 */
async function deactivate() {
    console.log('Superpowers extension deactivated');
    // Await analytics client disposal to ensure final flush
    if (analyticsClient) {
        await analyticsClient.dispose();
    }
    // Dispose other resources
    if (workflowProvider) {
        workflowProvider.dispose();
    }
    if (skillsManager) {
        skillsManager.dispose();
    }
}
//# sourceMappingURL=extension.js.map