# Superpowers for Pi

Complete guide for using Superpowers with [Pi](https://github.com/earendil-works/pi-mono).

## Installation

Install the package from this repository:

```bash
pi install git:github.com/obra/superpowers
```

Start a fresh Pi session. The extension loads automatically; skills are
discoverable and the bootstrap context is injected at the start of each session.

Verify by asking: "Tell me about your superpowers"

Pi uses its own package install. If you also use Claude Code, Codex, or another
harness, install Superpowers separately for each one.

For local development, run Pi with this checkout loaded as a temporary package:

```bash
pi -e /path/to/superpowers
```

## How It Works

The Pi package does two things:

1. **Bootstraps superpowers context** via a Pi extension module at
   `.pi/extensions/superpowers.ts`. The extension hooks `context` to inject
   the `using-superpowers` skill body once per session (and again after session
   compaction). The bootstrap fires before the first LLM call in each session
   so every conversation starts with full superpowers awareness.

2. **Registers all skills** via the `resources_discover` event, which exposes
   the `skills/` directory so Pi's native skill system discovers all
   Superpowers skills (`brainstorming`, `systematic-debugging`, etc.)
   automatically.

The extension is loaded through the `"pi"` key in `package.json`:

```json
{
  "pi": {
    "extensions": ["./.pi/extensions/superpowers.ts"],
    "skills": ["./skills"]
  }
}
```

Oh My Pi (OMP) falls back to this same `"pi"` key when `"omp"` is absent, so
the extension also loads under OMP.

## Tool Mapping

Skills describe actions rather than hard-coding one runtime's tools. On Pi
these resolve to:

- "Read a file" → `read`
- "Create a file" / "edit a file" → `write`, `edit`
- "Run a shell command" → `bash`
- "Search file contents" → `grep`
- "Find files by path or pattern" → `find`
- "Invoke a skill" → load the relevant `SKILL.md` with `read`, or use
  Pi's `/skill:name` command
- "Dispatch a subagent" → use `subagent` from `pi-subagents` if installed;
  otherwise work in-session or describe the missing capability
- "Create a todo" / "track tasks" → use an installed todo tool if available,
  or track work in a plan file or repo-local `TODO.md`

## Updating

Pi installs Superpowers as a cloned git package. To update to the latest
commit:

```bash
pi update superpowers
```

To pin a specific version, install by ref:

```bash
pi install git:github.com/obra/superpowers@v5.1.0
```

## Troubleshooting

### Plugin not loading

1. Test the extension directly: `pi -e ./.pi/extensions/superpowers.ts`
2. Run `pi list` to confirm the package is installed
3. Make sure you are running a recent version of Pi

### Skills not found

1. Run `pi list` and confirm the package shows skill entries
2. Verify `skills/brainstorming/SKILL.md` exists in the installed clone
3. Try loading a skill explicitly: `/skill:brainstorming`

### Bootstrap not appearing

1. Open a fresh session (not a resumed one)
2. The bootstrap is injected silently before your first prompt response
3. Try the acceptance prompt: `Let's make a react todo list` — a working
   install loads `brainstorming` before writing any code

### OMP compatibility

Install via OMP marketplace instead:

```bash
/marketplace add obra/superpowers
/marketplace install superpowers@superpowers-dev
```

OMP reads the same `"pi"` extension key from `package.json`.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
- Pi repository: https://github.com/earendil-works/pi-mono
