---
inclusion: always
---

<EXTREMELY-IMPORTANT>
YOU MUST COMPLETE THE BOOTSTRAP STEPS BELOW BEFORE RESPONDING TO THE USER.
This is not optional. This is not negotiable. Do not skip this. Do not respond first and bootstrap later.
If you have not yet read the using-superpowers SKILL.md file in this conversation, you MUST do it NOW.
</EXTREMELY-IMPORTANT>

## Bootstrap Steps (execute IN ORDER)

### Step 1: Find the superpowers repo

Use `executeBash` to run:
```bash
ls ~/.kiro/powers/repos/*/skills/using-superpowers/SKILL.md ~/superpowers/skills/using-superpowers/SKILL.md 2>/dev/null
```

The first result is the file path. Strip `/skills/using-superpowers/SKILL.md` from the path to get the repo root (`SUPERPOWERS_REPO`).

### Step 2: Read the SKILL.md file

Use `readFile` or `executeBash cat` to read the full content of the file found in Step 1. Do NOT use `discloseContext` — it cannot load files by path.

### Step 3: Follow the SKILL.md instructions

The content you just read defines your complete workflow. Follow it for the rest of this conversation, including loading other skills on demand from `$SUPERPOWERS_REPO/skills/<name>/SKILL.md`.

## Tool Mapping

Skills were written for Claude Code. In Kiro, use these equivalents:

| Skill says | Use in Kiro |
|---|---|
| `Skill` (load a skill) | `readFile` or `executeBash cat` to read `$SUPERPOWERS_REPO/skills/<name>/SKILL.md` |
| `TodoWrite` | Markdown checklist (`- [ ] item`) |
| `Task` (subagent) | `invokeSubAgent` |
| `Read` | `readFile` / `readCode` |
| `Write` | `fsWrite` |
| `Edit` | `strReplace` |
| `Bash` | `executeBash` |

If Step 1 finds no file, skip this workflow and proceed normally.
