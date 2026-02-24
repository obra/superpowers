#!/usr/bin/env node
const fs = require('fs');

try {
    // Read stdin JSON provided by Gemini CLI
    const input = JSON.parse(fs.readFileSync(0, 'utf-8'));

    // Extract user prompt. Depending on exact schema, it might be in turn.userMessage.content
    const userPrompt = input.turn?.userMessage?.content || input.prompt || "";

    if (!userPrompt) {
        console.log(JSON.stringify({ continue: true }));
        process.exit(0);
    }

    // Generalized pattern marching for core Superpowers skills
    const triggers = [
        { pattern: /let\'s (build|make|create|design)/i, skill: 'brainstorming' },
        { pattern: /brainstorm/i, skill: 'brainstorming' },
        { pattern: /write.*plan/i, skill: 'writing-plans' },
        { pattern: /break.*down/i, skill: 'writing-plans' },
        { pattern: /(debug|fix).*bug/i, skill: 'systematic-debugging' },
        { pattern: /test.*driven/i, skill: 'test-driven-development' },
        { pattern: /\btdd\b/i, skill: 'test-driven-development' },
        { pattern: /review.*code/i, skill: 'requesting-code-review' },
        { pattern: /parallel.*agent/i, skill: 'dispatching-parallel-agents' },
        { pattern: /git.*worktree/i, skill: 'using-git-worktrees' },
        { pattern: /subagent.*driven/i, skill: 'subagent-driven-development' },
        { pattern: /execute.*plan/i, skill: 'executing-plans' }
    ];

    let matchedSkill = null;
    for (const trigger of triggers) {
        if (trigger.pattern.test(userPrompt)) {
            matchedSkill = trigger.skill;
            break;
        }
    }

    if (matchedSkill) {
        // Deterministic: Force activation via injected system message
        console.error(`[Superpowers Router] Matched pattern for skill "${matchedSkill}"`);
        console.log(JSON.stringify({
            continue: true,
            systemMessage: `User request matches the "${matchedSkill}" superpower. You MUST activate it now. Call the activate_skill tool with name="${matchedSkill}". Follow its workflow exactly. Do not proceed until you have activated this skill.`,
            suppressOutput: true
        }));
        process.exit(0);
    }

    // No match: pass through normally
    console.log(JSON.stringify({ continue: true }));

} catch (error) {
    // On any error, log to stderr and allow the CLI to continue normally
    console.error(`[Superpowers Router Error] ${error.message}`);
    console.log(JSON.stringify({ continue: true }));
}
