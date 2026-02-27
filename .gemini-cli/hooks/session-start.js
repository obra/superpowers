#!/usr/bin/env node

/**
 * Superpowers SessionStart Hook for Gemini CLI
 *
 * This hook initializes Superpowers when Gemini CLI starts.
 * Skills are auto-discovered by Gemini CLI from the skills/ directory.
 *
 * Exit codes:
 * 0 = Success
 * 1 = Non-blocking warning
 * 2 = Blocking error (prevents session start)
 */

async function main() {
  try {
    // Ensure we have the extension path
    const extensionPath = process.env.EXTENSION_PATH;
    if (!extensionPath) {
      console.error('Warning: EXTENSION_PATH not set');
      process.exit(0); // Don't block on missing env var
    }

    // Superpowers metadata
    const skills = [
      'brainstorming',
      'dispatching-parallel-agents',
      'executing-plans',
      'finishing-a-development-branch',
      'receiving-code-review',
      'requesting-code-review',
      'subagent-driven-development',
      'systematic-debugging',
      'test-driven-development',
      'using-git-worktrees',
      'using-superpowers',
      'verification-before-completion',
      'writing-plans',
      'writing-skills'
    ];

    // Output status
    const output = {
      systemMessage: '✨ Superpowers initialized with ' + skills.length + ' skills available',
      metadata: {
        status: 'ready',
        superpowers_version: '4.3.1',
        skills_count: skills.length,
        skills: skills,
        philosophy: 'Test-Driven Development, Systematic over ad-hoc, Evidence over claims'
      }
    };

    console.log(JSON.stringify(output));
    process.exit(0);

  } catch (error) {
    // Log error but don't block session
    console.error('Warning: Superpowers initialization encountered an issue');
    console.error(error.message);
    process.exit(0); // Still exit 0 to not block
  }
}

main();
