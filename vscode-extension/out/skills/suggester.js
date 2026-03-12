"use strict";
/**
 * Skill Suggester
 * Analyzes code context and suggests relevant skills
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillSuggester = void 0;
class SkillSuggester {
    constructor(skillsManager) {
        this.skillsManager = skillsManager;
        // Pattern definitions stored as strings to avoid regex state issues
        this.patternDefinitions = [
            // Testing patterns
            {
                pattern: 'describe\\s*\\(|it\\s*\\(|test\\s*\\(',
                flags: 'g',
                matches: [
                    { skill: 'test-driven-development', reason: 'Test file detected - TDD workflow recommended' }
                ]
            },
            {
                pattern: 'expect\\s*\\(|assert\\(',
                flags: 'g',
                matches: [
                    { skill: 'test-driven-development', reason: 'Assertion patterns suggest testing context' }
                ]
            },
            // Error/debugging patterns
            {
                pattern: 'Error:|Exception:|throw new',
                flags: 'g',
                matches: [
                    { skill: 'systematic-debugging', reason: 'Error patterns detected - systematic debugging recommended' }
                ]
            },
            {
                pattern: 'console\\.log|console\\.error|debugger',
                flags: 'g',
                matches: [
                    { skill: 'systematic-debugging', reason: 'Debug statements found - consider systematic approach' }
                ]
            },
            {
                pattern: 'TODO:|FIXME:|BUG:',
                flags: 'g',
                matches: [
                    { skill: 'systematic-debugging', reason: 'Issue markers detected' }
                ]
            },
            // Planning/design patterns
            {
                pattern: '//\\s*PLAN:|//\\s*DESIGN:|/\\*\\*\\s*\\*/',
                flags: 'g',
                matches: [
                    { skill: 'writing-plans', reason: 'Planning comments detected' }
                ]
            },
            {
                pattern: 'interface\\s+\\w+|type\\s+\\w+\\s*=',
                flags: 'g',
                matches: [
                    { skill: 'brainstorming', reason: 'Type definitions suggest design phase' }
                ]
            },
            // Git patterns
            {
                pattern: 'git\\s+checkout|git\\s+branch|git\\s+merge',
                flags: 'g',
                matches: [
                    { skill: 'using-git-worktrees', reason: 'Git operations detected' }
                ]
            },
            // Review patterns
            {
                pattern: 'review|refactor|optimize',
                flags: 'gi', // Case insensitive
                matches: [
                    { skill: 'requesting-code-review', reason: 'Review keywords detected' }
                ]
            },
            // Async/concurrency patterns
            {
                pattern: 'async\\s+|await\\s+|Promise\\.|\\.then\\(',
                flags: 'g',
                matches: [
                    { skill: 'systematic-debugging', reason: 'Async code can have subtle bugs - systematic debugging helps' }
                ]
            },
            // API patterns
            {
                pattern: 'fetch\\(|axios\\.|\\.get\\(|\\.post\\(',
                flags: 'g',
                matches: [
                    { skill: 'systematic-debugging', reason: 'API calls benefit from error handling review' }
                ]
            }
        ];
        // Language-specific suggestions
        this.languageSkills = new Map([
            ['javascript', ['test-driven-development', 'systematic-debugging']],
            ['typescript', ['test-driven-development', 'systematic-debugging', 'brainstorming']],
            ['python', ['test-driven-development', 'systematic-debugging']],
            ['go', ['test-driven-development', 'systematic-debugging']],
            ['rust', ['test-driven-development', 'systematic-debugging']]
        ]);
    }
    async suggestForContext(code, language) {
        const suggestions = new Map();
        // Pattern-based suggestions - create fresh RegExp each time to avoid state issues
        for (const def of this.patternDefinitions) {
            // Create a new RegExp instance for each check to avoid lastIndex pollution
            const regex = new RegExp(def.pattern, def.flags);
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
        const validSuggestions = [];
        for (const [, suggestion] of suggestions) {
            const skill = this.skillsManager.getSkill(suggestion.skillName);
            if (skill) {
                validSuggestions.push(suggestion);
            }
        }
        // Sort by confidence (highest first)
        return validSuggestions.sort((a, b) => b.confidence - a.confidence);
    }
    analyzeFileContext(code) {
        const suggestions = [];
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
        // Check for error handling
        const hasTryCatch = code.includes('try {') || code.includes('catch (');
        const hasAsync = code.includes('async ') || code.includes('await ');
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
exports.SkillSuggester = SkillSuggester;
//# sourceMappingURL=suggester.js.map