# Visual Companion Skill-Relative Script Paths Design

## Problem

Issue #1134 reports that agents often fail to start the brainstorming visual companion because `visual-companion.md` shows commands like:

```bash
scripts/start-server.sh --project-dir /path/to/project
```

The guide lives in `skills/brainstorming/visual-companion.md`, so `scripts/` is intended to mean `skills/brainstorming/scripts/`. In real Claude Code sessions, agents have interpreted it as the plugin root's top-level `scripts/` directory, tried paths such as `superpowers/5.0.7/scripts/start-server.sh`, then concluded the visual companion is unavailable.

PR #1264 tried to fix this by hardcoding `${CLAUDE_PLUGIN_ROOT}/skills/brainstorming/scripts/...`, but maintainers rejected that because `CLAUDE_PLUGIN_ROOT` is Anthropic-specific. Skill collateral must remain relative to the skill directory.

## Goals

- Make all visual companion launch examples unambiguously relative to the brainstorming skill directory.
- Avoid harness-specific environment variables such as `CLAUDE_PLUGIN_ROOT`.
- Preserve the existing `skills/brainstorming/scripts/` layout.
- Keep examples copyable after the agent fills in the skill directory path.

## Non-Goals

- Do not add a top-level `scripts/start-server.sh` wrapper.
- Do not move visual companion scripts.
- Do not change server behavior.
- Do not add new harness support.

## Design

At the start of "Starting a Session", define a platform-neutral placeholder:

```bash
SKILL_DIR=<directory containing this visual-companion.md file>
```

Then rewrite launch and cleanup examples to use:

```bash
"$SKILL_DIR/scripts/start-server.sh" --project-dir /path/to/project
"$SKILL_DIR/scripts/stop-server.sh" "$SESSION_DIR"
```

This keeps collateral skill-relative, satisfies the maintainer feedback on #1264, and removes the ambiguous bare `scripts/` command prefix that caused #1134.

## Test Strategy

Add a static test for `skills/brainstorming/visual-companion.md` that checks:

- the guide defines `SKILL_DIR` as the directory containing `visual-companion.md`
- launch examples use `"$SKILL_DIR/scripts/start-server.sh"`
- cleanup examples use `"$SKILL_DIR/scripts/stop-server.sh"`
- the guide does not use `${CLAUDE_PLUGIN_ROOT}`
- the guide does not contain bare `scripts/start-server.sh` command examples
