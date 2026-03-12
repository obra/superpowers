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

import * as vscode from 'vscode';
import { SkillsProvider, SkillItem } from './providers/skillsProvider';
import { WorkflowProvider } from './providers/workflowProvider';
import { SkillsCodeActionProvider } from './providers/codeActionProvider';
import { AnalyticsClient } from './analytics/client';
import { SkillsManager, Skill } from './skills/manager';
import { SkillSuggester } from './skills/suggester';
import { HoverProvider } from './providers/hoverProvider';

// Type definitions for better type safety
interface SkillExecutionContext {
    input?: string;
    file?: string;
    language?: string;
    selectedCode?: string;
    source?: string;
}

interface SkillPanel extends vscode.WebviewPanel {
    skill?: Skill;
}

// Module-level state
let skillsProvider: SkillsProvider;
let workflowProvider: WorkflowProvider;
let analyticsClient: AnalyticsClient;
let skillsManager: SkillsManager;
let skillSuggester: SkillSuggester;

/**
 * Escape HTML entities to prevent XSS attacks
 */
function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    console.log('Superpowers extension is activating...');

    try {
        // Initialize core components
        const config = vscode.workspace.getConfiguration('superpowers');
        analyticsClient = new AnalyticsClient(
            config.get('analyticsEnabled', true),
            config.get('analyticsPort', 3334)
        );
        
        skillsManager = new SkillsManager(config.get('skillsPath', ''));
        await skillsManager.initialize();

        // Initialize singleton suggester (avoid repeated instantiation)
        skillSuggester = new SkillSuggester(skillsManager);

        // Register tree data providers
        skillsProvider = new SkillsProvider(skillsManager);
        workflowProvider = new WorkflowProvider();

        context.subscriptions.push(
            vscode.window.registerTreeDataProvider('superpowers.skillsView', skillsProvider),
            vscode.window.registerTreeDataProvider('superpowers.workflowView', workflowProvider)
        );

        // Register code action provider for skill suggestions
        const documentSelectors: vscode.DocumentSelector = [
            { language: 'javascript' },
            { language: 'typescript' },
            { language: 'python' },
            { language: 'go' },
            { language: 'rust' }
        ];

        documentSelectors.forEach((selector: vscode.DocumentSelector) => {
            context.subscriptions.push(
                vscode.languages.registerCodeActionsProvider(
                    selector,
                    new SkillsCodeActionProvider(skillsManager, skillSuggester),
                    { providedCodeActionKinds: SkillsCodeActionProvider.providedCodeActionKinds }
                )
            );
        });

        // Register hover provider for skill hints
        if (config.get('showInlineHints', true)) {
            context.subscriptions.push(
                vscode.languages.registerHoverProvider(
                    documentSelectors,
                    new HoverProvider(skillsManager, skillSuggester)
                )
            );
        }

        // Register commands
        registerCommands(context);

        // Register status bar item
        const statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
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
    } catch (error) {
        console.error('Failed to activate Superpowers extension:', error);
        vscode.window.showErrorMessage(`Failed to activate Superpowers: ${error}`);
    }
}

function registerCommands(context: vscode.ExtensionContext): void {
    // Show Skills Command
    context.subscriptions.push(
        vscode.commands.registerCommand('superpowers.showSkills', async () => {
            try {
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
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to show skills: ${error}`);
            }
        })
    );

    // Suggest Skill Command
    context.subscriptions.push(
        vscode.commands.registerCommand('superpowers.suggestSkill', async () => {
            try {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showWarningMessage('No active editor');
                    return;
                }

                const suggestions = await skillSuggester.suggestForContext(
                    editor.document.getText(),
                    editor.document.languageId
                );

                if (suggestions.length === 0) {
                    vscode.window.showInformationMessage(
                        'No specific skill suggestions for current context. Try browsing all skills.'
                    );
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
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to suggest skills: ${error}`);
            }
        })
    );

    // Start Brainstorm Command
    context.subscriptions.push(
        vscode.commands.registerCommand('superpowers.startBrainstorm', async () => {
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
                    const execContext: SkillExecutionContext = { input, source: 'vscode' };
                    await executeSkill(skill, execContext);
                }

                await analyticsClient.trackEvent('skill_executed', {
                    skill: 'brainstorming',
                    source: 'command'
                });
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to start brainstorming: ${error}`);
            }
        })
    );

    // Run Debug Command
    context.subscriptions.push(
        vscode.commands.registerCommand('superpowers.runDebug', async () => {
            try {
                const skill = skillsManager.getSkill('systematic-debugging');
                if (!skill) {
                    vscode.window.showErrorMessage('Systematic debugging skill not found.');
                    return;
                }

                const editor = vscode.window.activeTextEditor;
                const execContext: SkillExecutionContext = {};

                if (editor?.selection && !editor.selection.isEmpty) {
                    execContext.selectedCode = editor.document.getText(editor.selection);
                    execContext.file = editor.document.fileName;
                }

                await executeSkill(skill, execContext);
                await analyticsClient.trackEvent('skill_executed', {
                    skill: 'systematic-debugging',
                    source: 'command'
                });
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to run debugging: ${error}`);
            }
        })
    );

    // Run TDD Command
    context.subscriptions.push(
        vscode.commands.registerCommand('superpowers.runTDD', async () => {
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

                const execContext: SkillExecutionContext = {
                    file: editor.document.fileName,
                    language: editor.document.languageId
                };

                await executeSkill(skill, execContext);

                await analyticsClient.trackEvent('skill_executed', {
                    skill: 'test-driven-development',
                    source: 'command'
                });
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to run TDD: ${error}`);
            }
        })
    );

    // Open Analytics Command
    context.subscriptions.push(
        vscode.commands.registerCommand('superpowers.openAnalytics', async () => {
            try {
                const port = vscode.workspace.getConfiguration('superpowers')
                    .get('analyticsPort', 3334);
                const url = `http://localhost:${port}`;
                
                const action = await vscode.window.showInformationMessage(
                    `Analytics dashboard runs at ${url}`,
                    'Open in Browser',
                    'Copy URL'
                );

                if (action === 'Open in Browser') {
                    vscode.env.openExternal(vscode.Uri.parse(url));
                } else if (action === 'Copy URL') {
                    vscode.env.clipboard.writeText(url);
                    vscode.window.showInformationMessage('URL copied to clipboard');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open analytics: ${error}`);
            }
        })
    );

    // Tree View Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('superpowers.refreshSkills', () => {
            skillsProvider.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('superpowers.openSkillFile', async (item: SkillItem) => {
            try {
                if (item.skill?.path && item.skill.path !== 'built-in') {
                    const document = await vscode.workspace.openTextDocument(item.skill.path);
                    await vscode.window.showTextDocument(document);
                } else {
                    vscode.window.showInformationMessage(
                        'This is a built-in skill. Install the full Superpowers package for skill files.'
                    );
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to open skill file: ${error}`);
            }
        })
    );
}

async function showSkillDetails(skill: Skill, context: vscode.ExtensionContext): Promise<void> {
    const panel: SkillPanel = vscode.window.createWebviewPanel(
        'skillDetails',
        skill.name,
        vscode.ViewColumn.Beside,
        { 
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.skill = skill;
    panel.webview.html = getSkillWebviewContent(skill);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        async (message: { command: string; skill: string }) => {
            if (message.command === 'execute') {
                const skillToExecute = skillsManager.getSkill(message.skill);
                if (skillToExecute) {
                    await executeSkill(skillToExecute, { source: 'webview' });
                }
            }
        },
        undefined,
        context.subscriptions
    );
}

async function executeSkill(skill: Skill, execContext: SkillExecutionContext = {}): Promise<void> {
    workflowProvider.setActiveSkill(skill.name);
    
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Executing ${skill.name}...`,
        cancellable: true
    }, async (progress, token) => {
        progress.report({ message: 'Loading skill instructions' });

        // Check for cancellation
        if (token.isCancellationRequested) {
            workflowProvider.clearActiveSkill();
            return;
        }

        // In a real implementation, this would integrate with Claude Code
        // or send commands to the AI coding agent
        
        const action = await vscode.window.showInformationMessage(
            `${skill.name} skill loaded. In a full implementation, this would guide you through the skill workflow.`,
            'Open Skill File',
            'View Instructions'
        );

        if (token.isCancellationRequested) {
            workflowProvider.clearActiveSkill();
            return;
        }

        if (action === 'Open Skill File' && skill.path && skill.path !== 'built-in') {
            const document = await vscode.workspace.openTextDocument(skill.path);
            await vscode.window.showTextDocument(document);
        }

        workflowProvider.clearActiveSkill();
    });
}

function getSkillWebviewContent(skill: Skill): string {
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

export function deactivate(): void {
    console.log('Superpowers extension deactivated');
    
    // Properly dispose all resources
    analyticsClient?.dispose();
    skillsManager?.dispose();
}
