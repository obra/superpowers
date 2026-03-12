import * as vscode from 'vscode';
import { SkillsProvider, SkillItem } from './providers/skillsProvider';
import { WorkflowProvider } from './providers/workflowProvider';
import { SkillsCodeActionProvider } from './providers/codeActionProvider';
import { AnalyticsClient } from './analytics/client';
import { SkillsManager, Skill } from './skills/manager';
import { SkillSuggester } from './skills/suggester';
import { HoverProvider } from './providers/hoverProvider';

let skillsProvider: SkillsProvider;
let workflowProvider: WorkflowProvider;
let analyticsClient: AnalyticsClient;
let skillsManager: SkillsManager;
let skillSuggester: SkillSuggester;

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

    const config = vscode.workspace.getConfiguration('superpowers');
    analyticsClient = new AnalyticsClient(
        config.get('analyticsEnabled', true),
        config.get('analyticsPort', 3334)
    );
    
    skillsManager = new SkillsManager(config.get('skillsPath', ''));
    await skillsManager.initialize();

    skillSuggester = new SkillSuggester(skillsManager);

    skillsProvider = new SkillsProvider(skillsManager);
    workflowProvider = new WorkflowProvider();

    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('superpowers.skillsView', skillsProvider),
        vscode.window.registerTreeDataProvider('superpowers.workflowView', workflowProvider)
    );

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

    if (config.get('showInlineHints', true)) {
        context.subscriptions.push(
            vscode.languages.registerHoverProvider(
                documentSelectors,
                new HoverProvider(skillsManager, skillSuggester)
            )
        );
    }

    registerCommands(context);

    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.text = '$(zap) Superpowers';
    statusBarItem.tooltip = 'Click to view available skills';
    statusBarItem.command = 'superpowers.showSkills';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    console.log('Superpowers extension activated successfully!');
}

function registerCommands(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('superpowers.showSkills', async () => {
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
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('superpowers.suggestSkill', async () => {
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
                    'No specific skill suggestions for current context.'
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
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('superpowers.startBrainstorm', async () => {
            const skill = skillsManager.getSkill('brainstorming');
            if (!skill) {
                vscode.window.showErrorMessage('Brainstorming skill not found.');
                return;
            }
            await showSkillDetails(skill, context);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('superpowers.runDebug', async () => {
            const skill = skillsManager.getSkill('systematic-debugging');
            if (!skill) {
                vscode.window.showErrorMessage('Debugging skill not found.');
                return;
            }
            await showSkillDetails(skill, context);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('superpowers.openAnalytics', async () => {
            const port = vscode.workspace.getConfiguration('superpowers')
                .get('analyticsPort', 3334);
            const url = `http://localhost:${port}`;
            vscode.env.openExternal(vscode.Uri.parse(url));
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('superpowers.refreshSkills', () => {
            skillsProvider.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('superpowers.openSkillFile', async (item: SkillItem) => {
            if (item.skill?.path && item.skill.path !== 'built-in') {
                const document = await vscode.workspace.openTextDocument(item.skill.path);
                await vscode.window.showTextDocument(document);
            }
        })
    );
}

async function showSkillDetails(skill: Skill, context: vscode.ExtensionContext): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
        'skillDetails',
        skill.name,
        vscode.ViewColumn.Beside,
        { enableScripts: true }
    );

    panel.webview.html = getSkillWebviewContent(skill);

    panel.webview.onDidReceiveMessage(
        async (message: { command: string; skill: string }) => {
            if (message.command === 'execute') {
                vscode.window.showInformationMessage(`Executing ${message.skill}...`);
            }
        },
        undefined,
        context.subscriptions
    );
}

function getSkillWebviewContent(skill: Skill): string {
    const safeName = escapeHtml(skill.name);
    const safeDescription = escapeHtml(skill.description || 'No description available');
    const safePath = escapeHtml(skill.path || 'N/A');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${safeName}</title>
    <style>
        body { font-family: var(--vscode-font-family); padding: 20px; color: var(--vscode-foreground); }
        h1 { color: var(--vscode-titleBar-activeForeground); }
        .description { color: var(--vscode-descriptionForeground); margin-bottom: 1rem; }
        .execute-btn { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 10px 20px; cursor: pointer; margin-top: 1rem; }
    </style>
</head>
<body>
    <h1>${safeName}</h1>
    <div class="description">${safeDescription}</div>
    <p>Path: <code>${safePath}</code></p>
    <button class="execute-btn" onclick="executeSkill()">Execute This Skill</button>
    <script>
        const vscode = acquireVsCodeApi();
        function executeSkill() { vscode.postMessage({ command: 'execute', skill: '${safeName}' }); }
    </script>
</body>
</html>`;
}

export function deactivate(): void {
    console.log('Superpowers extension deactivated');
    analyticsClient?.dispose();
    skillsManager?.dispose();
}