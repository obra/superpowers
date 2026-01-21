# Project Context: Superpowers

## Overview
**Superpowers** is a framework that provides a structured software development workflow for AI coding agents (Claude, Codex, OpenCode, Gemini). It forces agents to "step back" and use rigorous engineering practices—like TDD, systematic debugging, and detailed planning—instead of rushing to write code.

The core of the project is a collection of **Skills**, which are specialized prompt instructions that activate automatically or manually to guide the agent through specific tasks.

## Architecture

### 1. Skills (`skills/`)
The primary artifacts of this repository.
*   **Structure:** Each skill is a directory (e.g., `skills/brainstorming/`) containing a `SKILL.md` file.
*   **Format:** `SKILL.md` files use YAML frontmatter for metadata (`name`, `description`) followed by the instructional content.
*   **Core Skills:**
    *   `brainstorming`: Design refinement.
    *   `writing-plans`: creating implementation plans.
    *   `test-driven-development`: Enforcing Red/Green/Refactor.
    *   `systematic-debugging`: Root cause analysis.
    *   `subagent-driven-development`: Dispatching sub-agents for tasks.

### 2. Core Logic (`lib/skills-core.js`)
A Node.js library used by the environment plugins to:
*   Discover skills in the `skills/` directory.
*   Parse YAML frontmatter.
*   Resolve skill paths (handling "personal" vs "superpowers" namespacing).

### 3. Integrations
*   **Claude Code:** `.claude-plugin/` contains configuration for the Claude desktop plugin.
*   **OpenCode/Codex:** `.opencode/` and `.codex/` contain bootstrap instructions.
*   **Gemini:** `GEMINI.md` (this file) and `skills/using-superpowers` serve as the context anchor.

## Development Workflow

### Creating/Modifying Skills
Do not just edit the Markdown. Treat skills as code.
1.  **Reference:** Read `skills/writing-skills/SKILL.md` for best practices.
2.  **Format:** Ensure valid YAML frontmatter:
    ```markdown
    ---
    name: my-skill
    description: Use when [condition] - [benefit]
    ---
    ```
3.  **Testing:**
    *   Use the scripts in `tests/` to verify skill activation and behavior.
    *   `tests/explicit-skill-requests/` contains prompts to test if skills trigger correctly.

### Testing The Framework
*   **Skill Loading:** `tests/opencode/test-skills-core.sh` tests the logic in `lib/skills-core.js`.
*   **Integration:** `tests/claude-code/` contains integration tests for the Claude environment.

## Key Conventions
*   **Philosophy:** The project values "Systematic over ad-hoc" and "Test-Driven Development". When acting as an agent in this repo, **you must** adhere to these principles yourself.
*   **Frontmatter:** All `SKILL.md` files must have `name` and `description` fields.
*   **Immutability:** Do not modify the `lib/` core logic unless fixing a bug in the skill loading mechanism itself. Most work happens in `skills/`.

## Usage
To use a skill manually during development or testing:
*   Reference the skill by name (e.g., "Use the `brainstorming` skill").
*   The system uses `lib/skills-core.js` to locate the corresponding `SKILL.md` and load it into the context.
