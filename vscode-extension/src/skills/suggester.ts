/**
 * Skill Suggester
 * Analyzes code context and suggests relevant skills
 */

import { SkillsManager } from './manager';

/**
 * Represents a skill suggestion with reasoning.
 */
export interface SkillSuggestion {
    /** Name of the suggested skill */
    skillName: string;
    /** Reason for the suggestion */
    reason: string;
    /** Confidence level (0-1) */
    confidence: number;
}

/**
 * Pattern definition for skill triggers.
 */
interface PatternDefinition {
    /** Regex source string */
    pattern: string;
    /** Regex flags (excluding 'g' to avoid lastIndex issues) */
    flags: string;
    /** Matching skills and reasons */
    matches: { skill: string; reason: string }[];
}

/**
 * Analyzes code context and suggests relevant Superpowers skills.
 */
export class SkillSuggester {
    // Pattern definitions stored as strings to avoid regex state issues
    // Note: We exclude the 'g' flag since .test() with 'g' updates lastIndex
    private readonly patternDefinitions: PatternDefinition[] = [
        // Testing patterns
        {
            pattern: 'describe\\s*\\(|it\\s*\\(|test\\s*\\(',
            flags: '',  // No 'g' flag
            matches: [
                { skill: 'test-driven-development', reason: 'Test file detected - TDD workflow recommended' }
            ]
        },
        {
            pattern: 'expect\\s*\\(|assert\\(',
            flags: '',
            matches: [
                { skill: 'test-driven-development', reason: 'Assertion patterns suggest testing context' }
            ]
        },

        // Error/debugging patterns
        {
            pattern: 'Error:|Exception:|throw new',
            flags: '',
            matches: [
                { skill: 'systematic-debugging', reason: 'Error patterns detected - systematic debugging recommended' }
            ]
        },
        {
            pattern: 'console\\.log|console\\.error|debugger',
            flags: '',
            matches: [
                { skill: 'systematic-debugging', reason: 'Debug statements found - consider systematic approach' }
            ]
        },
        {
            pattern: 'TODO:|FIXME:|BUG:',
            flags: '',
            matches: [
                { skill: 'systematic-debugging', reason: 'Issue markers detected' }
            ]
        },

        // Planning/design patterns
        {
            pattern: '//\\s*PLAN:|//\\s*DESIGN:|/\\*\\*\\s*\\*/',
            flags: '',
            matches: [
                { skill: 'writing-plans', reason: 'Planning comments detected' }
            ]
        },
        {
            pattern: 'interface\\s+\\w+|type\\s+\\w+\\s*=',
            flags: '',
            matches: [
                { skill: 'brainstorming', reason: 'Type definitions suggest design phase' }
            ]
        },

        // Git patterns
        {
            pattern: 'git\\s+checkout|git\\s+branch|git\\s+merge',
            flags: '',
            matches: [
                { skill: 'using-git-worktrees', reason: 'Git operations detected' }
            ]
        },

        // Review patterns
        {
            pattern: 'review|refactor|optimize',
            flags: 'i',  // Case insensitive, but no 'g'
            matches: [
                { skill: 'requesting-code-review', reason: 'Review keywords detected' }
            ]
        },

        // Async/concurrency patterns
        {
            pattern: 'async\\s+|await\\s+|Promise\\.|\\.then\\(',
            flags: '',
            matches: [
                { skill: 'systematic-debugging', reason: 'Async code can have subtle bugs - systematic debugging helps' }
            ]
        },

        // API patterns
        {
            pattern: 'fetch\\(|axios\\.|\\.get\\(|\\.post\\(',
            flags: '',
            matches: [
                { skill: 'systematic-debugging', reason: 'API calls benefit from error handling review' }
            ]
        }
    ];

    // Language-specific suggestions
    private readonly languageSkills: Map<string, string[]> = new Map([
        ['javascript', ['test-driven-development', 'systematic-debugging']],
        ['typescript', ['test-driven-development', 'systematic-debugging', 'brainstorming']],
        ['python', ['test-driven-development', 'systematic-debugging']],
        ['go', ['test-driven-development', 'systematic-debugging']],
        ['rust', ['test-driven-development', 'systematic-debugging']]
    ]);

    /**
     * Creates a new SkillSuggester instance.
     * @param skillsManager - The skills manager for skill lookup
     */
    constructor(private skillsManager: SkillsManager) {}

    /**
     * Suggests skills based on code context and language.
     * @param code - The code to analyze
     * @param language - The programming language
     * @returns Array of skill suggestions sorted by confidence
     */
    async suggestForContext(code: string, language: string): Promise<SkillSuggestion[]> {
        const suggestions: Map<string, SkillSuggestion> = new Map();

        // Pattern-based suggestions - create fresh RegExp each time
        for (const def of this.patternDefinitions) {
            // Build flags without 'g' to avoid lastIndex pollution
            const safeFlags = (def.flags || '').replace(/g/g, '');
            const regex = new RegExp(def.pattern, safeFlags);

            if (regex.test(code)) {
                for (const match of def.matches) {
                    const existing = suggestions.get(match.skill);
                    if (!existing || existing.confidence < 0.7) {
                        suggestions.set(match.skill, {
                            skillName: match.skill,
                            reason: match.reason,
                            confidence: 0.7
                        });
                    }
                }
            }
        }

        // Language-based suggestions
        const langSkills = this.languageSkills.get(language) || [];
        for (const skillName of langSkills) {
            if (!suggestions.has(skillName)) {
                suggestions.set(skillName, {
                    skillName,
                    reason: `Commonly used with ${language} projects`,
                    confidence: 0.4
                });
            }
        }

        // File context suggestions
        const fileSuggestions = this.analyzeFileContext(code);
        for (const suggestion of fileSuggestions) {
            const existing = suggestions.get(suggestion.skillName);
            if (!existing || existing.confidence < suggestion.confidence) {
                suggestions.set(suggestion.skillName, suggestion);
            }
        }

        // Verify skills exist
        const validSuggestions: SkillSuggestion[] = [];
        for (const [, suggestion] of suggestions) {
            const skill = this.skillsManager.getSkill(suggestion.skillName);
            if (skill) {
                validSuggestions.push(suggestion);
            }
        }

        // Sort by confidence (highest first)
        return validSuggestions.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Analyzes file context for additional suggestions.
     * @param code - The code to analyze
     * @returns Array of context-based suggestions
     */
    private analyzeFileContext(code: string): SkillSuggestion[] {
        const suggestions: SkillSuggestion[] = [];

        // Check for large files
        const lines = code.split('\n').length;
        if (lines > 500) {
            suggestions.push({
                skillName: 'brainstorming',
                reason: 'Large file detected - consider design review',
                confidence: 0.5
            });
        }

        // Check for complex functions
        const functionMatches = code.match(/function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(/g);
        if (functionMatches && functionMatches.length > 10) {
            suggestions.push({
                skillName: 'brainstorming',
                reason: 'Many functions detected - consider refactoring',
                confidence: 0.5
            });
        }

        // Check for test coverage
        if (!code.includes('describe(') && !code.includes('test(') && !code.includes('it(')) {
            const hasExports = code.includes('export ') || code.includes('module.exports');
            if (hasExports) {
                suggestions.push({
                    skillName: 'test-driven-development',
                    reason: 'Module without tests detected',
                    confidence: 0.6
                });
            }
        }

        // Check for error handling with more robust detection
        const hasTryCatch = /\btry\s*\{/.test(code) && /\bcatch\s*\(/.test(code);
        const hasAsync = /\basync\b/.test(code) && /\bawait\b/.test(code);
        if (hasAsync && !hasTryCatch) {
            suggestions.push({
                skillName: 'systematic-debugging',
                reason: 'Async code without error handling',
                confidence: 0.6
            });
        }

        return suggestions;
    }
}
