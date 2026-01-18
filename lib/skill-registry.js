import fs from 'fs';
import path from 'path';
import { extractFrontmatter, findSkillsInDir, resolveSkillPath, stripFrontmatter } from './skills-core.js';

/**
 * SkillRegistry - Central registry for all skills in the superpowers system.
 * Provides loading, resolution, and access to skill definitions.
 */
class SkillRegistry {
    constructor(options = {}) {
        this.superpowersDir = options.superpowersDir || path.join(process.cwd(), 'skills');
        this.personalDir = options.personalDir || null;
        this.skills = new Map();
        this.loaded = false;
    }

    /**
     * Load all skills from configured directories.
     * @returns {SkillRegistry} this instance for chaining
     */
    load() {
        this.skills.clear();

        // Load superpowers skills
        const superpowersSkills = findSkillsInDir(this.superpowersDir, 'superpowers');
        for (const skill of superpowersSkills) {
            this.skills.set(skill.name, {
                ...skill,
                qualifiedName: `superpowers:${skill.name}`
            });
        }

        // Load personal skills (shadow superpowers)
        if (this.personalDir) {
            const personalSkills = findSkillsInDir(this.personalDir, 'personal');
            for (const skill of personalSkills) {
                this.skills.set(skill.name, {
                    ...skill,
                    qualifiedName: skill.name,
                    shadows: this.skills.has(skill.name) ? `superpowers:${skill.name}` : null
                });
            }
        }

        this.loaded = true;
        return this;
    }

    /**
     * Get a skill by name.
     * @param {string} name - Skill name (with or without superpowers: prefix)
     * @returns {object|null} Skill definition or null if not found
     */
    get(name) {
        if (!this.loaded) this.load();

        const actualName = name.replace(/^superpowers:/, '');
        return this.skills.get(actualName) || null;
    }

    /**
     * Get all loaded skills.
     * @returns {Array<object>} Array of all skill definitions
     */
    getAll() {
        if (!this.loaded) this.load();
        return Array.from(this.skills.values());
    }

    /**
     * Get skill content (the markdown body without frontmatter).
     * @param {string} name - Skill name
     * @returns {string|null} Skill content or null if not found
     */
    getContent(name) {
        const skill = this.get(name);
        if (!skill) return null;

        try {
            const content = fs.readFileSync(skill.skillFile, 'utf8');
            return stripFrontmatter(content);
        } catch (error) {
            return null;
        }
    }

    /**
     * Get full skill with content.
     * @param {string} name - Skill name
     * @returns {object|null} Skill with content property added
     */
    getWithContent(name) {
        const skill = this.get(name);
        if (!skill) return null;

        return {
            ...skill,
            content: this.getContent(name)
        };
    }

    /**
     * Search skills by keyword in name or description.
     * @param {string} query - Search query
     * @returns {Array<object>} Matching skills
     */
    search(query) {
        if (!this.loaded) this.load();

        const lowerQuery = query.toLowerCase();
        return this.getAll().filter(skill =>
            skill.name.toLowerCase().includes(lowerQuery) ||
            skill.description.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * List skills by category/type.
     * @returns {object} Skills grouped by inferred category
     */
    listByCategory() {
        if (!this.loaded) this.load();

        const categories = {
            process: [],      // workflow/process skills
            development: [],  // coding/implementation skills
            review: [],       // code review skills
            meta: []          // skills about skills
        };

        for (const skill of this.skills.values()) {
            const name = skill.name.toLowerCase();
            const desc = skill.description.toLowerCase();

            if (name.includes('review') || desc.includes('review')) {
                categories.review.push(skill);
            } else if (name.includes('skill') || name.includes('superpower')) {
                categories.meta.push(skill);
            } else if (name.includes('plan') || name.includes('debug') || name.includes('worktree') || name.includes('branch')) {
                categories.process.push(skill);
            } else {
                categories.development.push(skill);
            }
        }

        return categories;
    }

    /**
     * Get supporting files for a skill (non-SKILL.md files in skill directory).
     * @param {string} name - Skill name
     * @returns {Array<{name: string, path: string}>} Supporting files
     */
    getSupportingFiles(name) {
        const skill = this.get(name);
        if (!skill) return [];

        const supportingFiles = [];
        const skillDir = skill.path;

        try {
            const entries = fs.readdirSync(skillDir, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isFile() && entry.name !== 'SKILL.md') {
                    supportingFiles.push({
                        name: entry.name,
                        path: path.join(skillDir, entry.name)
                    });
                }
            }
        } catch (error) {
            // Directory doesn't exist or can't be read
        }

        return supportingFiles;
    }
}

// Singleton instance with default configuration
const defaultRegistry = new SkillRegistry();

export { SkillRegistry, defaultRegistry };
export default defaultRegistry;
