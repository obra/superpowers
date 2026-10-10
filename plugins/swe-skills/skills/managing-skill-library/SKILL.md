---
name: managing-skill-library
description: Use when you need to discover, read, or modify already-installed skills - listing what skills exist, reading a skill's content, patching one (adding a subsection, pitfall, or broadened trigger), or adding a support file. Operates on the global Claude-compatible skills directory.
---

# Managing the Skill Library

## Overview

The installed skill library lives in a global, Claude-compatible directory shared across harnesses. This skill is the umbrella for the **mechanics** of working with that library: scanning what already exists, reading a skill, and making safe, surgical patches. Authoring brand-new skills with full RED→GREEN testing is covered by superpowers:writing-skills — use that for creation discipline; use this for finding and editing what's already there.

## Where Skills Live

Global Claude-compatible skills directory:

- `~/.claude/skills/<name>/SKILL.md` — primary location, read by Claude Code and OpenCode.

Each skill is a directory whose `SKILL.md` holds YAML frontmatter (`name`, `description`) plus a markdown body, optionally accompanied by `references/`, `templates/`, and `scripts/` support files in the same directory.

## Tool Mapping

Use whatever general tools your harness provides — this skill names no harness-specific tools:

| Action | General tool |
|---|---|
| Scan / list installed skills | Glob or list `~/.claude/skills/*/SKILL.md` |
| Read a skill | Read its `SKILL.md` |
| Create a skill or support file | Write the file at its path |
| Patch a skill | Edit the relevant section of `SKILL.md` |

## Scan the Library FIRST

Before creating anything new, **scan the global skills directory** to see what already exists — you can usually extend an existing skill instead of spawning a near-duplicate.

1. List skill directories: `~/.claude/skills/*/`.
2. Read the `SKILL.md` of any candidate whose name or description overlaps the territory you're about to cover.
3. Decide: patch an existing skill (preferred) or, only if nothing fits, create a new one.

## Patch an Existing Skill (Preferred Over Creating)

When an existing skill covers the area, extend it rather than duplicating:

- **Add a subsection** under the relevant heading.
- **Add a row** to a pitfalls / Common Mistakes table.
- **Broaden the `description` trigger** so the skill fires in the newly-discovered situation.
- **Add a support file** and a one-line pointer to it from `SKILL.md`.

Keep patches surgical: read the whole `SKILL.md` first, then match its existing voice, headings, and density. Do not rewrite a skill's tone while patching it.

## Support File Kinds

| Directory | Holds |
|---|---|
| `references/<topic>.md` | Session-specific detail, provider quirks, condensed external docs |
| `templates/<name>` | Copy-and-modify starters (boilerplate, scaffolding) |
| `scripts/<name>` | Re-runnable actions (verification probes, generators) |

Always add a one-line pointer from the umbrella's `SKILL.md` to any new support file so future agents know it exists.

## Common Mistakes

| Mistake | Reality |
|---|---|
| Creating a new skill without scanning first | You may be duplicating an existing umbrella. List the directory first. |
| Editing a section without reading the full skill | Your patch won't fit the structure. Read the whole `SKILL.md` first. |
| Rewriting the skill's voice while patching | Match existing tone, headings, and density. Patch surgically. |
| Adding a support file with no pointer | An orphaned file is invisible. Add a one-line pointer in `SKILL.md`. |
