# Superpowers for Qwen Code CLI

Guide for using Superpowers with Qwen Code CLI via native skill discovery.

## Quick Install

Qwen Code CLI offers native skill discovery. To integrate Superpowers, simply clone the Superpowers repository and create a symbolic link from its `skills` directory to Qwen Code CLI's skill discovery path.

### Steps

1.  **Clone the Superpowers Repository** (if you haven't already):
    ```bash
    git clone https://github.com/obra/superpowers.git ~/.qwen/superpowers
    ```
    (You can choose any location for the clone, `~/.qwen/superpowers` is just an example for user-level installation.)

2.  **Create the Skills Directory** (if it doesn't exist):
    ```bash
    mkdir -p ~/.qwen/skills
    ```

3.  **Create a Symbolic Link**:
    ```bash
    ln -s ~/.qwen/superpowers/skills ~/.qwen/skills/superpowers
    ```
    This command creates a symlink named `superpowers` inside `~/.qwen/skills/` that points to the actual `skills` directory within your cloned Superpowers repository.

4.  **Restart Qwen Code CLI** (if it's currently running).

## How It Works

Qwen Code CLI automatically scans `~/.qwen/skills/` (for user-level skills) or `.qwen/skills/` (for project-level skills) at startup. It discovers skills by looking for directories containing a `SKILL.md` file. By creating the symlink, all Superpowers skills become discoverable by your Qwen Code CLI instance.

The `using-superpowers` skill, which is part of Superpowers, is automatically discovered and will guide Qwen Code CLI on when and how to utilize the other Superpowers skills, ensuring proper context injection and usage.

## Usage

Once installed, Superpowers skills are discovered automatically. Qwen Code CLI will activate them when:
-   You mention a skill by name (e.g., "use brainstorming")
-   The task matches a skill's description
-   The `using-superpowers` skill directs Qwen Code CLI to use one

You can use the `/skills list` command within Qwen Code CLI to view all available skills, including those provided by Superpowers.

## Updating Superpowers

To update Superpowers, navigate to your cloned repository and pull the latest changes:

```bash
cd ~/.qwen/superpowers
git pull
```
After pulling, restart Qwen Code CLI to ensure the updated skills are loaded.

## Uninstalling Superpowers

To uninstall, simply remove the symbolic link and the cloned repository:

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
