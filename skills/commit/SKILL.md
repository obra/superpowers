---
name: commit
description: Invoke when the user explicitly asks to commit, stage, or save changes to git — do not invoke automatically
---

# Commit

Stage and commit the current working tree changes when explicitly asked.

**Core principle:** The user controls when commits happen. Never invoke this skill on your own initiative.

**Announce at start:** "I'm using the commit skill to stage and commit changes."

## When to Invoke

Invoke this skill when the user says:
- "commit now"
- "commit this"
- "save to git"
- "stage and commit"
- "/commit"

**Do NOT invoke this skill** at the end of tasks, after implementing features, or any other time on your own initiative. This skill exists to be called explicitly — not automatically.

## The Process

### 1. Show Status

Run `git status` and show the user what changed. If anything looks unexpected (files you didn't touch, sensitive files, unrelated changes), flag it before continuing.

### 2. Stage Files

Stage specific files by name (preferred over `git add .`). Use `git add -A` only when it is genuinely appropriate to stage everything and there are no unexpected files.

### 3. Draft Commit Message

Write a message that explains *why* the change was made, not just what changed.

- Subject line: under 72 characters
- Format: `<type>: <short summary>`
- Types: `feat`, `fix`, `refactor`, `docs`, `chore`
- Optional body: additional context, motivation, or caveats

### 4. Confirm with User

Show:
- List of staged files
- Proposed commit message

Ask: **"Proceed? (yes / edit message / cancel)"**

Wait for the user's response. If they want to edit the message, use their version exactly. If they say cancel, stop.

### 5. Commit

Run `git commit -m "<confirmed message>"`. Report the commit hash and subject line.

## What This Skill Does NOT Do

- **No push** — committing locally only; the user pushes when ready
- **No branch switching** — commit to whatever branch is currently checked out
- **No amend** — creates a new commit; do not use `--amend` unless the user explicitly asks

## Red Flags

**Never:**
- Invoke without explicit user request
- Commit and push in the same action
- Commit files that look like secrets (`.env`, credential files, private keys)
- Skip the confirm step
- Use `--no-verify` unless the user explicitly asks
