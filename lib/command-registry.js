import fs from 'fs';
import path from 'path';
import { extractFrontmatter, stripFrontmatter } from './skills-core.js';

/**
 * CommandRegistry - Registry for slash commands.
 * Commands are shortcuts that invoke skills or perform specific actions.
 */
class CommandRegistry {
    constructor(options = {}) {
        this.commandsDir = options.commandsDir || path.join(process.cwd(), 'commands');
        this.commands = new Map();
        this.loaded = false;
    }

    /**
     * Load all command definitions from the commands directory.
     * @returns {CommandRegistry} this instance for chaining
     */
    load() {
        this.commands.clear();

        if (!fs.existsSync(this.commandsDir)) {
            this.loaded = true;
            return this;
        }

        const entries = fs.readdirSync(this.commandsDir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isFile() && entry.name.endsWith('.md')) {
                const filePath = path.join(this.commandsDir, entry.name);
                const name = entry.name.replace(/\.md$/, '');

                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const { description } = extractFrontmatter(filePath);
                    const body = stripFrontmatter(content);

                    // Extract disable-model-invocation from frontmatter
                    let disableModelInvocation = false;
                    const disableMatch = content.match(/^disable-model-invocation:\s*(true|false)$/m);
                    if (disableMatch) {
                        disableModelInvocation = disableMatch[1] === 'true';
                    }

                    this.commands.set(name, {
                        name,
                        description: description || '',
                        disableModelInvocation,
                        body,
                        filePath
                    });
                } catch (error) {
                    console.error(`Failed to load command ${name}:`, error.message);
                }
            }
        }

        this.loaded = true;
        return this;
    }

    /**
     * Get a command by name.
     * @param {string} name - Command name (without leading /)
     * @returns {object|null} Command definition or null if not found
     */
    get(name) {
        if (!this.loaded) this.load();
        return this.commands.get(name) || null;
    }

    /**
     * Get all loaded commands.
     * @returns {Array<object>} Array of all command definitions
     */
    getAll() {
        if (!this.loaded) this.load();
        return Array.from(this.commands.values());
    }

    /**
     * List all available commands with descriptions.
     * @returns {string} Formatted list of commands
     */
    list() {
        if (!this.loaded) this.load();

        const lines = ['Available Commands:', ''];

        for (const cmd of this.commands.values()) {
            lines.push(`- **/${cmd.name}** - ${cmd.description || 'No description'}`);
        }

        return lines.join('\n');
    }

    /**
     * Check if a command exists.
     * @param {string} name - Command name
     * @returns {boolean}
     */
    has(name) {
        if (!this.loaded) this.load();
        return this.commands.has(name);
    }
}

// Singleton instance with default configuration
const defaultRegistry = new CommandRegistry();

export { CommandRegistry, defaultRegistry };
export default defaultRegistry;
