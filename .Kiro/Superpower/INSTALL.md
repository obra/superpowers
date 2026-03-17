# Installing Superpowers for Kiro IDE

This guide will help you install Superpowers as a custom power in Kiro IDE using the folder-based import method.

## Installation Steps

1. **Open Kiro IDE** and navigate to the Powers panel

2. **Add Custom Power**
   - Click on "Add Custom Power" button in the Powers panel

3. **Import Power from a Folder**
   - Select "Import power from a folder" option
   - Navigate to where you cloned or downloaded this repository

4. **Select the Superpower Folder**
   - **IMPORTANT**: You must select the `Superpower` folder located under `.Kiro`
   - Example paths:
     - Windows: `C:\Users\YourName\superpowers\.Kiro\Superpower`
     - macOS: `/Users/YourName/superpowers/.Kiro/Superpower`
     - Linux: `/home/yourname/superpowers/.Kiro/Superpower`

   **⚠️ Common Mistake**: Do not select the root repository folder or the `.Kiro` folder itself. You must select the `Superpower` subfolder.

5. **Verify Installation**
   - Once imported, the power should appear in your Powers panel
   - All steering files will be automatically loaded
   - Skills will activate based on context

## What Gets Installed

When you import the Superpower folder, Kiro will automatically detect and load:

- **POWER.md** - Main power configuration and metadata
- **steering/** directory - All steering files that provide context-aware guidance:
  - `brainstorming.md` - Interactive design refinement
  - `test-driven-development.md` - TDD enforcement
  - `systematic-debugging.md` - Root cause analysis
  - `subagent-driven-development.md` - Subagent execution
  - `code-review.md` - Two-stage review process
  - `git-worktrees.md` - Isolated development workspaces
  - `getting-started.md` - Complete introduction

## How It Works

Unlike other platforms, Kiro's Power system uses **steering files** that automatically load based on context:

1. When you start a conversation, the POWER.md provides initial context
2. As you work, relevant steering files are loaded automatically
3. No slash commands needed - skills activate naturally through conversation
4. The agent follows the workflows defined in the steering files

## Testing the Installation

After installation, test that it's working by starting a new conversation and saying:

```
"I want to build a new feature for user authentication"
```

The agent should automatically:
1. Start asking questions to understand your requirements (brainstorming)
2. Present a design for your review
3. Create an implementation plan
4. Follow test-driven development practices

## Updating

To update Superpowers:

1. Navigate to where you cloned the repository
2. Run `git pull` to get the latest changes
3. The power will automatically use the updated steering files

No need to re-import - Kiro reads directly from the folder you selected.

## Troubleshooting

### Power doesn't appear after import
- Make sure you selected the `Superpower` folder, not the `.Kiro` folder or repository root
- Check that the folder contains `POWER.md` and the `steering/` directory

### Skills don't activate
- Verify the power is enabled in the Powers panel
- Try starting a new conversation
- Use natural language to trigger skills (e.g., "help me debug this issue")

### Steering files not loading
- Check that the `steering/` directory exists in the folder you imported
- Verify file permissions allow Kiro to read the files

## Platform Notes

**macOS Users**: When testing, use the `use-writeskill` command to test skills that involve file operations, as you need to verify write permissions work correctly.

## Support

For issues or questions:
- GitHub Issues: https://github.com/obra/superpowers/issues
- Discord: https://discord.gg/Jd8Vphy9jq
