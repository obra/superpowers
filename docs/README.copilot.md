# Superpowers for GitHub Copilot

### Quick install

1. Install the GitHub Copilot extension in VS Code or VS Code Insiders.
2. Clone the repository and set up the agent skills (see `.copilot/INSTALL.md`).
3. Restart VS Code and open a new Copilot Chat session.

### Why this works

Copilot Chat loads user plugins from the `~/.agents/skills` directory just like
other agents such as Codex or Claude Code.  By creating a symlink from your
local clone into that directory Copilot will automatically pick up the
superpowers skills on startup.

A small wrapper plugin (published via the public marketplace) provides the
optional `/plugin` commands; if you prefer you can simply skip that step and
rely on the symlink alone.

### Usage

Once installed you can ask Copilot to do anything the skills support.  For
example:

> Generate a unit test for a function that reverses a string in Go.

The conversation will be routed through the `brainstorming` skill first, then
the implementation plan will be followed and new tests/code committed to your
workspace if you run inside an environment that supports the `Bash` and `Write`
tools.
