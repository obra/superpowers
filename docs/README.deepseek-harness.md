# DeepSeek Harness (dsh) support

Superpowers skills work on the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`). The harness ships a native `skill` tool and a `ctx.skills` provider registry, so all 14 skills — `brainstorming`, `test-driven-development`, `verification-before-completion`, etc. — are loadable as-is without rewriting a single `SKILL.md`.

## What this adds

This directory contains a `.dsh-plugin/plugin.json` manifest that opts the superpowers repo into dsh's plugin discovery. Pair it with one of the two install paths below and every skill becomes available in any dsh session.

## Install

The harness has two ways to discover skills. Pick whichever fits your setup.

### Path A — `customSkillDirs` (lowest friction)

Add this to your dsh profile's `cordis.yml` (or a `--patch` overlay):

```yaml
- id: skill-filesystem
  config:
    customSkillDirs:
      - /absolute/path/to/superpowers/skills
```

Restart dsh. The 14 superpowers skills now appear in the model-facing catalog under rank 300 (`custom`). No build step. No code change.

### Path B — custom `ctx.skills` provider (cleaner long-term)

If you have packaged the superpowers repo as a Cordis plugin and want it to register skills under a fork-owned provider name (e.g. `superpowers-fork`), see the reference implementation in the [JFWaskin/superpowers-safe](https://github.com/JFWaskin/superpowers-safe) fork's `fork/deepseek-harness-bridge/` directory. Upstream does not currently ship that plugin — it lives in the fork while we gauge interest.

## How user-invocation works

The dsh harness recognizes a whitespace-bounded `/<name>` token in user messages and injects the matching skill's full content as a user-role context. The grammar is `/(^|\s)\/([a-z0-9]+(?:-[a-z0-9]+)*)(?=\s|$)/g` and all 14 superpowers skill names are kebab-case, so every skill is invocable:

- `/brainstorming` — load the brainstorming skill, then follow it
- `/test-driven-development` — load TDD
- `/verification-before-completion` — load the verification skill before claiming done

Tokens that don't match the kebab-case grammar (file paths like `/usr/bin/ls`, fractions like `5/8`, names with uppercase or underscores) are treated as ordinary prose.

## What this does not cover

- **Hook `SessionEnd`** — the dsh-hooks-claude-code bridge does not map Claude Code's `SessionEnd` event. No superpowers skill depends on it, so this is not a current gap. If a future skill does, write a native Cordis plugin on `agent/turn-end` / `session/dispose`.
- **Bash `Bash(...)` permission rules** — dsh uses a generic JSON policy in `dsh-sandbox-policy` / `dsh-approval` rows, not the `Bash(...)` syntax Claude Code uses. Rule semantics differ; do not attempt silent auto-translation. Author the equivalent rules by hand in your dsh profile if you need them.
- **A `references/deepseek-harness-tools.md` mapping** — the harness exposes a native tool for every action named by the skills, so no tool-mapping file is needed. (See the brainstorming acceptance transcript in #2144 for a real session that confirms this.)

## Acceptance check

In a clean dsh session, the user message

> Let's make a react todo list

should cause the agent to load the `brainstorming` skill **before any code is written**. If you do not see the `<available_skills>` block in the system prompt, the discovery path is not wired correctly — check the `customSkillDirs` value in your profile's `cordis.yml`.

## Companion work

- **Prerequisite analysis** (closed §8 open questions in Appendix C): [`docs/upstream/deepseek-harness-analysis.md`](../upstream/deepseek-harness-analysis.md) in the JFWaskin/superpowers-safe fork.
- **Reference bridge** (Cordis plugin + cordis.yml overlay + Claude-Code-shaped `hooks.json`): [`fork/deepseek-harness-bridge/`](https://github.com/JFWaskin/superpowers-safe/tree/main/fork/deepseek-harness-bridge) in the same fork.
- **Ask-issue** (the conversation that led to this PR): #2152.
- **Sibling implementation** (more complete — `dsh.bundle` field + actual plugin file): #2144.
