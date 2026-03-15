# Universal Agent Capabilities

Superpowers workflows are platform-agnostic. They rely on "Capabilities" rather than hard-coded tool names. When a skill instructs you to use a Capability, you must identify and use your platform's native equivalent.

## 1. Task Tracker
**Purpose:** Create, manage, and update a checklist of tasks during multi-step implementations or plan executions.
**Platform Equivalents:**
- **Claude Code:** The `TodoWrite` tool.
- **OpenCode:** The `todowrite` tool.
- **Generic Agents:** Create and maintain a markdown file (e.g., `task.md` or `plan.md`) in your working directory and use your native file-editing capabilities to check off items (`[x]`).

## 2. Subagent Dispatcher
**Purpose:** Delegate independent tasks to specialized subagents with fresh, isolated contexts.
**Platform Equivalents:**
- **Claude Code:** The `Task` tool (e.g., dispatching a specific subagent archetype).
- **OpenCode / Cursor:** Native agent mentions (e.g., `@agent`) or native subagent chat delegation.
- **Generic Agents:** Use native multi-agent or asynchronous workflow tools. If your platform has no subagents, execute the task sequentially in your current session using your standard tools.

## 3. Skill Loader
**Purpose:** Discover, load, and activate skill instructions into the current session context.
**Platform Equivalents:**
- **Claude Code:** The `Skill` tool.
- **Gemini CLI:** The `activate_skill` tool.
- **OpenCode:** The `skill` tool.
- **Generic Agents:** Read the `SKILL.md` file from the repository's `skills/` directory using standard file reading capabilities (e.g., `view_file` or `cat`).

## 4. Visual Companion
**Purpose:** Provide visual feedback, mockups, or diagrams to the user in a browser natively.
**Platform Equivalents:**
- **Generic Agents:** A browser subagent, local localhost server rendering, or web-based companion tool.

## 5. Shell Executor
**Purpose:** Execute commands continuously during development.
**Platform Equivalents:**
- **Generic Agents:** Use standard bash, external terminal, or `run_command` tools.
