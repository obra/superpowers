# Superpowers for Gemini CLI / Antigravity

Enable superpowers skills in [Gemini CLI](https://geminicli.com) /
[Antigravity](https://antigravity.google) via global instruction context.

## Quick Install

Tell Gemini (or run locally):

```bash
git clone https://github.com/obra/superpowers.git ~/.gemini/superpowers && ~/.gemini/superpowers/.gemini/install.sh
```

## Manual Installation

### Prerequisites

- Gemini CLI / Antigravity environment
- `git`
- `~/.gemini/GEMINI.md` (created automatically if missing)

### Steps

1. **Clone the repository:**

   ```bash
   git clone https://github.com/obra/superpowers.git ~/.gemini/superpowers
   ```

2. **Run the install script:**

   ```bash
   ~/.gemini/superpowers/.gemini/install.sh
   ```

   This script will:
   - Create `~/.gemini/skills/` if it doesn't exist.
   - Symlink each skill from the repo into `~/.gemini/skills/` (Hub Pattern).
   - Append the "Superpowers Context" to your `~/.gemini/GEMINI.md` file.

3. **Reload the Context:**
   - **Gemini CLI**: Run `/memory refresh` to load the new context immediately,
     or `/quit` and restart the CLI.
   - **Antigravity**: Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
     and run **"Reload Window"**.

## Verification

Ask Gemini:

> "Do you have superpowers?"

It should respond affirmatively and be able to list available skills.

## Uninstallation

1. **Remove the symlinks:**

   ```bash
   # Remove the specific superpowers symlinks
   # (Be careful not to delete any custom skills you've added!)
   find ~/.gemini/skills -type l -lname '*/superpowers/skills/*' -delete

   # Or remove them individually if you prefer
   # rm ~/.gemini/skills/brainstorming ~/.gemini/skills/testing ...
   ```

2. **Remove the Repo:**

   ```bash
   rm -rf ~/.gemini/superpowers
   ```

3. **Clean up GEMINI.md:** Edit `~/.gemini/GEMINI.md` and remove the
   "Superpowers Context" block (marked with `<!-- SUPERPOWERS-CONTEXT-START -->`
   tags).
