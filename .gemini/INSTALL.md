# Installing Superpowers for Gemini CLI / Antigravity

Enable superpowers skills in [Gemini CLI](https://gemini-cli.com) /
[Antigravity](https://antigravity.google) via global instruction context.

## Prerequisites

- Gemini CLI / Antigravity environment
- `git`
- `~/.gemini/GEMINI.md` (created automatically if missing)

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/obra/superpowers.git ~/.gemini/superpowers
   ```

2. **Run the install script:**

   ```bash
   cd ~/.gemini/superpowers
   ./.gemini/install.sh
   ```

   This script will:
   - Symlink the `skills` directory to `~/.gemini/skills`.
   - Append the "Superpowers Context" to your `~/.gemini/GEMINI.md` file.

3. **Restart Gemini** (if running) or simply start a new session. The skills
   will be automatically discovered via the global instructions.

## Verification

Ask Gemini:

> "Do you have superpowers?"

It should respond affirmatively and be able to list available skills.

## Uninstallation

1. Remove the symlink:
   ```bash
   rm ~/.gemini/skills
   ```
2. Edit `~/.gemini/GEMINI.md` and remove the "Superpowers Context" block
   manually.
