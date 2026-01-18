/**
 * Superpowers Library - Core skills and subagent system
 *
 * This module provides programmatic access to the superpowers skill system,
 * including skill loading, subagent management, and command execution.
 */

// Core utilities
export {
    extractFrontmatter,
    findSkillsInDir,
    resolveSkillPath,
    checkForUpdates,
    stripFrontmatter
} from './skills-core.js';

// Registries
export { SkillRegistry, defaultRegistry as skillRegistry } from './skill-registry.js';
export { SubagentRegistry, defaultRegistry as subagentRegistry } from './subagent-registry.js';
export { CommandRegistry, defaultRegistry as commandRegistry } from './command-registry.js';

// Convenience re-exports of default registries
import { defaultRegistry as skillRegistry } from './skill-registry.js';
import { defaultRegistry as subagentRegistry } from './subagent-registry.js';
import { defaultRegistry as commandRegistry } from './command-registry.js';

/**
 * Initialize all registries and load skills/subagents/commands.
 * @param {object} options - Configuration options
 * @param {string} options.superpowersDir - Path to superpowers skills directory
 * @param {string} options.personalDir - Path to personal skills directory
 * @param {string} options.agentsDir - Path to agents directory
 * @param {string} options.commandsDir - Path to commands directory
 * @returns {object} Initialized registries
 */
export function initialize(options = {}) {
    if (options.superpowersDir) {
        skillRegistry.superpowersDir = options.superpowersDir;
    }
    if (options.personalDir) {
        skillRegistry.personalDir = options.personalDir;
    }
    if (options.agentsDir) {
        subagentRegistry.agentsDir = options.agentsDir;
    }
    if (options.commandsDir) {
        commandRegistry.commandsDir = options.commandsDir;
    }

    skillRegistry.load();
    subagentRegistry.load();
    commandRegistry.load();

    return {
        skills: skillRegistry,
        subagents: subagentRegistry,
        commands: commandRegistry
    };
}

/**
 * Get a skill by name.
 * @param {string} name - Skill name (with or without superpowers: prefix)
 * @returns {object|null} Skill definition
 */
export function getSkill(name) {
    return skillRegistry.get(name);
}

/**
 * Get a skill with its full content.
 * @param {string} name - Skill name
 * @returns {object|null} Skill with content property
 */
export function getSkillWithContent(name) {
    return skillRegistry.getWithContent(name);
}

/**
 * Get a subagent prompt template.
 * @param {string} name - Subagent name
 * @returns {object|null} Subagent definition
 */
export function getSubagent(name) {
    return subagentRegistry.get(name);
}

/**
 * Render a subagent prompt with variables.
 * @param {string} name - Subagent name
 * @param {object} variables - Variables to substitute
 * @returns {string|null} Rendered prompt
 */
export function renderSubagentPrompt(name, variables) {
    return subagentRegistry.render(name, variables);
}

/**
 * Get a command definition.
 * @param {string} name - Command name
 * @returns {object|null} Command definition
 */
export function getCommand(name) {
    return commandRegistry.get(name);
}

/**
 * List all available skills.
 * @returns {Array<object>} All skill definitions
 */
export function listSkills() {
    return skillRegistry.getAll();
}

/**
 * List all available subagents.
 * @returns {Array<object>} All subagent definitions
 */
export function listSubagents() {
    return subagentRegistry.getAll();
}

/**
 * List all available commands.
 * @returns {Array<object>} All command definitions
 */
export function listCommands() {
    return commandRegistry.getAll();
}

// Default export for convenience
export default {
    initialize,
    getSkill,
    getSkillWithContent,
    getSubagent,
    renderSubagentPrompt,
    getCommand,
    listSkills,
    listSubagents,
    listCommands,
    skillRegistry,
    subagentRegistry,
    commandRegistry
};
