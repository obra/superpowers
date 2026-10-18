# Porting Toolbelt to a New Harness

Toolbelt ships for Claude Code and Codex. This is the contract a third harness has to satisfy. `skills/` is harness-agnostic and does not change for a port. A port adds the layer that puts `using-toolbelt` in front of the model every session and maps the skills' actions to the harness's tool names. When this document and the code disagree, the code wins; fix the document.

## Requirements

The model must learn that skills exist every session, with no per-session step from your human partner. One of these must hold:

- **Injection.** A session-start hook or lifecycle callback writes into the model's context. Claude Code uses this.
- **Native discovery.** The harness scans a skills directory and surfaces each `description` at session start, and `using-toolbelt`'s description triggers the load. Codex uses this. It is weaker: nothing re-injects after compaction.

The harness also needs file read, write, and edit, shell commands, and a way to load a skill's full content (a skill tool, or reading `SKILL.md` with the file tool). Subagent dispatch, todo tracking, and web access are degradable; the skills carry fallback wording.

## The hook contract

`hooks/session-start` is the whole injection mechanism. It:

1. Derives the plugin root from its own path.
2. Reads `skills/using-toolbelt/SKILL.md` verbatim, frontmatter included.
3. Wraps it in `<TOOLBELT>`, with "You have a toolbelt." and a preamble saying all other skills load through the `Skill` tool.
4. JSON-escapes the result and prints exactly one shape, branching on `CLAUDE_PLUGIN_ROOT`.

Claude Code (`CLAUDE_PLUGIN_ROOT` set):

```json
{ "hookSpecificOutput": { "hookEventName": "SessionStart", "additionalContext": "…" } }
```

Everything else:

```json
{ "additionalContext": "…" }
```

Emitting both double-injects on Claude Code, and the wrong one injects nothing. `tests/hooks/test-session-start.sh` asserts both shapes. A new harness matches one shape or gets a third branch, ordered before the Claude Code branch if it also sets `CLAUDE_PLUGIN_ROOT`.

**Compaction.** `hooks/hooks.json` registers `SessionStart` with matcher `startup|clear|compact`, so the bootstrap returns after compaction. A harness without a compaction event re-injects on whatever follows summarization, or injects per turn with a guard that checks for the `TOOLBELT` marker. Inject a message as a user message, not a system message.

**No runtime dependencies.** The bootstrap is one bash script and a polyglot `hooks/run-hook.cmd` that also runs on Windows. Hook scripts are extensionless, because Claude Code on Windows prepends `bash` to any command containing `.sh`. Background is in `docs/windows/polyglot-hooks.md`.

**Install.** Discovery and injection ride the harness's own install mechanism. A port never writes into your human partner's global config. Register every new versioned manifest in `.version-bump.json` so `scripts/bump-version.sh` keeps it in step.

## Steps

1. Confirm the harness has a session-start event that writes to context, or native skill discovery. A hook system without that specific event does not count.
2. Add the manifest and point skill discovery at `skills/`. Confirm by asking a live session to list its skills.
3. Wire the bootstrap: a branch in `hooks/session-start`, or nothing if native discovery suffices. Codex's manifest carries `"hooks": {}`, because without it Codex falls back to `hooks/hooks.json` and registers the Claude Code hook.
4. Write `skills/using-toolbelt/references/<harness>-tools.md`, mapping every action a skill names to a real tool, in the shape of `references/codex-tools.md`. Take tool names from a live session, not memory. On a harness with no skill tool, say that reading `SKILL.md` is the loading mechanism. Fix gaps in the mapping, never in a skill body.
5. Extend `tests/hooks/test-session-start.sh` for a new output shape. For an in-process integration, fake the plugin API and assert the handlers register, the bootstrap injects once, the guard holds, and compaction re-injects.
6. Run the acceptance test.

## Acceptance test

Reinstall, then start a clean session and send exactly:

> Let's make a react todo list

`brainstorming` must auto-trigger before any code is written. If it does not, the bootstrap is not loading, and nothing else about the port is worth debugging. First ask the model which skills it has and how it loads one; if it cannot answer, injection or discovery is broken.

To drive a TUI harness, run it in a detached tmux session. Clear onboarding and trust prompts before typing. Send the prompt text and `Enter` as separate `send-keys` calls with a short pause, poll `capture-pane` in a loop, and `kill-session` when done.

To check that a forked harness honors a field it accepts, inject a unique nonsense token and confirm it reaches a fresh session without a tool call.
