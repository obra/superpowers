/**
 * Skills Manager
 * Discovers and manages available Superpowers skills
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface Skill {
    name: string;
    description: string;
    path: string;
    content?: string;
    triggers?: string[];
}

export interface SkillCategory {
    name: string;
    count: number;
}

export class SkillsManager {
    private skills: Map<string, Skill> = new Map();
    private categories: Map<string, Skill[]> = new Map();
    private skillsPath: string;
    private watchDisposable?: vscode.Disposable;

    constructor(customPath: string = '') {
        this.skillsPath = customPath || this.getDefaultSkillsPath();
    }

    async initialize(): Promise<void> {
        await this.discoverSkills();
        this.watchForChanges();
    }

    private getDefaultSkillsPath(): string {
        // Common installation locations
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

    async discoverSkills(): Promise<void> {
        this.skills.clear();
        this.categories.clear();

        if (!this.skillsPath || !fs.existsSync(this.skillsPath)) {
            // Add built-in skill references even if no local installation
            this.addBuiltinSkills();
            return;
        }

        const entries = fs.readdirSync(this.skillsPath, { withFileTypes: true });

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;

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
                    this.categories.get(category)!.push(skill);
                }
            }
        }
    }

    private addBuiltinSkills(): void {
        const builtinSkills: Skill[] = [
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

        builtinSkills.forEach(skill => {
            this.skills.set(skill.name, skill);
            const category = this.categorizeSkill(skill);
            if (!this.categories.has(category)) {
                this.categories.set(category, []);
            }
            this.categories.get(category)!.push(skill);
        });
    }

    private parseSkillFile(filePath: string): Skill | null {
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
                    } else if (descMatch) {
                        description = descMatch[1].trim();
                    }
                } else if (frontmatterEnded) {
                    skillContent += line + '\n';
                }
            }

            return {
                name,
                description: description || 'No description available',
                path: filePath,
                content: skillContent
            };
        } catch (error) {
            console.error(`Failed to parse skill file ${filePath}:`, error);
            return null;
        }
    }

    private categorizeSkill(skill: Skill): string {
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

    private watchForChanges(): void {
        if (!this.skillsPath) return;

        const watcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(this.skillsPath, '**/SKILL.md')
        );

        watcher.onDidChange(() => this.discoverSkills());
        watcher.onDidCreate(() => this.discoverSkills());
        watcher.onDidDelete(() => this.discoverSkills());

        this.watchDisposable = watcher;
    }

    getAllSkills(): Skill[] {
        return Array.from(this.skills.values());
    }

    getSkill(name: string): Skill | undefined {
        return this.skills.get(name);
    }

    getCategories(): SkillCategory[] {
        return Array.from(this.categories.entries()).map(([name, skills]) => ({
            name,
            count: skills.length
        }));
    }

    getSkillsByCategory(category: string): Skill[] {
        return this.categories.get(category) || [];
    }

    dispose(): void {
        this.watchDisposable?.dispose();
    }
}
