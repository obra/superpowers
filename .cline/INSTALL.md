# Installing Superpowers for Cline (Windows)

## Prerequisites

- VSCode with the [Cline extension](https://marketplace.visualstudio.com/items?itemName=saoudrizwan.claude-dev) installed
- Git installed
- Windows PowerShell (run as Administrator may be required for symlinks depending on your Windows settings)

## Installation Steps

### 1. Clone Superpowers

Open PowerShell and clone the repository where you manage your tools:

```powershell
# Example: cloning to your documents folder
cd ~\Documents
git clone https://github.com/obra/superpowers.git
```

### 2. Configure Cline Rules

To make Cline aware of your superpowers, you need to point it to the bootstrap file. You can do this globally or per-project.

**Global Installation (Recommended):**

Cline automatically loads all `.md` files in its global rules directory (usually `~\Documents\Cline\Rules\`). To activate superpowers, create a symbolic link to the `bootstrap.md` file in that directory.

Open PowerShell (as Administrator) and run:

```powershell
# Create the symlink for the bootstrap rules
New-Item -ItemType SymbolicLink -Path "~\Documents\Cline\Rules\superpowers.md" -Target "C:\path\to\your\cloned\superpowers\.cline\bootstrap.md"
```

*(Ensure you replace `C:\path\to\your\cloned\superpowers` with the actual absolute path where you cloned the repo).*

**Project-Specific Installation:**

If you only want superpowers in a specific project, create a `.clinerules` directory at the project root and symlink the bootstrap file there:

```powershell
mkdir .clinerules
New-Item -ItemType SymbolicLink -Path ".clinerules\superpowers.md" -Target "C:\path\to\your\cloned\superpowers\.cline\bootstrap.md"
```

### 3. Make Skills Discoverable

Cline needs to find the `skills/` directory. Create a symbolic link from the cloned `.cline/skills` folder to your workspace or a global location Cline can access.

Open PowerShell (as Administrator) and run:

```powershell
# Create a global skills directory if it doesn't exist
New-Item -ItemType Directory -Path "~\Documents\Cline\skills" -Force

# Create the symlink
New-Item -ItemType SymbolicLink -Path "~\Documents\Cline\skills\superpowers" -Target "C:\path\to\your\cloned\superpowers\.cline\skills"
```

*(Again, replace `C:\path\to\your\cloned\superpowers` with your actual path).*

### 4. Restart VSCode

Restart VSCode so the Cline extension can detect the new rules and skills.

Verify by starting a new Cline chat and asking: "do you have superpowers, and can you see the brainstorming skill?"

## Usage

### Finding Skills

Skills are loaded on-demand. When you ask Cline to perform a task, the `bootstrap.md` instructions will command it to check the `skills\` directory for relevant `SKILL.md` files. 

You can also explicitly instruct Cline:
> "Use the brainstorming skill to help me design this."

### Personal Skills

You can create your own skills next to the superpowers directory:

```powershell
New-Item -ItemType Directory -Path "~\Documents\Cline\skills\my-skill"
```

Create `SKILL.md` inside that folder:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

## Updating

To get the latest skills, simply pull the latest changes from the repository:

```powershell
cd \path\to\your\cloned\superpowers
git pull
```

## Troubleshooting

### Skills not found

1. Check your symlink in PowerShell: `Get-Item ~\Documents\Cline\skills\superpowers`
2. Ensure you ran PowerShell as Administrator if Windows blocked the symlink creation.
3. Explicitly tell Cline to check the absolute path to your skills directory if it can't find them automatically.

### Tool mapping

When skills reference abstract capabilities, Cline will map them as follows:
- `Task Tracker` → Cline will create a local markdown checklist (e.g., `task.md`)
- `Subagent Dispatcher` → Cline will instruct you to open a new Task/Chat, or use MCP tools if configured
- `Skill Loader` → Cline will read the `SKILL.md` file natively using its file reading tools.
- `Project Instructions Document` → `.clinerules` or `CLAUDE.md`
