# Superpowers for Qwen Code CLI

Guide for using Superpowers with Qwen Code CLI.

> **Note:** Qwen Code is based on Gemini CLI, so it can also install Gemini CLI extensions directly. The `gemini-extension.json` in this repo is auto-converted to `qwen-extension.json` format during install.

## Quick Install (Extension)

The recommended way to install Superpowers is via the Qwen Code extension system:

```bash
qwen extensions install https://github.com/obra/superpowers
```

This automatically installs all skills, commands, agents, and context.

To update:

```bash
qwen extensions update superpowers
```

## Alternative Install (Manual Symlink)

If you prefer manual setup, clone the repository and symlink the skills directory.

### Steps

1.  **Clone the Superpowers Repository** (if you haven't already):
    ```bash
    git clone https://github.com/obra/superpowers.git ~/.qwen/superpowers
    ```

2.  **Create the Skills Directory** (if it doesn't exist):
    ```bash
    mkdir -p ~/.qwen/skills
    ```

3.  **Create a Symbolic Link**:
    ```bash
    ln -s ~/.qwen/superpowers/skills ~/.qwen/skills/superpowers
    ```

4.  **Restart Qwen Code CLI** (if it's currently running).

> **Note:** The manual approach only installs skills. Commands (`/brainstorm`, `/write-plan`, `/execute-plan`) and the code-reviewer agent require the extension install.

## How It Works

Qwen Code CLI automatically scans `~/.qwen/skills/` (for user-level skills) or `.qwen/skills/` (for project-level skills) at startup. It discovers skills by looking for directories containing a `SKILL.md` file. By creating the symlink, all Superpowers skills become discoverable by your Qwen Code CLI instance.

The `using-superpowers` skill, which is part of Superpowers, is automatically discovered and will guide Qwen Code CLI on when and how to utilize the other Superpowers skills, ensuring proper context injection and usage.

## Usage

Once installed, Superpowers skills are discovered automatically. Qwen Code CLI will activate them when:
-   You mention a skill by name (e.g., "use brainstorming")
-   The task matches a skill's description
-   The `using-superpowers` skill directs Qwen Code CLI to use one

You can use the `/skills` command within Qwen Code CLI to view all available skills, including those provided by Superpowers.

## Updating Superpowers

**Extension install:**

```bash
qwen extensions update superpowers
```

**Manual install:**

```bash
cd ~/.qwen/superpowers
git pull
```

Restart Qwen Code CLI after updating.

## Uninstalling Superpowers

**Extension install:**

```bash
qwen extensions uninstall superpowers
```

**Manual install:**

```bash
rm ~/.qwen/skills/superpowers
rm -rf ~/.qwen/superpowers
```

## Troubleshooting

### Skills not showing up

1.  **Verify the Symlink**: Ensure the symbolic link is correctly created.
    ```bash
    ls -l ~/.qwen/skills/superpowers
    ```
    It should show an arrow pointing to your Superpowers `skills` directory.
2.  **Check Skills Directory**: Confirm that the Superpowers `skills` directory contains actual `SKILL.md` files.
    ```bash
    ls ~/.qwen/superpowers/skills
    ```
3.  **Restart Qwen Code CLI**: Skills are typically discovered at startup.

If issues persist, please report them on the Superpowers GitHub repository.
