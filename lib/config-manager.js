/**
 * Configuration Manager for Superpowers
 *
 * Manages project-level configuration for personal/team development modes.
 */

import fs from 'fs';
import path from 'path';

const CONFIG_FILENAME = '.superpowers-config.yaml';
const CONFIG_TEMPLATE = `# Superpowers Configuration
# This file controls development workflow preferences

# Development mode: personal (individual developer) or team (collaborative)
development_mode: personal

# Branch strategy: worktree (isolated environment) or simple (regular branches)
branch_strategy: simple

# Testing strategy: tdd (test-first) or test-after (code-first, add tests later)
testing_strategy: test-after

# Completion strategy: pr (create pull request), merge (local merge), or keep (preserve branch)
completion_strategy: merge
`;

/**
 * Find the configuration file by traversing up the directory tree
 *
 * @param {string} startDir - Directory to start searching from
 * @returns {string|null} - Path to config file or null if not found
 */
function findConfigFile(startDir) {
  let currentDir = startDir;

  while (currentDir !== path.parse(currentDir).root) {
    const configPath = path.join(currentDir, CONFIG_FILENAME);

    if (fs.existsSync(configPath)) {
      return configPath;
    }

    // Move up one directory
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break; // Reached the root
    }
    currentDir = parentDir;
  }

  return null;
}

/**
 * Simple YAML parser for our specific config format
 * Handles key: value pairs and ignores comments
 *
 * @param {string} content - YAML content
 * @returns {Object} - Parsed configuration
 */
function parseSimpleYAML(content) {
  const config = {};
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Parse key: value pairs
    const match = trimmed.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;

      // Convert value to appropriate type
      if (value === 'true') {
        config[key] = true;
      } else if (value === 'false') {
        config[key] = false;
      } else if (/^-?\d+(\.\d+)?$/.test(value)) {
        // Only convert if value is a valid number format (integer or float)
        config[key] = Number(value);
      } else {
        config[key] = value;
      }
    }
  }

  return config;
}

/**
 * Detect configuration file in project directory
 *
 * @param {string} projectDir - Project directory path
 * @returns {Object} - { found: boolean, path: string|null }
 */
function detectConfig(projectDir) {
  const configPath = findConfigFile(projectDir);

  return {
    found: !!configPath,
    path: configPath
  };
}

/**
 * Read and parse configuration file
 *
 * @param {string} projectDir - Project directory path
 * @returns {Object|null} - Parsed configuration or null if not found
 */
function readConfig(projectDir) {
  const { found, path: configPath } = detectConfig(projectDir);

  if (!found) {
    return null;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf8');
    return parseSimpleYAML(content);
  } catch (error) {
    console.error(`Error reading config file: ${error.message}`);
    return null;
  }
}

/**
 * Escape string value for YAML output
 * Handles special characters: colons, quotes, newlines, etc.
 *
 * @param {string} value - Value to escape
 * @returns {string} - Properly escaped YAML string
 */
function escapeYAMLString(value) {
  // Convert non-string values to string
  if (typeof value !== 'string') {
    return String(value);
  }

  // Check if value needs quoting (contains special YAML characters)
  const needsQuoting = /[:#\n\r\t"'\\]|^\s|\s$/.test(value);

  if (!needsQuoting) {
    return value;
  }

  // Use double-quoted style and escape special characters
  // YAML escape sequences: \n, \r, \t, \\, \", \'
  return `"${value
    .replace(/\\/g, '\\\\')  // Backslash first
    .replace(/"/g, '\\"')     // Double quotes
    .replace(/\n/g, '\\n')    // Newlines
    .replace(/\r/g, '\\r')    // Carriage returns
    .replace(/\t/g, '\\t')    // Tabs
  }"`;
}

/**
 * Write configuration file to project directory
 *
 * @param {string} projectDir - Project directory path
 * @param {Object} config - Configuration object to write
 * @returns {boolean} - Success status
 */
function writeConfig(projectDir, config) {
  const configPath = path.join(projectDir, CONFIG_FILENAME);

  try {
    // Convert config object to YAML format with proper escaping
    const yamlContent = Object.entries(config)
      .map(([key, value]) => `${key}: ${escapeYAMLString(value)}`)
      .join('\n');

    const content = `# Superpowers Configuration
# This file controls development workflow preferences

${yamlContent}
`;

    fs.writeFileSync(configPath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing config file: ${error.message}`);
    return false;
  }
}

/**
 * Get the structure for initial configuration prompt
 * Returns AskUserQuestion compatible structure
 *
 * @returns {Object} - Question structure for initial setup
 */
function promptForInitialConfig() {
  return {
    questions: [
      {
        question: '请选择你的开发模式：',
        header: '开发模式',
        options: [
          {
            label: '个人开发者',
            description: '单人开发，使用简化的工作流程（普通分支、本地合并、可选测试）'
          },
          {
            label: '团队协作',
            description: '团队开发，使用完整的工作流程（worktree 隔离、PR 流程、TDD）'
          }
        ],
        multiSelect: false
      }
    ]
  };
}

/**
 * Get configuration template content
 *
 * @returns {string} - Template YAML content
 */
function getTemplate() {
  return CONFIG_TEMPLATE;
}

export {
  detectConfig,
  readConfig,
  writeConfig,
  promptForInitialConfig,
  getTemplate,
  CONFIG_FILENAME
};
