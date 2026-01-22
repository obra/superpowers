# Superpowers for Gemini CLI

You have installed the **Superpowers** extension. This extension gives you access to a library of "skills" - specialized workflows for software engineering tasks like TDD, debugging, and planning.

## How it works

1.  **Auto-Bootstrap:** When you start a session, the "using-superpowers" skill is automatically loaded into your context.
2.  **Using Skills:** If you need to perform a specific task (e.g., "brainstorm a design", "debug a crash"), the Superpowers system will guide you to use the appropriate skill.
3.  **Commands:**
    - `superpowers-gemini install`: Shows installation instructions (for initial setup).
    - `superpowers-gemini find-skills`: Lists all available skills.
    - `superpowers-gemini use-skill <name>`: Loads a specific skill.

## Key Skills

- `brainstorming`: For refining ideas and requirements.
- `writing-plans`: For creating detailed implementation plans.
- `test-driven-development`: For implementing code with TDD.
- `systematic-debugging`: For finding root causes of bugs.
- `subagent-driven-development`: For breaking down complex tasks.

**Remember:** If a skill applies to your current task, you are expected to use it.
