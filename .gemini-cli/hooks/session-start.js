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

    const fs = require('fs');
    const path = require('path');

    // Find the skills directory relative to this script
    const skillsDir = path.resolve(__dirname, '../skills');
    let skills = [];

    try {
      if (fs.existsSync(skillsDir)) {
        skills = fs.readdirSync(skillsDir).filter(file => {
          const isDir = fs.statSync(path.join(skillsDir, file)).isDirectory();
          const hasSkillMd = fs.existsSync(path.join(skillsDir, file, 'SKILL.md'));
          return isDir && hasSkillMd;
        });
      }
    } catch (e) {
      console.error('Warning: Could not read skills directory:', e.message);
    }

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
