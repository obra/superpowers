#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"
MARKETPLACE_REPO="sneverton/nimbou-skills"
PLUGIN_NAME="nimbou-skills"
COPILOT_PLUGIN_SOURCE="$REPO_ROOT/plugins/$PLUGIN_NAME"
CODEX_WRAPPER_SCRIPT="$REPO_ROOT/scripts/setup-codex-full-wrapper.sh"
CHROME_DEVTOOLS_WRAPPER_SCRIPT="$REPO_ROOT/scripts/setup-chrome-devtools-wrapper.sh"
VSCODE_COPILOT_CHAT_SCRIPT="$REPO_ROOT/scripts/setup-vscode-copilot-chat.sh"
CODEX_SKILLS_SCRIPT="$REPO_ROOT/scripts/setup-codex-skills.sh"
PLUGIN_MANIFEST="$REPO_ROOT/plugins/$PLUGIN_NAME/.claude-plugin/plugin.json"
CODEX_MARKETPLACE_DIR="$REPO_ROOT"
CODEX_MARKETPLACE_FILE="$REPO_ROOT/.agents/plugins/marketplace.json"
PLUGIN_ID="$PLUGIN_NAME@$PLUGIN_NAME"
NODE_MIN_MAJOR=20

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

read_plugin_version() {
  node --input-type=module -e '
    import { readFileSync } from "node:fs";

    const manifestPath = process.argv[1];
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    process.stdout.write(`${manifest.version}\n`);
  ' "$PLUGIN_MANIFEST"
}

get_installed_plugin_version() {
  claude plugin list --json | node --input-type=module -e '
    import fs from "node:fs";

    const [pluginId, scope] = process.argv.slice(1);
    const plugins = JSON.parse(fs.readFileSync(0, "utf8"));
    const match = plugins.find((plugin) => plugin.id === pluginId && plugin.scope === scope)
      ?? plugins.find((plugin) => plugin.id === pluginId);

    if (match?.version) {
      process.stdout.write(`${match.version}\n`);
    }
  ' "$PLUGIN_ID" "user"
}

get_installed_copilot_plugin_version() {
  copilot plugin list | node --input-type=module -e '
    import fs from "node:fs";

    const pluginName = process.argv[1];
    const lines = fs.readFileSync(0, "utf8").split(/\r?\n/);
    const pattern = new RegExp(`^\\s*[•-]\\s*${pluginName}(?:@[^ ]+)?\\s+\\(v([^)]*)\\)`);
    const match = lines.map((line) => line.match(pattern)).find(Boolean);

    if (match?.[1]) {
      process.stdout.write(`${match[1]}\n`);
    }
  ' "$PLUGIN_NAME"
}

require_codex_marketplace_support() {
  if ! command -v codex >/dev/null 2>&1; then
    echo "Codex CLI not found. Install Codex rust-v0.121.0+ or newer, then rerun install.sh." >&2
    exit 1
  fi

  if ! codex plugin marketplace --help >/dev/null 2>&1; then
    echo "Codex marketplace support is required. Install Codex rust-v0.121.0+ or newer, then rerun install.sh." >&2
    exit 1
  fi
}

require_cmd node
require_cmd claude
require_cmd copilot

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt "$NODE_MIN_MAJOR" ]; then
  echo "Node >= $NODE_MIN_MAJOR is required. Found $(node -v)." >&2
  exit 1
fi

require_codex_marketplace_support

echo "Installing local dependencies in $REPO_ROOT..."
pnpm install --dir "$REPO_ROOT"

EXPECTED_PLUGIN_VERSION="$(read_plugin_version)"
INSTALLED_PLUGIN_VERSION="$(get_installed_plugin_version)"
INSTALLED_COPILOT_PLUGIN_VERSION="$(get_installed_copilot_plugin_version)"

codex plugin marketplace add "$CODEX_MARKETPLACE_DIR" \
  && echo "Codex marketplace added: $CODEX_MARKETPLACE_DIR" \
  || {
    echo "Failed to register the Codex marketplace. Install Codex rust-v0.121.0+ or newer and rerun install.sh." >&2
    exit 1
  }

# Claude Code plugin via marketplace
echo "Registering Claude Code marketplace..."
claude plugin marketplace add "$MARKETPLACE_REPO" 2>/dev/null \
  && echo "Marketplace added: $MARKETPLACE_REPO" \
  || echo "Marketplace already registered or updated."

if [ "$INSTALLED_PLUGIN_VERSION" = "$EXPECTED_PLUGIN_VERSION" ]; then
  echo "Claude Code plugin already installed at version $INSTALLED_PLUGIN_VERSION; skipping reinstall."
else
  echo "Installing Claude Code plugin version $EXPECTED_PLUGIN_VERSION..."
  claude plugin install "$PLUGIN_NAME" --scope user 2>/dev/null \
    && echo "Plugin installed: $PLUGIN_NAME@$EXPECTED_PLUGIN_VERSION" \
    || echo "Plugin already installed or updated."
fi

# GitHub Copilot plugin
if [ "$INSTALLED_COPILOT_PLUGIN_VERSION" = "$EXPECTED_PLUGIN_VERSION" ]; then
  echo "Copilot plugin already installed at version $INSTALLED_COPILOT_PLUGIN_VERSION; skipping reinstall."
else
  echo "Installing Copilot plugin version $EXPECTED_PLUGIN_VERSION..."
  copilot plugin install "$COPILOT_PLUGIN_SOURCE" \
    && echo "Plugin installed: $PLUGIN_NAME@$EXPECTED_PLUGIN_VERSION" \
    || echo "Plugin already installed or updated."
fi

# nb-catalog CLI
echo "Linking nb-catalog globally..."
npm_config_prefix="$HOME/.local" npm link

if ! command -v nb-catalog >/dev/null 2>&1; then
  echo "nb-catalog was not found in PATH after linking." >&2
  exit 1
fi

echo "Ensuring Codex wrapper exists..."
bash "$CODEX_WRAPPER_SCRIPT"

echo "Ensuring Chrome DevTools MCP wrapper exists..."
bash "$CHROME_DEVTOOLS_WRAPPER_SCRIPT"

echo "Ensuring VS Code Copilot Chat links exist..."
bash "$VSCODE_COPILOT_CHAT_SCRIPT"

echo "Ensuring Codex skills links exist..."
bash "$CODEX_SKILLS_SCRIPT"

echo ""
echo "Installation complete."
echo "  Codex marketplace: $CODEX_MARKETPLACE_DIR"
echo "  Claude plugin: $PLUGIN_NAME@$MARKETPLACE_REPO"
echo "  Copilot plugin:  $COPILOT_PLUGIN_SOURCE"
echo "  CLI:           $(command -v nb-catalog)"
echo "  Wrapper:       ${CODEX_WRAPPER_PATH:-$HOME/.local/bin/codex-full}"
echo "  DevTools MCP:  ${CHROME_DEVTOOLS_MCP_WRAPPER_PATH:-$HOME/.local/bin/chrome-devtools-mcp-wayland}"
echo "  Codex skills:  ${CODEX_SKILLS_DIR:-$HOME/.codex/skills}"
echo "  VS Code Copilot Chat skills: ${COPILOT_CHAT_SKILLS_DIR:-$HOME/.copilot/skills}"
echo "  VS Code prompts: ${VSCODE_USER_PROMPTS_DIR:-$HOME/.config/Code/User/prompts}"
echo ""
echo "Restart Claude Code, Codex, and VS Code to activate."
