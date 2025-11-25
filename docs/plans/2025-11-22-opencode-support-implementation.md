# OpenCode Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add full superpowers support for OpenCode.ai with a native JavaScript plugin that shares core functionality with the existing Codex implementation.

**Architecture:** Extract common skill discovery/parsing logic into `lib/skills-core.js`, refactor Codex to use it, then build OpenCode plugin using their native plugin API with custom tools and session hooks.

**Tech Stack:** Node.js, JavaScript, OpenCode Plugin API, Git worktrees

---

## Phase 1: Create Shared Core Module

### Task 1: Extract Frontmatter Parsing

**Files:**
- Create: `lib/skills-core.js`
- Reference: `.codex/superpowers-codex` (lines 40-74)

**Step 1: Create lib/skills-core.js with extractFrontmatter function**

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Extract YAML frontmatter from a skill file.
 * Current format:
 * ---
 * name: skill-name
 * description: Use when [condition] - [what it does]
 * ---
 *
 * @param {string} filePath - Path to SKILL.md file
 * @returns {{name: string, description: string}}
 */
function extractFrontmatter(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        let inFrontmatter = false;
        let name = '';
        let description = '';

        for (const line of lines) {
            if (line.trim() === '---') {
                if (inFrontmatter) break;
                inFrontmatter = true;
                continue;
            }

            if (inFrontmatter) {
                const match = line.match(/^(\w+):\s*(.*)$/);
                if (match) {
                    const [, key, value] = match;
                    switch (key) {
                        case 'name':
                            name = value.trim();
                            break;
                        case 'description':
                            description = value.trim();
                            break;
                    }
                }
            }
        }

        return { name, description };
    } catch (error) {
        return { name: '', description: '' };
    }
}

module.exports = {
    extractFrontmatter
};
```

**Step 2: Verify file was created**

Run: `ls -l lib/skills-core.js`
Expected: File exists

**Step 3: Commit**

```bash
git add lib/skills-core.js
git commit -m "feat: create shared skills core module with frontmatter parser"
```

---

### Task 2: Extract Skill Discovery Logic

**Files:**
- Modify: `lib/skills-core.js`
- Reference: `.codex/superpowers-codex` (lines 97-136)

**Step 1: Add findSkillsInDir function to skills-core.js**

Add before `module.exports`:

```javascript
/**
 * Find all SKILL.md files in a directory recursively.
 *
 * @param {string} dir - Directory to search
 * @param {string} sourceType - 'personal' or 'superpowers' for namespacing
 * @param {number} maxDepth - Maximum recursion depth (default: 3)
 * @returns {Array<{path: string, name: string, description: string, sourceType: string}>}
 */
function findSkillsInDir(dir, sourceType, maxDepth = 3) {
    const skills = [];

    if (!fs.existsSync(dir)) return skills;

    function recurse(currentDir, depth) {
        if (depth > maxDepth) return;

        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);

            if (entry.isDirectory()) {
                // Check for SKILL.md in this directory
                const skillFile = path.join(fullPath, 'SKILL.md');
                if (fs.existsSync(skillFile)) {
                    const { name, description } = extractFrontmatter(skillFile);
                    skills.push({
                        path: fullPath,
                        skillFile: skillFile,
                        name: name || entry.name,
                        description: description || '',
                        sourceType: sourceType
                    });
                }

                // Recurse into subdirectories
                recurse(fullPath, depth + 1);
            }
        }
    }

    recurse(dir, 0);
    return skills;
}
```

**Step 2: Update module.exports**

Replace the exports line with:

```javascript
module.exports = {
    extractFrontmatter,
    findSkillsInDir
};
```

**Step 3: Verify syntax**

Run: `node -c lib/skills-core.js`
Expected: No output (success)

**Step 4: Commit**

```bash
git add lib/skills-core.js
git commit -m "feat: add skill discovery function to core module"
```

---

### Task 3: Extract Skill Resolution Logic

**Files:**
- Modify: `lib/skills-core.js`
- Reference: `.codex/superpowers-codex` (lines 212-280)

**Step 1: Add resolveSkillPath function**

Add before `module.exports`:

```javascript
/**
 * Resolve a skill name to its file path, handling shadowing
 * (personal skills override superpowers skills).
 *
 * @param {string} skillName - Name like "superpowers:brainstorming" or "my-skill"
 * @param {string} superpowersDir - Path to superpowers skills directory
 * @param {string} personalDir - Path to personal skills directory
 * @returns {{skillFile: string, sourceType: string, skillPath: string} | null}
 */
function resolveSkillPath(skillName, superpowersDir, personalDir) {
    // Strip superpowers: prefix if present
    const forceSuperpowers = skillName.startsWith('superpowers:');
    const actualSkillName = forceSuperpowers ? skillName.replace(/^superpowers:/, '') : skillName;

    // Try personal skills first (unless explicitly superpowers:)
    if (!forceSuperpowers && personalDir) {
        const personalPath = path.join(personalDir, actualSkillName);
        const personalSkillFile = path.join(personalPath, 'SKILL.md');
        if (fs.existsSync(personalSkillFile)) {
            return {
                skillFile: personalSkillFile,
                sourceType: 'personal',
                skillPath: actualSkillName
            };
        }
    }

    // Try superpowers skills
    if (superpowersDir) {
        const superpowersPath = path.join(superpowersDir, actualSkillName);
        const superpowersSkillFile = path.join(superpowersPath, 'SKILL.md');
        if (fs.existsSync(superpowersSkillFile)) {
            return {
                skillFile: superpowersSkillFile,
                sourceType: 'superpowers',
                skillPath: actualSkillName
            };
        }
    }

    return null;
}
```

**Step 2: Update module.exports**

```javascript
module.exports = {
    extractFrontmatter,
    findSkillsInDir,
    resolveSkillPath
};
```

**Step 3: Verify syntax**

Run: `node -c lib/skills-core.js`
Expected: No output

**Step 4: Commit**

```bash
git add lib/skills-core.js
git commit -m "feat: add skill path resolution with shadowing support"
```

---

### Task 4: Extract Update Check Logic

**Files:**
- Modify: `lib/skills-core.js`
- Reference: `.codex/superpowers-codex` (lines 16-38)

**Step 1: Add checkForUpdates function**

Add at top after requires:

```javascript
const { execSync } = require('child_process');
```

Add before `module.exports`:

```javascript
/**
 * Check if a git repository has updates available.
 *
 * @param {string} repoDir - Path to git repository
 * @returns {boolean} - True if updates are available
 */
function checkForUpdates(repoDir) {
    try {
        // Quick check with 3 second timeout to avoid delays if network is down
        const output = execSync('git fetch origin && git status --porcelain=v1 --branch', {
            cwd: repoDir,
            timeout: 3000,
            encoding: 'utf8',
            stdio: 'pipe'
        });

        // Parse git status output to see if we're behind
        const statusLines = output.split('\n');
        for (const line of statusLines) {
            if (line.startsWith('## ') && line.includes('[behind ')) {
                return true; // We're behind remote
            }
        }
        return false; // Up to date
    } catch (error) {
        // Network down, git error, timeout, etc. - don't block bootstrap
        return false;
    }
}
```

**Step 2: Update module.exports**

```javascript
module.exports = {
    extractFrontmatter,
    findSkillsInDir,
    resolveSkillPath,
    checkForUpdates
};
```

**Step 3: Verify syntax**

Run: `node -c lib/skills-core.js`
Expected: No output

**Step 4: Commit**

```bash
git add lib/skills-core.js
git commit -m "feat: add git update checking to core module"
```

---

## Phase 2: Refactor Codex to Use Shared Core

### Task 5: Update Codex to Import Shared Core

**Files:**
- Modify: `.codex/superpowers-codex` (add import at top)

**Step 1: Add import statement**

After the existing requires at top of file (around line 6), add:

```javascript
const skillsCore = require('../lib/skills-core');
```

**Step 2: Verify syntax**

Run: `node -c .codex/superpowers-codex`
Expected: No output

**Step 3: Commit**

```bash
git add .codex/superpowers-codex
git commit -m "refactor: import shared skills core in codex"
```

---

### Task 6: Replace extractFrontmatter with Core Version

**Files:**
- Modify: `.codex/superpowers-codex` (lines 40-74)

**Step 1: Remove local extractFrontmatter function**

Delete lines 40-74 (the entire extractFrontmatter function definition).

**Step 2: Update all extractFrontmatter calls**

Find and replace all calls from `extractFrontmatter(` to `skillsCore.extractFrontmatter(`

Affected lines approximately: 90, 310

**Step 3: Verify script still works**

Run: `.codex/superpowers-codex find-skills | head -20`
Expected: Shows list of skills

**Step 4: Commit**

```bash
git add .codex/superpowers-codex
git commit -m "refactor: use shared extractFrontmatter in codex"
```

---

### Task 7: Replace findSkillsInDir with Core Version

**Files:**
- Modify: `.codex/superpowers-codex` (lines 97-136, approximately)

**Step 1: Remove local findSkillsInDir function**

Delete the entire `findSkillsInDir` function definition (approximately lines 97-136).

**Step 2: Update all findSkillsInDir calls**

Replace calls from `findSkillsInDir(` to `skillsCore.findSkillsInDir(`

**Step 3: Verify script still works**

Run: `.codex/superpowers-codex find-skills | head -20`
Expected: Shows list of skills

**Step 4: Commit**

```bash
git add .codex/superpowers-codex
git commit -m "refactor: use shared findSkillsInDir in codex"
```

---

### Task 8: Replace checkForUpdates with Core Version

**Files:**
- Modify: `.codex/superpowers-codex` (lines 16-38, approximately)

**Step 1: Remove local checkForUpdates function**

Delete the entire `checkForUpdates` function definition.

**Step 2: Update all checkForUpdates calls**

Replace calls from `checkForUpdates(` to `skillsCore.checkForUpdates(`

**Step 3: Verify script still works**

Run: `.codex/superpowers-codex bootstrap | head -50`
Expected: Shows bootstrap content

**Step 4: Commit**

```bash
git add .codex/superpowers-codex
git commit -m "refactor: use shared checkForUpdates in codex"
```

---

## Phase 3: Build OpenCode Plugin

### Task 9: Create OpenCode Plugin Directory Structure

**Files:**
- Create: `.opencode/plugin/superpowers.js`

**Step 1: Create directory**

Run: `mkdir -p .opencode/plugin`

**Step 2: Create basic plugin file**

```javascript
#!/usr/bin/env node

/**
 * Superpowers plugin for OpenCode.ai
 *
 * Provides custom tools for loading and discovering skills,
 * with automatic bootstrap on session start.
 */

const skillsCore = require('../../lib/skills-core');
const path = require('path');
const fs = require('fs');
const os = require('os');

const homeDir = os.homedir();
const superpowersSkillsDir = path.join(homeDir, '.config/opencode/superpowers/skills');
const personalSkillsDir = path.join(homeDir, '.config/opencode/skills');

/**
 * OpenCode plugin entry point
 */
export const SuperpowersPlugin = async ({ project, client, $, directory, worktree }) => {
  return {
    // Custom tools and hooks will go here
  };
};
```

**Step 3: Verify file was created**

Run: `ls -l .opencode/plugin/superpowers.js`
Expected: File exists

**Step 4: Commit**

```bash
git add .opencode/plugin/superpowers.js
git commit -m "feat: create opencode plugin scaffold"
```

---

### Task 10: Implement use_skill Tool

**Files:**
- Modify: `.opencode/plugin/superpowers.js`

**Step 1: Add use_skill tool implementation**

Replace the plugin return statement with:

```javascript
export const SuperpowersPlugin = async ({ project, client, $, directory, worktree }) => {
  // Import zod for schema validation
  const { z } = await import('zod');

  return {
    tools: [
      {
        name: 'use_skill',
        description: 'Load and read a specific skill to guide your work. Skills contain proven workflows, mandatory processes, and expert techniques.',
        schema: z.object({
          skill_name: z.string().describe('Name of the skill to load (e.g., "superpowers:brainstorming" or "my-custom-skill")')
        }),
        execute: async ({ skill_name }) => {
          // Resolve skill path (handles shadowing: personal > superpowers)
          const resolved = skillsCore.resolveSkillPath(
            skill_name,
            superpowersSkillsDir,
            personalSkillsDir
          );

          if (!resolved) {
            return `Error: Skill "${skill_name}" not found.\n\nRun find_skills to see available skills.`;
          }

          // Read skill content
          const fullContent = fs.readFileSync(resolved.skillFile, 'utf8');
          const { name, description } = skillsCore.extractFrontmatter(resolved.skillFile);

          // Extract content after frontmatter
          const lines = fullContent.split('\n');
          let inFrontmatter = false;
          let frontmatterEnded = false;
          const contentLines = [];

          for (const line of lines) {
            if (line.trim() === '---') {
              if (inFrontmatter) {
                frontmatterEnded = true;
                continue;
              }
              inFrontmatter = true;
              continue;
            }

            if (frontmatterEnded || !inFrontmatter) {
              contentLines.push(line);
            }
          }

          const content = contentLines.join('\n').trim();
          const skillDirectory = path.dirname(resolved.skillFile);

          // Format output similar to Claude Code's Skill tool
          return `# ${name || skill_name}
# ${description || ''}
# Supporting tools and docs are in ${skillDirectory}
# ============================================

${content}`;
        }
      }
    ]
  };
};
```

**Step 2: Verify syntax**

Run: `node -c .opencode/plugin/superpowers.js`
Expected: No output

**Step 3: Commit**

```bash
git add .opencode/plugin/superpowers.js
git commit -m "feat: implement use_skill tool for opencode"
```

---

### Task 11: Implement find_skills Tool

**Files:**
- Modify: `.opencode/plugin/superpowers.js`

**Step 1: Add find_skills tool to tools array**

Add after the use_skill tool definition, before closing the tools array:

```javascript
      {
        name: 'find_skills',
        description: 'List all available skills in the superpowers and personal skill libraries.',
        schema: z.object({}),
        execute: async () => {
          // Find skills in both directories
          const superpowersSkills = skillsCore.findSkillsInDir(
            superpowersSkillsDir,
            'superpowers',
            3
          );
          const personalSkills = skillsCore.findSkillsInDir(
            personalSkillsDir,
            'personal',
            3
          );

          // Combine and format skills list
          const allSkills = [...personalSkills, ...superpowersSkills];

          if (allSkills.length === 0) {
            return 'No skills found. Install superpowers skills to ~/.config/opencode/superpowers/skills/';
          }

          let output = 'Available skills:\n\n';

          for (const skill of allSkills) {
            const namespace = skill.sourceType === 'personal' ? '' : 'superpowers:';
            const skillName = skill.name || path.basename(skill.path);

            output += `${namespace}${skillName}\n`;
            if (skill.description) {
              output += `  ${skill.description}\n`;
            }
            output += `  Directory: ${skill.path}\n\n`;
          }

          return output;
        }
      }
```

**Step 2: Verify syntax**

Run: `node -c .opencode/plugin/superpowers.js`
Expected: No output

**Step 3: Commit**

```bash
git add .opencode/plugin/superpowers.js
git commit -m "feat: implement find_skills tool for opencode"
```

---

### Task 12: Implement Session Start Hook

**Files:**
- Modify: `.opencode/plugin/superpowers.js`

**Step 1: Add session.started hook**

After the tools array, add:

```javascript
    'session.started': async () => {
      // Read using-superpowers skill content
      const usingSuperpowersPath = skillsCore.resolveSkillPath(
        'using-superpowers',
        superpowersSkillsDir,
        personalSkillsDir
      );

      let usingSuperpowersContent = '';
      if (usingSuperpowersPath) {
        const fullContent = fs.readFileSync(usingSuperpowersPath.skillFile, 'utf8');
        // Strip frontmatter
        const lines = fullContent.split('\n');
        let inFrontmatter = false;
        let frontmatterEnded = false;
        const contentLines = [];

        for (const line of lines) {
          if (line.trim() === '---') {
            if (inFrontmatter) {
              frontmatterEnded = true;
              continue;
            }
            inFrontmatter = true;
            continue;
          }

          if (frontmatterEnded || !inFrontmatter) {
            contentLines.push(line);
          }
        }

        usingSuperpowersContent = contentLines.join('\n').trim();
      }

      // Tool mapping instructions
      const toolMapping = `
**Tool Mapping for OpenCode:**
When skills reference tools you don't have, substitute OpenCode equivalents:
- \`TodoWrite\` → \`update_plan\` (your planning/task tracking tool)
- \`Task\` tool with subagents → Use OpenCode's subagent system (@mention syntax or automatic dispatch)
- \`Skill\` tool → \`use_skill\` custom tool (already available)
- \`Read\`, \`Write\`, \`Edit\`, \`Bash\` → Use your native tools

**Skill directories contain supporting files:**
- Scripts you can run with bash tool
- Additional documentation you can read
- Utilities and helpers specific to that skill

**Skills naming:**
- Superpowers skills: \`superpowers:skill-name\` (from ~/.config/opencode/superpowers/skills/)
- Personal skills: \`skill-name\` (from ~/.config/opencode/skills/)
- Personal skills override superpowers skills when names match
`;

      // Check for updates (non-blocking)
      const hasUpdates = skillsCore.checkForUpdates(
        path.join(homeDir, '.config/opencode/superpowers')
      );

      const updateNotice = hasUpdates ?
        '\n\n⚠️ **Updates available!** Run `cd ~/.config/opencode/superpowers && git pull` to update superpowers.' :
        '';

      // Return context to inject into session
      return {
        context: `<EXTREMELY_IMPORTANT>
You have superpowers.

**Below is the full content of your 'superpowers:using-superpowers' skill - your introduction to using skills. For all other skills, use the 'use_skill' tool:**

${usingSuperpowersContent}

${toolMapping}${updateNotice}
</EXTREMELY_IMPORTANT>`
      };
    }
```

**Step 2: Verify syntax**

Run: `node -c .opencode/plugin/superpowers.js`
Expected: No output

**Step 3: Commit**

```bash
git add .opencode/plugin/superpowers.js
git commit -m "feat: implement session.started hook for opencode"
```

---

## Phase 4: Documentation

### Task 13: Create OpenCode Installation Guide

**Files:**
- Create: `.opencode/INSTALL.md`

**Step 1: Create installation guide**

```markdown
# Installing Superpowers for OpenCode

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed
- Node.js installed
- Git installed

## Installation Steps

### 1. Install Superpowers Skills

```bash
# Clone superpowers skills to OpenCode config directory
mkdir -p ~/.config/opencode/superpowers
git clone https://github.com/obra/superpowers.git ~/.config/opencode/superpowers
```

### 2. Install the Plugin

The plugin is included in the superpowers repository you just cloned.

OpenCode will automatically discover it from:
- `~/.config/opencode/superpowers/.opencode/plugin/superpowers.js`

Or you can link it to the project-local plugin directory:

```bash
# In your OpenCode project
mkdir -p .opencode/plugin
ln -s ~/.config/opencode/superpowers/.opencode/plugin/superpowers.js .opencode/plugin/superpowers.js
```

### 3. Restart OpenCode

Restart OpenCode to load the plugin. On the next session, you should see:

```
You have superpowers.
```

## Usage

### Finding Skills

Use the `find_skills` tool to list all available skills:

```
use find_skills tool
```

### Loading a Skill

Use the `use_skill` tool to load a specific skill:

```
use use_skill tool with skill_name: "superpowers:brainstorming"
```

### Personal Skills

Create your own skills in `~/.config/opencode/skills/`:

```bash
mkdir -p ~/.config/opencode/skills/my-skill
```

Create `~/.config/opencode/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

Personal skills override superpowers skills with the same name.

## Updating

```bash
cd ~/.config/opencode/superpowers
git pull
```

## Troubleshooting

### Plugin not loading

1. Check plugin file exists: `ls ~/.config/opencode/superpowers/.opencode/plugin/superpowers.js`
2. Check OpenCode logs for errors
3. Verify Node.js is installed: `node --version`

### Skills not found

1. Verify skills directory exists: `ls ~/.config/opencode/superpowers/skills`
2. Use `find_skills` tool to see what's discovered
3. Check file structure: each skill should have a `SKILL.md` file

### Tool mapping issues

When a skill references a Claude Code tool you don't have:
- `TodoWrite` → use `update_plan`
- `Task` with subagents → use `@mention` syntax to invoke OpenCode subagents
- `Skill` → use `use_skill` tool
- File operations → use your native tools

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Documentation: https://github.com/obra/superpowers
```

**Step 2: Verify file created**

Run: `ls -l .opencode/INSTALL.md`
Expected: File exists

**Step 3: Commit**

```bash
git add .opencode/INSTALL.md
git commit -m "docs: add opencode installation guide"
```

---

### Task 14: Update Main README

**Files:**
- Modify: `README.md`

**Step 1: Add OpenCode section**

Find the section about supported platforms (search for "Codex" in the file), and add after it:

```markdown
### OpenCode

Superpowers works with [OpenCode.ai](https://opencode.ai) through a native JavaScript plugin.

**Installation:** See [.opencode/INSTALL.md](.opencode/INSTALL.md)

**Features:**
- Custom tools: `use_skill` and `find_skills`
- Automatic session bootstrap
- Personal skills with shadowing
- Supporting files and scripts access
```

**Step 2: Verify formatting**

Run: `grep -A 10 "### OpenCode" README.md`
Expected: Shows the section you added

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add opencode support to readme"
```

---

### Task 15: Update Release Notes

**Files:**
- Modify: `RELEASE-NOTES.md`

**Step 1: Add entry for OpenCode support**

At the top of the file (after the header), add:

```markdown
## [Unreleased]

### Added

- **OpenCode Support**: Native JavaScript plugin for OpenCode.ai
  - Custom tools: `use_skill` and `find_skills`
  - Automatic session bootstrap with tool mapping instructions
  - Shared core module (`lib/skills-core.js`) for code reuse
  - Installation guide in `.opencode/INSTALL.md`

### Changed

- **Refactored Codex Implementation**: Now uses shared `lib/skills-core.js` module
  - Eliminates code duplication between Codex and OpenCode
  - Single source of truth for skill discovery and parsing

---

```

**Step 2: Verify formatting**

Run: `head -30 RELEASE-NOTES.md`
Expected: Shows your new section

**Step 3: Commit**

```bash
git add RELEASE-NOTES.md
git commit -m "docs: add opencode support to release notes"
```

---

## Phase 5: Final Verification

### Task 16: Test Codex Still Works

**Files:**
- Test: `.codex/superpowers-codex`

**Step 1: Test find-skills command**

Run: `.codex/superpowers-codex find-skills | head -20`
Expected: Shows list of skills with names and descriptions

**Step 2: Test use-skill command**

Run: `.codex/superpowers-codex use-skill superpowers:brainstorming | head -20`
Expected: Shows brainstorming skill content

**Step 3: Test bootstrap command**

Run: `.codex/superpowers-codex bootstrap | head -30`
Expected: Shows bootstrap content with instructions

**Step 4: If all tests pass, record success**

No commit needed - this is verification only.

---

### Task 17: Verify File Structure

**Files:**
- Check: All new files exist

**Step 1: Verify all files created**

Run:
```bash
ls -l lib/skills-core.js
ls -l .opencode/plugin/superpowers.js
ls -l .opencode/INSTALL.md
```

Expected: All files exist

**Step 2: Verify directory structure**

Run: `tree -L 2 .opencode/` (or `find .opencode -type f` if tree not available)
Expected:
```
.opencode/
├── INSTALL.md
└── plugin/
    └── superpowers.js
```

**Step 3: If structure correct, proceed**

No commit needed - this is verification only.

---

### Task 18: Final Commit and Summary

**Files:**
- Check: `git status`

**Step 1: Check git status**

Run: `git status`
Expected: Working tree clean, all changes committed

**Step 2: Review commit log**

Run: `git log --oneline -20`
Expected: Shows all commits from this implementation

**Step 3: Create summary document**

Create a completion summary showing:
- Total commits made
- Files created: `lib/skills-core.js`, `.opencode/plugin/superpowers.js`, `.opencode/INSTALL.md`
- Files modified: `.codex/superpowers-codex`, `README.md`, `RELEASE-NOTES.md`
- Testing performed: Codex commands verified
- Ready for: Testing with actual OpenCode installation

**Step 4: Report completion**

Present summary to user and offer to:
1. Push to remote
2. Create pull request
3. Test with real OpenCode installation (requires OpenCode installed)

---

## Testing Guide (Manual - Requires OpenCode)

These steps require OpenCode to be installed and are not part of the automated implementation:

1. **Install skills**: Follow `.opencode/INSTALL.md`
2. **Start OpenCode session**: Verify bootstrap appears
3. **Test find_skills**: Should list all available skills
4. **Test use_skill**: Load a skill and verify content appears
5. **Test supporting files**: Verify skill directory paths are accessible
6. **Test personal skills**: Create a personal skill and verify it shadows core
7. **Test tool mapping**: Verify TodoWrite → update_plan mapping works

## Success Criteria

- [ ] `lib/skills-core.js` created with all core functions
- [ ] `.codex/superpowers-codex` refactored to use shared core
- [ ] Codex commands still work (find-skills, use-skill, bootstrap)
- [ ] `.opencode/plugin/superpowers.js` created with tools and hooks
- [ ] Installation guide created
- [ ] README and RELEASE-NOTES updated
- [ ] All changes committed
- [ ] Working tree clean
