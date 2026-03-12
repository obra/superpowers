import { SkillsManager } from './manager';

export interface SkillSuggestion {
    skillName: string;
    reason: string;
    confidence: number;
}

interface PatternDefinition {
    pattern: string;
    flags: string;
    matches: { skill: string; reason: string }[];
}

export class SkillSuggester {
    private readonly patternDefinitions: PatternDefinition[] = [
        { pattern: 'describe\\s*\\(|it\\s*\\(|test\\s*\\(', flags: 'g', matches: [{ skill: 'test-driven-development', reason: 'Test file detected' }] },
        { pattern: 'Error:|Exception:|throw new', flags: 'g', matches: [{ skill: 'systematic-debugging', reason: 'Error patterns detected' }] },
        { pattern: 'console\\.log|console\\.error|debugger', flags: 'g', matches: [{ skill: 'systematic-debugging', reason: 'Debug statements found' }] },
        { pattern: 'TODO:|FIXME:|BUG:', flags: 'g', matches: [{ skill: 'systematic-debugging', reason: 'Issue markers detected' }] },
        { pattern: 'interface\\s+\\w+|type\\s+\\w+\\s*=', flags: 'g', matches: [{ skill: 'brainstorming', reason: 'Type definitions suggest design phase' }] },
        { pattern: 'review|refactor|optimize', flags: 'gi', matches: [{ skill: 'requesting-code-review', reason: 'Review keywords detected' }] },
        { pattern: 'async\\s+|await\\s+|Promise\\.', flags: 'g', matches: [{ skill: 'systematic-debugging', reason: 'Async code patterns' }] },
        { pattern: 'fetch\\(|axios\\.', flags: 'g', matches: [{ skill: 'systematic-debugging', reason: 'API calls detected' }] },
    ];

    private readonly languageSkills: Map<string, string[]> = new Map([
        ['javascript', ['test-driven-development', 'systematic-debugging']],
        ['typescript', ['test-driven-development', 'systematic-debugging', 'brainstorming']],
        ['python', ['test-driven-development', 'systematic-debugging']],
        ['go', ['test-driven-development', 'systematic-debugging']],
        ['rust', ['test-driven-development', 'systematic-debugging']]
    ]);

    constructor(private skillsManager: SkillsManager) {}

    async suggestForContext(code: string, language: string): Promise<SkillSuggestion[]> {
        const suggestions: Map<string, SkillSuggestion> = new Map();

        for (const def of this.patternDefinitions) {
            const regex = new RegExp(def.pattern, def.flags);
            if (regex.test(code)) {
                for (const match of def.matches) {
                    if (!suggestions.has(match.skill)) {
                        suggestions.set(match.skill, { skillName: match.skill, reason: match.reason, confidence: 0.7 });
                    }
                }
            }
        }

        const langSkills = this.languageSkills.get(language) || [];
        for (const skillName of langSkills) {
            if (!suggestions.has(skillName)) {
                suggestions.set(skillName, { skillName, reason: `Commonly used with ${language}`, confidence: 0.4 });
            }
        }

        const validSuggestions: SkillSuggestion[] = [];
        for (const [, suggestion] of suggestions) {
            if (this.skillsManager.getSkill(suggestion.skillName)) {
                validSuggestions.push(suggestion);
            }
        }

        return validSuggestions.sort((a, b) => b.confidence - a.confidence);
    }
}