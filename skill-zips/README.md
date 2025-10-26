# Superpowers Skill ZIP Files

This directory contains pre-packaged ZIP files for all Superpowers skills, ready for installation in Claude Desktop or Claude Code.

## Installation for Claude Desktop

### Option 1: Install Individual Skills

Copy the skill ZIP file to your Claude Desktop skills directory:

```bash
# On macOS
cp <skill-name>.zip ~/Library/Application\ Support/Claude/skills/

# On Linux
cp <skill-name>.zip ~/.config/Claude/skills/

# On Windows
copy <skill-name>.zip %APPDATA%\Claude\skills\
```

Then extract it in the skills directory.

### Option 2: Install All Skills

```bash
# On macOS
cp *.zip ~/Library/Application\ Support/Claude/skills/
cd ~/Library/Application\ Support/Claude/skills/
for f in *.zip; do unzip -q "$f"; done

# On Linux
cp *.zip ~/.config/Claude/skills/
cd ~/.config/Claude/skills/
for f in *.zip; do unzip -q "$f"; done
```

## Available Skills (22 Total)

### Testing (3 skills)
- `test-driven-development.zip` - RED-GREEN-REFACTOR cycle
- `condition-based-waiting.zip` - Async test patterns
- `testing-anti-patterns.zip` - Common pitfalls to avoid

### Debugging (4 skills)
- `systematic-debugging.zip` - 4-phase root cause process
- `root-cause-tracing.zip` - Find the real problem
- `verification-before-completion.zip` - Ensure it's actually fixed
- `defense-in-depth.zip` - Multiple validation layers

### Collaboration (9 skills)
- `brainstorming.zip` - Socratic design refinement
- `writing-plans.zip` - Detailed implementation plans
- `executing-plans.zip` - Batch execution with checkpoints
- `dispatching-parallel-agents.zip` - Concurrent subagent workflows
- `requesting-code-review.zip` - Pre-review checklist
- `receiving-code-review.zip` - Responding to feedback
- `using-git-worktrees.zip` - Parallel development branches
- `finishing-a-development-branch.zip` - Merge/PR decision workflow
- `subagent-driven-development.zip` - Fast iteration with quality gates

### Automation (2 skills)
- `playwright-browser-automation.zip` - Browser testing with Playwright
- `ios-simulator-testing.zip` - iOS app testing with accessibility automation

### Meta (4 skills)
- `writing-skills.zip` - Create new skills following best practices
- `sharing-skills.zip` - Contribute skills back via branch and PR
- `testing-skills-with-subagents.zip` - Validate skill quality
- `using-superpowers.zip` - Introduction to the skills system

## Regenerating ZIP Files

If you need to regenerate these ZIP files (after making changes to skills):

```bash
cd /home/user/superpowers
./create-skill-zips.sh
```

This will recreate all ZIP files in this directory.

## License

See individual skill licenses. Most skills are MIT licensed.
