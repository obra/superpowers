# VS Code Extension and MCP Server Publication Guide

This document outlines how the Superpowers MCP server integrates with VS Code, how users can use it, and how maintainers can publish updates to the Visual Studio Marketplace.

## 1. How the MCP Server Integrates with VS Code

We built this as a **first-class VS Code extension** using the upcoming `vscode.lm` MCP registration API. 

### What happens under the hood
1. When a user installs the `.vsix` file and opens VS Code, our extension activates in the background.
2. The extension uses `vscode.lm.registerMcpServerDefinitionProvider` to tell VS Code: "Hey, I have an MCP Server called 'Superpowers Skills'".
3. VS Code natively launches the `.vscode-extension/dist/server.js` child process over the `stdio` transport.
4. VS Code's **Copilot Agent Mode** (or other compatible agents) automatically discovers our tools (`activate_skill`, `list_skills`), prompts, and resources.

### How a user uses it
For standard users, there is **zero configuration**:
1. Open VS Code Copilot Chat.
2. Ensure you are in "Agent Mode" (typically by using `@workspace` or just asking a broad question that triggers the Copilot plan/build logic).
3. The LLM automatically evaluates if it needs Superpowers workflow skills and will call our MCP server tools behind the scenes when necessary!

### How clients like Cline / Roo Code use it
Users of Cline or Roo Code don't interact with the VS Code `vscode.lm` API. Instead, they use our **Standalone CLI** wrapped in the same package:
1. They add it to their configuration (`cline_mcp.json`):
   ```json
   "superpowers": {
     "command": "npx",
     "args": ["superpowers-mcp"]
   }
   ```
2. `npx` resolves to our `bin/superpowers-mcp.js` script, communicating natively with the CLI package over standard standard inputs and outputs.

---

## 2. Publishing to the VS Code Marketplace

When you are ready to publish the extension to the Visual Studio Marketplace for users to install with one click, follow these steps.

### Step A: Prerequisites
1. **Azure DevOps Account**: You need an Azure DevOps organization (free). Go to [dev.azure.com](https://dev.azure.com/) to create one.
2. **Personal Access Token (PAT)**:
   - In Azure DevOps, click on your profile picture -> **Personal Access Tokens**.
   - Create a new token. Set the scopes to **Marketplace -> Manage**.
3. **VS Code Publisher**: Create a publisher profile on the [VS Code Marketplace Management Page](https://marketplace.visualstudio.com/manage) using your Azure ID.
   - We currently have the publisher named `"obra"` set in `package.json`. If you create a publisher with a different name, make sure you update the `"publisher": "YourName"` field in `.vscode-extension/package.json`.

### Step B: Build and Package
Before you publish, always verify the package builds correctly.
```bash
cd .vscode-extension
npm install
npm run package
```
This runs `vsce package --no-dependencies`, running `esbuild`, bundling the `skills` folder, and wrapping everything perfectly into a `superpowers-mcp-<version>.vsix` file.

### Step C: Log in via VSCE
Install the VSCE (Visual Studio Code Extension) CLI globally if you haven't:
```bash
npm install -g @vscode/vsce
```

Log into your publisher account from the terminal using the PAT you generated:
```bash
vsce login obra
# Paste your Personal Access Token when prompted.
```

### Step D: Publish
Simply run the publish command from inside the `.vscode-extension` directory:
```bash
cd .vscode-extension
vsce publish
```
Wait a few minutes (sometimes up to 10 minutes), and the extension will be publicly available on the marketplace for users to install directly from VS Code by searching for **"Superpowers"**.

### Step E: Maintaining updates
When you want to update the extension:
1. Increase the version across all Superpowers platforms using your root repository bump scripts (which updates `.vscode-extension/package.json` automatically via `.version-bump.json`).
2. Run identical build/publication scripts:
   ```bash
   cd .vscode-extension
   vsce publish
   ```
