#!/usr/bin/env node
const fs = require('fs');

try {
    // Read stdin JSON provided by Gemini CLI
    const input = JSON.parse(fs.readFileSync(0, 'utf-8'));

    // Extract user prompt
    const userPrompt = input.turn?.userMessage?.content || input.prompt || "";

    if (!userPrompt) {
        console.log(JSON.stringify({ continue: true }));
        process.exit(0);
    }

    // ─── Deterministic Triggers ───────────────────────────────────────────
    // These patterns guarantee a specific skill is activated.
    // Order matters: first match wins.
    const triggers = [
        // Brainstorming — any creative/building intent
        { pattern: /let'?s (build|make|create|design|implement|add|write)/i, skill: 'brainstorming' },
        { pattern: /brainstorm/i, skill: 'brainstorming' },
        { pattern: /^(build|make|create|design|implement) /i, skill: 'brainstorming' },
        { pattern: /(new feature|add a |add an |new component|new page|new app)/i, skill: 'brainstorming' },

        // Planning
        { pattern: /write.*plan/i, skill: 'writing-plans' },
        { pattern: /break.*down/i, skill: 'writing-plans' },
        { pattern: /implementation plan/i, skill: 'writing-plans' },

        // Debugging
        { pattern: /(debug|fix|diagnose|troubleshoot)/i, skill: 'systematic-debugging' },
        { pattern: /(bug|error|broken|failing|crash)/i, skill: 'systematic-debugging' },

        // TDD
        { pattern: /test.?driven/i, skill: 'test-driven-development' },
        { pattern: /\btdd\b/i, skill: 'test-driven-development' },
        { pattern: /write.*tests? first/i, skill: 'test-driven-development' },

        // Code review
        { pattern: /review.*code/i, skill: 'requesting-code-review' },
        { pattern: /code.*review/i, skill: 'requesting-code-review' },
        { pattern: /review.*feedback/i, skill: 'receiving-code-review' },
        { pattern: /address.*review/i, skill: 'receiving-code-review' },
        { pattern: /respond.*review/i, skill: 'receiving-code-review' },

        // Parallel agents
        { pattern: /parallel.*agent/i, skill: 'dispatching-parallel-agents' },
        { pattern: /dispatch.*agent/i, skill: 'dispatching-parallel-agents' },

        // Git worktrees
        { pattern: /git.*worktree/i, skill: 'using-git-worktrees' },
        { pattern: /worktree/i, skill: 'using-git-worktrees' },

        // Subagent-driven development
        { pattern: /subagent/i, skill: 'subagent-driven-development' },

        // Executing plans
        { pattern: /execute.*plan/i, skill: 'executing-plans' },
        { pattern: /run.*plan/i, skill: 'executing-plans' },

        // Finishing branches
        { pattern: /(merge|finish|wrap up).*branch/i, skill: 'finishing-a-development-branch' },
        { pattern: /create.*pr\b/i, skill: 'finishing-a-development-branch' },
        { pattern: /pull request/i, skill: 'finishing-a-development-branch' },

        // Verification
        { pattern: /verify.*complete/i, skill: 'verification-before-completion' },
        { pattern: /check.*work/i, skill: 'verification-before-completion' },

        // Writing skills (meta)
        { pattern: /write.*skill/i, skill: 'writing-skills' },
        { pattern: /create.*skill/i, skill: 'writing-skills' },
    ];

    let matchedSkill = null;
    for (const trigger of triggers) {
        if (trigger.pattern.test(userPrompt)) {
            matchedSkill = trigger.skill;
            break;
        }
    }

    if (matchedSkill) {
        // ─── Deterministic Match ──────────────────────────────────────────
        console.error(`[Superpowers Router] Matched skill "${matchedSkill}"`);
        console.log(JSON.stringify({
            continue: true,
            systemMessage: `User request matches the "${matchedSkill}" superpower. You MUST activate it now. Call the activate_skill tool with name="${matchedSkill}". Follow its workflow exactly. Do not proceed until you have activated this skill.`,
            suppressOutput: true
        }));
        process.exit(0);
    }

    // ─── Always-On Gateway (no match fallback) ──────────────────────────
    // This replicates the "using-superpowers" behavior from Claude Code:
    // every prompt gets a reminder to check skills before responding.
    console.error(`[Superpowers Router] No direct match — injecting gateway reminder`);
    console.log(JSON.stringify({
        continue: true,
        systemMessage: `You have Superpowers skills installed. Before responding, check if any installed skill applies to this task. Run /skills list mentally and if ANY skill is even 1% relevant, you MUST call the activate_skill tool with that skill's name before proceeding. Prioritize: brainstorming (for new features/apps/components), systematic-debugging (for bugs/errors), test-driven-development (for implementation), writing-plans (for multi-step work). If no skill applies, proceed normally.`
    }));

} catch (error) {
    console.error(`[Superpowers Router Error] ${error.message}`);
    console.log(JSON.stringify({ continue: true }));
}
