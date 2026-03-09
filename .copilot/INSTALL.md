# Installing Superpowers for GitHub Copilot (VS Code / VS Code Insiders)

Superpowers is compatible with the **GitHub Copilot Chat** extension running inside
Visual Studio Code.  The instructions below walk through the two pieces that are
required:

1. make the superpowers skills available to Copilot, and
2. (optionally) install the `superpowers` plugin in the Copilot plugin
   marketplace so that other people using the same machine can enable it
   without the manual symlink step.

> GitHub Copilot runs in two different binaries: `code` (stable) and
> `code-insiders` (Insiders build).  The same extension/skills work in both
> places.  When installing from the command line be sure to match the binary you
> actually launch.

## Prerequisites

* Visual Studio Code **or** Visual Studio Code Insiders with the official
  GitHub Copilot (Copilot Chat) extension installed and authenticated.
* Git available on your system.

(If you haven't installed the Copilot extension yet you can do so via the
Extensions view or with `code --install-extension GitHub.copilot` /
`code-insiders --install-extension GitHub.copilot`.)

## Installation

### macOS / Linux

```bash
# 1. Clone/update the repo
if [ -d ~/.copilot/superpowers ]; then
  cd ~/.copilot/superpowers && git pull
else
  git clone https://github.com/obra/superpowers.git ~/.copilot/superpowers
fi

# 2. Make the skills visible to *any* agent (Copilot, Codex, etc.)
mkdir -p ~/.agents/skills
ln -sf ~/.copilot/superpowers/skills ~/.agents/skills/superpowers
```

### Windows (PowerShell)

```powershell
# 1. Install/update the repo
if (Test-Path "$env:USERPROFILE\.copilot\superpowers") {
    cd "$env:USERPROFILE\.copilot\superpowers"; git pull
} else {
    git clone https://github.com/obra/superpowers.git "$env:USERPROFILE\.copilot\superpowers"
}

# 2. Create the skills junction
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
New-Item -ItemType Junction -Force -Path "$env:USERPROFILE\.agents\skills\superpowers" -Target "$env:USERPROFILE\.copilot\superpowers\skills"
```

The `~/.agents/skills/superpowers` symlink is what Copilot (and other platforms)
use to discover the library of skills.  Once it exists a restart of VS Code is
all that's required.

### (Optional) Install from the Copilot plugin marketplace

If you prefer not to manage the repository yourself you can also install the
bundle from the public marketplace.  From a Copilot chat window run:

```text
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

This is the same sequence used by Claude Code; the commands are accepted by
Copilot Chat as well.

## Verify installation

Open a new Copilot Chat session and ask for something that should trigger a
skill, for example:

> help me plan this feature

Superpowers should respond with its bootstrap message and you can continue
using the normal workflow.

## Updating

```bash
cd ~/.copilot/superpowers && git pull
```

Because the skills directory is symlinked, the update is effective immediately.

## Uninstalling

Remove the symlink and optionally delete the clone:

```bash
rm ~/.agents/skills/superpowers
rm -rf ~/.copilot/superpowers
```
