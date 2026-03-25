# Installing Superpowers for GitHub Copilot (VS Code)

Enable Superpowers in Copilot with full local access to the Superpowers repository and skills.

## Prerequisites

- Visual Studio Code
- GitHub Copilot and Copilot Chat enabled
- Git installed
- Any repository opened as a workspace

## Installation

1. Clone Superpowers once in a shared local path

   mkdir -p ~/.copilot  
   git clone https://github.com/obra/superpowers.git ~/.copilot/superpowers

2. Link Superpowers skills into your project

   mkdir -p .github/skills  
   ln -sfn ~/.copilot/superpowers/skills .github/skills/superpowers

3. Add or update project instructions

   Create or open: copilot-instructions.md  
   Append your Superpowers workflow block there without removing existing project rules.

4. Start a new Copilot Chat session

   This reloads workspace instructions and skills context.

## Verify

Ask Copilot:

- Tell me which skills are available in this workspace
- Help me plan this feature using Superpowers workflow
- Use RED GREEN REFACTOR for this bugfix

Expected result:

- Copilot follows the Superpowers workflow
- Skill-driven behavior appears when your prompt matches a skill purpose

## Updating

Update Superpowers globally:

git -C ~/.copilot/superpowers pull

Then start a new Copilot chat session.

## Pinning a Version

To pin a specific version:

git -C ~/.copilot/superpowers fetch --tags  
git -C ~/.copilot/superpowers checkout v5.0.3

## Migrating Old Setup

If you used older custom symlinks or copied skill folders, remove those old paths and keep only:

- Shared repo: ~/.copilot/superpowers
- Workspace link: .github/skills/superpowers

Then start a new Copilot chat session.

## Troubleshooting

Plugin or skills not detected:

1. Check the skills link:
   ls -la .github/skills

2. Confirm SKILL files are visible:
   find .github/skills/superpowers -name SKILL.md

3. Confirm instructions file exists and contains your workflow:
   copilot-instructions.md

4. Start a new Copilot chat session after any change.

## Uninstalling

From project root:

rm -f .github/skills/superpowers

Optional full removal:

rm -rf ~/.copilot/superpowers

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Full documentation: https://github.com/obra/superpowers/blob/main/docs/README.copilot.md
