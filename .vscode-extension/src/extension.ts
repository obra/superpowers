import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext): void {
  const serverPath = path.join(context.extensionPath, 'dist', 'server.js');
  const skillsDir = path.join(context.extensionPath, 'skills');

  const provider: vscode.McpServerDefinitionProvider = {
    provideMcpServerDefinitions: async () => {
      return [
        new vscode.McpStdioServerDefinition(
          'Superpowers Skills',   // Label shown in MCP server list
          'node',                  // Command
          [serverPath],            // Args
          {                        // Environment variables
            SUPERPOWERS_SKILLS_DIR: skillsDir,
          },
          '5.0.7',                 // Version
        ),
      ];
    },
    resolveMcpServerDefinition: async (server) => {
      // No dynamic resolution needed — return as-is
      return server;
    },
  };

  const disposable = vscode.lm.registerMcpServerDefinitionProvider(
    'superpowers-mcp.provider',
    provider,
  );

  // Command: list skills in output channel
  const listCommand = vscode.commands.registerCommand(
    'superpowers.listSkills',
    () => {
      const channel = vscode.window.createOutputChannel('Superpowers');
      channel.appendLine('Superpowers MCP server is running.');
      channel.appendLine(`Skills directory: ${skillsDir}`);
      channel.appendLine(`Server: ${serverPath}`);
      channel.show();
    },
  );

  context.subscriptions.push(disposable, listCommand);
}

export function deactivate(): void {}
