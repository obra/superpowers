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
    private isDisposed = false;

    constructor(customPath: string = '') {
        this.skillsPath = customPath || this.getDefaultSkillsPath();
    }

    async initialize(): Promise<void> {
        await this.discoverSkills();
        this.watchForChanges();
    }

    private getDefaultSkillsPath(): string {
        const homeDir = process.env.HOME || process.env.USERPROFILE || '';
        const possiblePaths = [
            path.join(homeDir, '.claude', 'plugins', 'superpowers', 'skills'),
            path.join(homeDir, '.cursor', 'plugins', 'superpowers', 'skills'),
        ];

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) return p;
        }
        return '';
    }

    async discoverSkills(): Promise<void> {
        this.skills.clear();
        this.categories.clear();

        if (!this.skillsPath || !fs.existsSync(this.skillsPath)) {
            this.addBuiltinSkills();
            return;
        }

        try {
            const entries = fs.readdirSync(this.skillsPath, { withFileTypes: true });

            for (const entry of entries) {
                if (!entry.isDirectory()) continue;
                const skillDir = path.join(this.skillsPath, entry.name);
                const skillFile = path.join(skillDir, 'SKILL.md');

                if (fs.existsSync(skillFile)) {
                    const skill = this.parseSkillFile(skillFile);
                    if (skill) {
                        this.skills.set(skill.name, skill);
                        const category = this.categorizeSkill(skill);
                        if (!this.categories.has(category)) {
                            this.categories.set(category, []);
                        }
                        this.categories.get(category)!.push(skill);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to discover skills:', error);
            this.addBuiltinSkills();
        }
    }

    private addBuiltinSkills(): void {
        const builtinSkills: Skill[] = [
            { name: 'brainstorming', description: 'Socratic design refinement for new features', path: 'built-in', triggers: ['design', 'feature', 'plan'] },
            { name: 'test-driven-development', description: 'RED-GREEN-REFACTOR cycle', path: 'built-in', triggers: ['test', 'tdd', 'spec'] },
            { name: 'systematic-debugging', description: '4-phase root cause process', path: 'built-in', triggers: ['bug', 'debug', 'error', 'fix'] },
            { name: 'writing-plans', description: 'Implementation plan creation', path: 'built-in', triggers: ['plan', 'implement', 'task'] },
            { name: 'subagent-driven-development', description: 'Parallel subagent workflow', path: 'built-in', triggers: ['parallel', 'subagent'] },
            { name: 'requesting-code-review', description: 'Pre-review checklist', path: 'built-in', triggers: ['review', 'code review'] }
        ];

        for (const skill of builtinSkills) {
            this.skills.set(skill.name, skill);
            const category = this.categorizeSkill(skill);
            if (!this.categories.has(category)) this.categories.set(category, []);
            this.categories.get(category)!.push(skill);
        }
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
                    if (inFrontmatter) { frontmatterEnded = true; continue; }
                    inFrontmatter = true; continue;
                }

                if (inFrontmatter && !frontmatterEnded) {
                    const nameMatch = line.match(/^name:\s*(.+)$/);
                    const descMatch = line.match(/^description:\s*(.+)$/);
                    if (nameMatch) name = nameMatch[1].trim();
                    else if (descMatch) description = descMatch[1].trim();
                } else if (frontmatterEnded) {
                    skillContent += line + '\n';
                }
            }

            return { name, description: description || 'No description', path: filePath, content: skillContent };
        } catch (error) {
            console.error(`Failed to parse skill file ${filePath}:`, error);
            return null;
        }
    }

    private categorizeSkill(skill: Skill): string {
        const name = skill.name.toLowerCase();
        const desc = skill.description.toLowerCase();

        if (name.includes('test') || desc.includes('test')) return 'Testing';
        if (name.includes('debug') || desc.includes('debug')) return 'Debugging';
        if (name.includes('brainstorm') || name.includes('plan') || desc.includes('design')) return 'Planning';
        if (name.includes('review') || desc.includes('review')) return 'Review';
        if (name.includes('agent') || name.includes('subagent')) return 'Automation';
        if (name.includes('git') || name.includes('branch')) return 'Git';
        return 'General';
    }

    private watchForChanges(): void {
        if (!this.skillsPath) return;
        try {
            const watcher = vscode.workspace.createFileSystemWatcher(
                new vscode.RelativePattern(this.skillsPath, '**/SKILL.md')
            );
            watcher.onDidChange(() => this.discoverSkills());
            watcher.onDidCreate(() => this.discoverSkills());
            watcher.onDidDelete(() => this.discoverSkills());
            this.watchDisposable = watcher;
        } catch (error) {
            console.error('Failed to create file watcher:', error);
        }
    }

    getAllSkills(): Skill[] { return Array.from(this.skills.values()); }
    getSkill(name: string): Skill | undefined { return this.skills.get(name); }
    getCategories(): SkillCategory[] {
        return Array.from(this.categories.entries()).map(([name, skills]) => ({ name, count: skills.length }));
    }
    getSkillsByCategory(category: string): Skill[] { return this.categories.get(category) || []; }

    dispose(): void {
        this.isDisposed = true;
        if (this.watchDisposable) {
            this.watchDisposable.dispose();
            this.watchDisposable = undefined;
        }
        this.skills.clear();
        this.categories.clear();
    }
}