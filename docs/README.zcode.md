# Superpowers for ZCode

Superpowers ships as a first-class ZCode plugin: the full skills library plus
a session-start hook that injects the `using-superpowers` bootstrap into every
new session — no per-session opt-in.

## Install

1. Open ZCode.
2. Go to `Settings` > `Plugins`.
3. Add a marketplace source and point it at this repository:

   ```text
   https://github.com/obra/superpowers
   ```

4. Install the Superpowers plugin and restart ZCode.

## How it works

- `.zcode-plugin/plugin.json` declares the plugin: identity metadata, the
  bundled `skills/` directory, and the hook config at
  `hooks/hooks-zcode.json`.
- The hook runs on every `SessionStart` event. It dispatches through the
  shared cross-platform polyglot wrapper (`hooks/run-hook.cmd`) into
  `hooks/session-start`, which prints ZCode's native JSON shape:

  ```json
  {"hookEventName": "SessionStart", "additionalContext": "<bootstrap>"}
  ```

- ZCode merges that context before the first model request, so skills exist,
  are discoverable, and auto-trigger by their descriptions. Skills use
  ZCode's native skill system; subagents map to ZCode's built-in agent types.

## Requirements

- **Windows:** Git Bash must be installed (the standard Git for Windows
  location or `bash` on `PATH`). Without it the hook exits silently — ZCode
  still works, but sessions don't get the bootstrap injected.
- **Linux/macOS:** no extra requirements; `bash` is used directly.

## Verify it works

1. Start a new session and ask:

   > What are your superpowers?

   The agent should describe its skills. If not, the bootstrap isn't loading
   — see Troubleshooting.

2. In a clean workspace, send exactly:

   > Let's make a react todo list

   A working install triggers the `brainstorming` skill *before* any code is
   written.

## Local development

To test a checkout of this repository instead of a published build, add the
local directory itself as the marketplace source in `Settings` > `Plugins`,
then reinstall and restart after each change — the bootstrap loads at startup,
so changes don't apply to already-running sessions.

## Troubleshooting

- **Skills never trigger / agent doesn't know its superpowers:** confirm the
  plugin is enabled in `Settings` > `Plugins`, check that the Superpowers
  SessionStart hook appears in the hooks settings, and verify bash is
  reachable (see Requirements).
- **Hook shows an error in Settings:** make sure nothing modified
  `hooks/hooks-zcode.json`; reinstalling the plugin restores it.
- **Still stuck:** open an issue at
  [obra/superpowers/issues](https://github.com/obra/superpowers/issues) with
  your ZCode version, OS, and the output of asking "What are your
  superpowers?".
