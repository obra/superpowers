# Installing Superpowers for GitHub Copilot

Enable superpowers skills in GitHub Copilot agent mode via custom instructions.

## Prerequisites

- VS Code with GitHub Copilot extension
- GitHub Copilot subscription (Individual, Business, or Enterprise)
- Copilot agent mode enabled (VS Code 1.99+ or Insiders)
- Git

## Method A: Global Install (recommended for individual use)

1. **Clone the superpowers repository:**
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.copilot-superpowers
   ```

2. **Add to VS Code settings:**

   Open VS Code Settings (JSON) and add:
   ```json
   {
     "github.copilot.chat.codeGeneration.instructions": [
       { "file": "~/.copilot-superpowers/.github/copilot-instructions.md" }
     ]
   }
   ```

3. **Restart VS Code** to pick up the new instructions.

### Windows

```powershell
git clone https://github.com/obra/superpowers.git "$env:USERPROFILE\.copilot-superpowers"
```

In VS Code settings, use the full path:
```json
{
  "github.copilot.chat.codeGeneration.instructions": [
    { "file": "C:\\Users\\YourName\\.copilot-superpowers\\.github\\copilot-instructions.md" }
  ]
}
```

## Method B: Per-Project Install (recommended for teams)

1. **Clone or add superpowers as a submodule:**
   ```bash
   git submodule add https://github.com/obra/superpowers.git .superpowers
   ```

2. **Generate the instructions file with per-project paths:**
   ```bash
   mkdir -p .github
   bash .superpowers/scripts/generate-copilot-instructions.sh --prefix .superpowers
   ```
   This generates `.github/copilot-instructions.md` with skill paths pointing to `.superpowers/skills/...`.

3. **Commit** the `.github/copilot-instructions.md` file so your team gets superpowers automatically.

## Verify

Open Copilot agent mode in VS Code and ask:

```
Tell me about your superpowers
```

The agent should recognize the skills system and describe the available skills.

## Updating

```bash
cd ~/.copilot-superpowers && git pull
```

The `.github/copilot-instructions.md` file is auto-generated. If you want to regenerate it after updating (e.g., if you've added custom skills):
```bash
cd ~/.copilot-superpowers && bash scripts/generate-copilot-instructions.sh
```

For per-project installs, update the submodule and regenerate:
```bash
git submodule update --remote .superpowers
bash .superpowers/scripts/generate-copilot-instructions.sh --prefix .superpowers
```

## Uninstalling

### Global

1. Remove the `github.copilot.chat.codeGeneration.instructions` entry from VS Code settings
2. Optionally delete the clone: `rm -rf ~/.copilot-superpowers`

### Per-Project

1. Delete `.github/copilot-instructions.md` (or remove the superpowers content if you have other instructions)
2. Optionally remove the submodule: `git rm .superpowers`
