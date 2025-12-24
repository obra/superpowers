# Using Codex native skills support with Superpowers

With the introduction of native support for skills in codex (https://github.com/
  openai/codex/blob/main/docs/skills.md), we don't have to use legacy superpowers hook.

# Steps to update from legacy installation
1) Directory: put skills under `~/.codex/skills` (one folder per skill with `SKILL.md`).
2) Enable feature: add to `~/.codex/config.toml`:
   ```toml
   [features]
   skills = true
   ```
3) Restart Codex CLI fully, then start a new session. A “## Skills” block should list the skills from `~/.codex/skills`.

Notes
- Hooks: Codex does not load `~/.codex/hooks/hooks.json`; the native skills system handles discovery. You can keep `session-start.sh` if you want custom messaging, but it isn’t required for skills.
- Legacy superpowers: old path `~/.config/superpowers/skills` is ignored; move anything useful into `~/.codex/skills`.
