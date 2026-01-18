import fs from 'fs';
import path from 'path';
import { extractFrontmatter, stripFrontmatter } from './skills-core.js';

/**
 * SubagentRegistry - Registry for subagent prompt templates.
 * Subagents are specialized prompts used with the Task tool for focused work.
 */
class SubagentRegistry {
    constructor(options = {}) {
        this.agentsDir = options.agentsDir || path.join(process.cwd(), 'agents');
        this.subagents = new Map();
        this.loaded = false;
    }

    /**
     * Load all subagent definitions from the agents directory.
     * @returns {SubagentRegistry} this instance for chaining
     */
    load() {
        this.subagents.clear();

        if (!fs.existsSync(this.agentsDir)) {
            this.loaded = true;
            return this;
        }

        const entries = fs.readdirSync(this.agentsDir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isFile() && entry.name.endsWith('.md')) {
                const filePath = path.join(this.agentsDir, entry.name);
                const name = entry.name.replace(/\.md$/, '');

                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const { name: metaName, description } = extractFrontmatter(filePath);
                    const promptContent = stripFrontmatter(content);

                    // Extract model from frontmatter if present
                    let model = 'inherit';
                    const modelMatch = content.match(/^model:\s*(.+)$/m);
                    if (modelMatch) {
                        model = modelMatch[1].trim();
                    }

                    this.subagents.set(name, {
                        name: metaName || name,
                        slug: name,
                        description: description || '',
                        model,
                        promptTemplate: promptContent,
                        filePath
                    });
                } catch (error) {
                    console.error(`Failed to load subagent ${name}:`, error.message);
                }
            }
        }

        this.loaded = true;
        return this;
    }

    /**
     * Get a subagent by name.
     * @param {string} name - Subagent name (slug or display name)
     * @returns {object|null} Subagent definition or null if not found
     */
    get(name) {
        if (!this.loaded) this.load();

        // Try slug first
        if (this.subagents.has(name)) {
            return this.subagents.get(name);
        }

        // Try by display name
        for (const subagent of this.subagents.values()) {
            if (subagent.name === name) {
                return subagent;
            }
        }

        return null;
    }

    /**
     * Get all loaded subagents.
     * @returns {Array<object>} Array of all subagent definitions
     */
    getAll() {
        if (!this.loaded) this.load();
        return Array.from(this.subagents.values());
    }

    /**
     * Render a subagent prompt with variable substitution.
     * @param {string} name - Subagent name
     * @param {object} variables - Variables to substitute (e.g., {BASE_SHA: 'abc123'})
     * @returns {string|null} Rendered prompt or null if subagent not found
     */
    render(name, variables = {}) {
        const subagent = this.get(name);
        if (!subagent) return null;

        let prompt = subagent.promptTemplate;

        // Replace {VARIABLE} and {VARIABLE_NAME} patterns
        for (const [key, value] of Object.entries(variables)) {
            const pattern = new RegExp(`\\{${key}\\}`, 'g');
            prompt = prompt.replace(pattern, value);
        }

        return prompt;
    }

    /**
     * Get a Task tool invocation object for a subagent.
     * @param {string} name - Subagent name
     * @param {string} description - Task description
     * @param {object} variables - Variables for prompt rendering
     * @returns {object|null} Task tool parameters or null if not found
     */
    getTaskInvocation(name, description, variables = {}) {
        const subagent = this.get(name);
        if (!subagent) return null;

        const prompt = this.render(name, variables);

        return {
            description,
            prompt,
            subagent_type: 'general-purpose',
            model: subagent.model !== 'inherit' ? subagent.model : undefined
        };
    }

    /**
     * List all available subagents with their descriptions.
     * @returns {string} Formatted list of subagents
     */
    list() {
        if (!this.loaded) this.load();

        const lines = ['Available Subagents:', ''];

        for (const subagent of this.subagents.values()) {
            lines.push(`- **${subagent.name}** (${subagent.slug})`);
            if (subagent.description) {
                // Truncate long descriptions
                const desc = subagent.description.length > 100
                    ? subagent.description.substring(0, 100) + '...'
                    : subagent.description;
                lines.push(`  ${desc}`);
            }
            lines.push('');
        }

        return lines.join('\n');
    }
}

// Singleton instance with default configuration
const defaultRegistry = new SubagentRegistry();

export { SubagentRegistry, defaultRegistry };
export default defaultRegistry;
