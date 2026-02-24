#!/usr/bin/env node
const fs = require('fs');

// BeforeTool hook: intercepts tool calls to inject Superpowers skills
// that trigger on agent *behavior* rather than user phrases.
//
// Examples:
// - Agent about to run `git commit` or `git push` → inject verification-before-completion
// - Agent about to run `git merge` or create a PR → inject finishing-a-development-branch

try {
    const input = JSON.parse(fs.readFileSync(0, 'utf-8'));

    const toolName = input.toolName || input.tool?.name || "";
    const toolArgs = input.toolArgs || input.tool?.args || {};
    const argsStr = JSON.stringify(toolArgs).toLowerCase();

    // ─── Verification Before Completion ───────────────────────────────
    // If the agent is about to commit, push, or claim "done", remind it
    // to verify first.
    const commitPatterns = [
        /git\s+commit/i,
        /git\s+push/i,
    ];

    const isCommitAction = commitPatterns.some(p => p.test(argsStr));
    const isShellTool = /^(run_command|shell|bash|execute)$/i.test(toolName);

    if (isShellTool && isCommitAction) {
        console.error(`[Superpowers BeforeTool] Detected commit/push — injecting verification reminder`);
        console.log(JSON.stringify({
            continue: true,
            systemMessage: `STOP. Before committing or pushing, you MUST verify your work is complete and correct. If you have not already activated the "verification-before-completion" skill, call activate_skill("verification-before-completion") NOW and follow its checklist before proceeding with this commit.`
        }));
        process.exit(0);
    }

    // ─── Finishing a Development Branch ───────────────────────────────
    const mergePatterns = [
        /git\s+merge/i,
        /gh\s+pr\s+create/i,
        /git\s+push.*--set-upstream/i,
    ];

    const isMergeAction = mergePatterns.some(p => p.test(argsStr));

    if (isShellTool && isMergeAction) {
        console.error(`[Superpowers BeforeTool] Detected merge/PR — injecting finishing-branch reminder`);
        console.log(JSON.stringify({
            continue: true,
            systemMessage: `STOP. Before merging or creating a PR, you MUST follow the branch completion workflow. If you have not already activated the "finishing-a-development-branch" skill, call activate_skill("finishing-a-development-branch") NOW and follow its structured options before proceeding.`
        }));
        process.exit(0);
    }

    // No match: pass through
    console.log(JSON.stringify({ continue: true }));

} catch (error) {
    console.error(`[Superpowers BeforeTool Error] ${error.message}`);
    console.log(JSON.stringify({ continue: true }));
}
