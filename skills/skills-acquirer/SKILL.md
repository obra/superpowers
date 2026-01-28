---
name: skills-acquirer
description: Discover and install skills via npx skills using superpowers-codex search-skills/install-skill when the user asks to find, fetch, or add new skills.
---

# Skills Acquisition

Use the superpowers CLI to search and install skills via `npx skills`.

## Search

Run a search and present compact results:

```
superpowers-codex search-skills <query>
```

## Install

Install the requested skill repo/package and pass through any options:

```
superpowers-codex install-skill <owner/repo> --agent codex
```

## Notes

- If `npx` is missing, instruct the user to install Node.js.
- Prefer `--agent codex` and `-g` when installing global skills.
- Remind the user to restart Codex after installing skills.
