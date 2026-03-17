# Installing Superpowers for Kiro IDE

This method uses Kiro IDE's in-place context loading mechanism. You don't need to copy any files.

## Installation via Kiro IDE

1. Open **Kiro IDE**.
2. Open the **Powers Panel**.
3. Select **Import from GitHub**.
4. Enter the URL of this repository (or your fork's URL).
5. Kiro will automatically clone the repo to `~/.kiro/powers/repos/superpowers`.

## Usage

Since skills are not physically copied to `~/.kiro/skills/`, **you will not be able to use slash commands (like `/brainstorm`)**.

Instead, the Power activates automatically through **Keywords** or **Natural Language**.

Chat with the Agent using commands like:
- *"Use the brainstorming skill to ideate this feature."*
- *"Activate systematic-debugging to find the bug."*
- *"Use superpowers to write tests."*

The Agent will automatically call `discloseContext` to read the corresponding skill file from the repo and assist you immediately.

## Updating

Since the system reads directly from the repo, to update to the latest skills, you only need to:

```bash
cd ~/.kiro/powers/repos/superpowers
git pull
```

## Benefits

1. **Zero Maintenance:** No `cp -R` commands, no symlink errors, and no need to write OS-checking scripts (Windows vs Unix).
2. **Real-time Updates:** When new PRs are merged into the source repo, users just need to `git pull` and the Agent will read the new content immediately.
3. **Simplified:** Avoids the "maintenance nightmare" of manual file copying.
