"use strict";
/**
 * Skills Manager
 * Discovers and manages available Superpowers skills
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillsManager = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class SkillsManager {
    constructor(customPath = '') {
        this.skills = new Map();
        this.categories = new Map();
        this.isDisposed = false;
        this.skillsPath = customPath || this.getDefaultSkillsPath();
    }
    async initialize() {
        await this.discoverSkills();
        this.watchForChanges();
    }
    getDefaultSkillsPath() {
        // Common installation locations for various AI coding tools
        const homeDir = process.env.HOME || process.env.USERPROFILE || '';
        const possiblePaths = [
            // Claude Code plugin path
            path.join(homeDir, '.claude', 'plugins', 'superpowers', 'skills'),
            // Cursor path
            path.join(homeDir, '.cursor', 'plugins', 'superpowers', 'skills'),
            // OpenCode path
            path.join(homeDir, '.config', 'opencode', 'superpowers', 'skills'),
            // Codex path
            path.join(homeDir, '.codex', 'superpowers', 'skills'),
            // Personal skills
            path.join(homeDir, '.agents', 'skills', 'superpowers'),
        ];
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                return p;
            }
        }
        return '';
    }
    async discoverSkills() {
        this.skills.clear();
        this.categories.clear();
        if (!this.skillsPath || !fs.existsSync(this.skillsPath)) {
            // Add built-in skill references even if no local installation
            this.addBuiltinSkills();
            return;
        }
        try {
            const entries = fs.readdirSync(this.skillsPath, { withFileTypes: true });
            for (const entry of entries) {
                if (this.isDisposed)
                    return;
                if (!entry.isDirectory())
                    continue;
                const skillDir = path.join(this.skillsPath, entry.name);
                const skillFile = path.join(skillDir, 'SKILL.md');
                if (fs.existsSync(skillFile)) {
                    const skill = this.parseSkillFile(skillFile);
                    if (skill) {
                        this.skills.set(skill.name, skill);
                        // Categorize
                        const category = this.categorizeSkill(skill);
                        if (!this.categories.has(category)) {
                            this.categories.set(category, []);
                        }
                        this.categories.get(category).push(skill);
                    }
                }
            }
        }
        catch (error) {
            console.error('Failed to discover skills:', error);
            this.addBuiltinSkills();
        }
    }
    addBuiltinSkills() {
        const builtinSkills = [
            {
                name: 'brainstorming',
                description: 'Socratic design refinement for new features',
                path: 'built-in',
                triggers: ['design', 'feature', 'how should', 'plan']
            },
            {
                name: 'test-driven-development',
                description: 'RED-GREEN-REFACTOR cycle for writing tests first',
                path: 'built-in',
                triggers: ['test', 'tdd', 'spec']
            },
            {
                name: 'systematic-debugging',
                description: '4-phase root cause process for debugging',
                path: 'built-in',
                triggers: ['bug', 'debug', 'error', 'fix']
            },
            {
                name: 'writing-plans',
                description: 'Detailed implementation plan creation',
                path: 'built-in',
                triggers: ['plan', 'implement', 'task']
            },
            {
                name: 'subagent-driven-development',
                description: 'Parallel subagent workflow for large tasks',
                path: 'built-in',
                triggers: ['parallel', 'subagent', 'multi']
            },
            {
                name: 'requesting-code-review',
                description: 'Pre-review checklist for code quality',
                path: 'built-in',
                triggers: ['review', 'code review']
            }
        ];
        for (const skill of builtinSkills) {
            this.skills.set(skill.name, skill);
            const category = this.categorizeSkill(skill);
            if (!this.categories.has(category)) {
                this.categories.set(category, []);
            }
            this.categories.get(category).push(skill);
        }
    }
    parseSkillFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            let name = path.basename(path.dirname(filePath));
            let description = '';
            let inFrontmatter = false;
            let frontmatterEnded = false;
            let skillContent = '';
            for (const line of lines) {
                if (line.trim() === '---') {
                    if (inFrontmatter) {
                        frontmatterEnded = true;
                        continue;
                    }
                    inFrontmatter = true;
                    continue;
                }
                if (inFrontmatter && !frontmatterEnded) {
                    const nameMatch = line.match(/^name:\s*(.+)$/);
                    const descMatch = line.match(/^description:\s*(.+)$/);
                    if (nameMatch) {
                        name = nameMatch[1].trim();
                    }
                    else if (descMatch) {
                        description = descMatch[1].trim();
                    }
                }
                else if (frontmatterEnded) {
                    skillContent += line + '\n';
                }
            }
            return {
                name,
                description: description || 'No description available',
                path: filePath,
                content: skillContent
            };
        }
        catch (error) {
            console.error(`Failed to parse skill file ${filePath}:`, error);
            return null;
        }
    }
    categorizeSkill(skill) {
        const name = skill.name.toLowerCase();
        const desc = skill.description.toLowerCase();
        if (name.includes('test') || desc.includes('test')) {
            return 'Testing';
        }
        if (name.includes('debug') || desc.includes('debug')) {
            return 'Debugging';
        }
        if (name.includes('brainstorm') || name.includes('plan') || desc.includes('design')) {
            return 'Planning';
        }
        if (name.includes('review') || desc.includes('review')) {
            return 'Review';
        }
        if (name.includes('agent') || name.includes('subagent')) {
            return 'Automation';
        }
        if (name.includes('git') || name.includes('branch')) {
            return 'Git';
        }
        return 'General';
    }
    watchForChanges() {
        if (!this.skillsPath)
            return;
        try {
            const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(this.skillsPath, '**/SKILL.md'));
            watcher.onDidChange(() => this.discoverSkills());
            watcher.onDidCreate(() => this.discoverSkills());
            watcher.onDidDelete(() => this.discoverSkills());
            this.watchDisposable = watcher;
        }
        catch (error) {
            console.error('Failed to create file watcher:', error);
        }
    }
    getAllSkills() {
        return Array.from(this.skills.values());
    }
    getSkill(name) {
        return this.skills.get(name);
    }
    getCategories() {
        return Array.from(this.categories.entries()).map(([name, skills]) => ({
            name,
            count: skills.length
        }));
    }
    getSkillsByCategory(category) {
        return this.categories.get(category) || [];
    }
    dispose() {
        this.isDisposed = true;
        if (this.watchDisposable) {
            this.watchDisposable.dispose();
            this.watchDisposable = undefined;
        }
        this.skills.clear();
        this.categories.clear();
    }
}
exports.SkillsManager = SkillsManager;
//# sourceMappingURL=manager.js.map