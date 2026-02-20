# Superpowers for Gemini CLI

Guide for using Superpowers with Google's Gemini CLI via native skill discovery.

## Quick Install

Gemini CLI offers native skill discovery. To integrate Superpowers, simply clone the Superpowers repository and create a symbolic link from its `skills` directory to Gemini CLI's skill discovery path.

### Steps

1.  **Clone the Superpowers Repository** (if you haven't already):
    ```bash
    git clone https://github.com/obra/superpowers.git ~/.gemini/superpowers
    ```
    (You can choose any location for the clone, `~/.gemini/superpowers` is just an example for user-level installation.)

2.  **Create the Skills Directory** (if it doesn't exist):
    ```bash
    mkdir -p ~/.gemini/skills
    ```

3.  **Create a Symbolic Link**:
    ```bash
    ln -s ~/.gemini/superpowers/skills ~/.gemini/skills/superpowers
    ```
    This command creates a symlink named `superpowers` inside `~/.gemini/skills/` that points to the actual `skills` directory within your cloned Superpowers repository.

4.  **Restart Gemini CLI** (if it's currently running).

## How It Works

Gemini CLI automatically scans `~/.gemini/skills/` (for user-level skills) or `.gemini/skills/` (for project-level skills) at startup. It discovers skills by looking for directories containing a `SKILL.md` file. By creating the symlink, all Superpowers skills become discoverable by your Gemini CLI instance.

The `using-superpowers` skill, which is part of Superpowers, is automatically discovered and will guide Gemini CLI on when and how to utilize the other Superpowers skills, ensuring proper context injection and usage.

## Usage

Once installed, Superpowers skills are discovered automatically. Gemini CLI will activate them when:
-   You mention a skill by name (e.g., "use brainstorming")
-   The task matches a skill's description
-   The `using-superpowers` skill directs Gemini CLI to use one

You can use the `/skills list` command within Gemini CLI to view all available skills, including those provided by Superpowers.

## Updating Superpowers

To update Superpowers, navigate to your cloned repository and pull the latest changes:

```bash
cd ~/.gemini/superpowers
git pull
```
After pulling, restart Gemini CLI to ensure the updated skills are loaded.

## Uninstalling Superpowers

To uninstall, simply remove the symbolic link and the cloned repository:

```bash
rm ~/.gemini/skills/superpowers
rm -rf ~/.gemini/superpowers
```

## Troubleshooting

### Skills not showing up

1.  **Verify the Symlink**: Ensure the symbolic link is correctly created.
    ```bash
    ls -l ~/.gemini/skills/superpowers
    ```
    It should show an arrow pointing to your Superpowers `skills` directory.
2.  **Check Skills Directory**: Confirm that the Superpowers `skills` directory contains actual `SKILL.md` files.
    ```bash
    ls ~/.gemini/superpowers/skills
    ```
3.  **Restart Gemini CLI**: Skills are typically discovered at startup.

If issues persist, please report them on the Superpowers GitHub repository.
