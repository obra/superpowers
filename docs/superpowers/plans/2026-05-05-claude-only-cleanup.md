# Claude-Only Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all non-Claude provider support from this superpowers fork, leaving a clean Claude Code-only project.

**Architecture:** Single-pass deletion and editing. Delete non-Claude files/directories first, then edit remaining files to remove cross-platform references.

**Tech Stack:** Git, shell commands, text editing

---

### Task 1: Delete non-Claude files and directories

**Files:**
- Delete: `.codex-plugin/` (entire directory)
- Delete: `.cursor-plugin/` (entire directory)
- Delete: `.opencode/` (entire directory)
- Delete: `GEMINI.md`
- Delete: `AGENTS.md` (symlink)
- Delete: `gemini-extension.json`
- Delete: `scripts/sync-to-codex-plugin.sh`
- Delete: `hooks/hooks-cursor.json`
- Delete: `docs/README.opencode.md`
- Delete: `docs/plans/2025-11-22-opencode-support-design.md`
- Delete: `docs/plans/2025-11-22-opencode-support-implementation.md`
- Delete: `docs/superpowers/plans/2026-03-23-codex-app-compatibility.md`
- Delete: `docs/superpowers/specs/2026-03-23-codex-app-compatibility-design.md`
- Delete: `skills/using-superpowers/references/` (entire directory)

- [ ] **Step 1: Delete all non-Claude directories**

```bash
rm -rf .codex-plugin/ .cursor-plugin/ .opencode/ skills/using-superpowers/references/
```

- [ ] **Step 2: Delete all non-Claude files**

```bash
rm -f GEMINI.md AGENTS.md gemini-extension.json scripts/sync-to-codex-plugin.sh hooks/hooks-cursor.json docs/README.opencode.md docs/plans/2025-11-22-opencode-support-design.md docs/plans/2025-11-22-opencode-support-implementation.md docs/superpowers/plans/2026-03-23-codex-app-compatibility.md docs/superpowers/specs/2026-03-23-codex-app-compatibility-design.md
```

- [ ] **Step 3: Verify deletions**

```bash
# These should all return "No such file or directory"
ls .codex-plugin/ .cursor-plugin/ .opencode/ GEMINI.md AGENTS.md gemini-extension.json skills/using-superpowers/references/ 2>&1 | grep -c "No such file"
# Expected: 7

# These should still exist
ls .claude-plugin/plugin.json hooks/hooks.json scripts/bump-version.sh
# Expected: all three listed without error
```

---

### Task 2: Edit `package.json`

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Rewrite package.json**

Replace the current content:

```json
{
  "name": "superpowers",
  "version": "5.1.0",
  "type": "module",
  "main": ".opencode/plugins/superpowers.js"
}
```

With:

```json
{
  "name": "superpowers",
  "version": "5.1.0"
}
```

- [ ] **Step 2: Verify**

```bash
cat package.json
# Expected: only name and version fields, no "type" or "main"
```

---

### Task 3: Edit `.version-bump.json`

**Files:**
- Modify: `.version-bump.json`

- [ ] **Step 1: Rewrite .version-bump.json**

Replace the current content with only Claude-relevant entries:

```json
{
  "files": [
    { "path": "package.json", "field": "version" },
    { "path": ".claude-plugin/plugin.json", "field": "version" },
    { "path": ".claude-plugin/marketplace.json", "field": "plugins.0.version" }
  ],
  "audit": {
    "exclude": [
      "CHANGELOG.md",
      "RELEASE-NOTES.md",
      "node_modules",
      ".git",
      ".version-bump.json",
      "scripts/bump-version.sh"
    ]
  }
}
```

- [ ] **Step 2: Verify valid JSON**

```bash
python3 -c "import json; json.load(open('.version-bump.json'))"
# Expected: no output (success)
```

---

### Task 4: Edit `README.md`

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace the quickstart line**

Find:
```
Give your agent Superpowers: [Claude Code](#claude-code), [Codex CLI](#codex-cli), [Codex App](#codex-app), [Factory Droid](#factory-droid), [Gemini CLI](#gemini-cli), [OpenCode](#opencode), [Cursor](#cursor), [GitHub Copilot CLI](#github-copilot-cli).
```

Replace with:
```
Give your agent Superpowers: [Install for Claude Code](#claude-code).
```

- [ ] **Step 2: Remove all non-Claude installation sections**

Delete everything from `### Codex CLI` through the end of `### GitHub Copilot CLI` (lines 64-153 approximately). Keep only the `### Claude Code` section.

- [ ] **Step 3: Simplify the Updating section**

Find:
```
## Updating

Superpowers updates are somewhat coding-agent dependent, but are often automatic.
```

Replace with:
```
## Updating

Superpowers updates automatically via the Claude Code plugin system.
```

- [ ] **Step 4: Simplify the Contributing section**

Find:
```
The general contribution process for Superpowers is below. Keep in mind that we don't generally accept contributions of new skills and that any updates to skills must work across all of the coding agents we support.
```

Replace with:
```
The general contribution process for Superpowers is below. Keep in mind that we don't generally accept contributions of new skills.
```

- [ ] **Step 5: Verify no remaining provider references**

```bash
grep -n "Codex\|Gemini\|OpenCode\|Copilot\|Cursor\|Factory Droid" README.md
# Expected: no output
```

---

### Task 5: Edit `skills/using-superpowers/SKILL.md`

**Files:**
- Modify: `skills/using-superpowers/SKILL.md`

- [ ] **Step 1: Simplify "Instruction Priority" section**

Find:
```
1. **User's explicit instructions** (CLAUDE.md, GEMINI.md, AGENTS.md, direct requests) — highest priority
```

Replace with:
```
1. **User's explicit instructions** (CLAUDE.md, direct requests) — highest priority
```

- [ ] **Step 2: Simplify "How to Access Skills" section**

Find and replace the entire "How to Access Skills" section:

```markdown
## How to Access Skills

**In Claude Code:** Use the `Skill` tool. When you invoke a skill, its content is loaded and presented to you—follow it directly. Never use the Read tool on skill files.

**In Copilot CLI:** Use the `skill` tool. Skills are auto-discovered from installed plugins. The `skill` tool works the same as Claude Code's `Skill` tool.

**In Gemini CLI:** Skills activate via the `activate_skill` tool. Gemini loads skill metadata at session start and activates the full content on demand.

**In other environments:** Check your platform's documentation for how skills are loaded.
```

Replace with:

```markdown
## How to Access Skills

Use the `Skill` tool. When you invoke a skill, its content is loaded and presented to you—follow it directly. Never use the Read tool on skill files.
```

- [ ] **Step 3: Remove "Platform Adaptation" section**

Delete the entire section:

```markdown
## Platform Adaptation

Skills use Claude Code tool names. Non-CC platforms: see `references/copilot-tools.md` (Copilot CLI), `references/codex-tools.md` (Codex) for tool equivalents. Gemini CLI users get the tool mapping loaded automatically via GEMINI.md.
```

- [ ] **Step 4: Verify no remaining provider references**

```bash
grep -n "Codex\|Gemini\|OpenCode\|Copilot\|Cursor" skills/using-superpowers/SKILL.md
# Expected: no output
```

---

### Task 6: Edit `skills/executing-plans/SKILL.md`

**Files:**
- Modify: `skills/executing-plans/SKILL.md`

- [ ] **Step 1: Replace the multi-platform note**

Find:
```
**Note:** Tell your human partner that Superpowers works much better with access to subagents. The quality of its work will be significantly higher if run on a platform with subagent support (such as Claude Code or Codex). If subagents are available, use superpowers:subagent-driven-development instead of this skill.
```

Replace with:
```
**Note:** If subagents are available, use superpowers:subagent-driven-development instead of this skill for higher quality results.
```

- [ ] **Step 2: Verify**

```bash
grep -n "Codex\|platform" skills/executing-plans/SKILL.md
# Expected: no output
```

---

### Task 7: Edit `skills/writing-skills/SKILL.md`

**Files:**
- Modify: `skills/writing-skills/SKILL.md`

- [ ] **Step 1: Replace the multi-platform path reference**

Find:
```
**Personal skills live in agent-specific directories (`~/.claude/skills` for Claude Code, `~/.agents/skills/` for Codex)** 
```

Replace with:
```
**Personal skills live in `~/.claude/skills`.**
```

- [ ] **Step 2: Verify**

```bash
grep -n "Codex\|agent-specific" skills/writing-skills/SKILL.md
# Expected: no output
```

---

### Task 8: Edit `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Simplify "Third-party dependencies" subsection**

Find:
```
PRs that add optional or required dependencies on third-party projects will not be accepted unless they are adding support for a new harness (e.g., a new IDE or CLI tool). Superpowers is a zero-dependency plugin by design. If your change requires an external tool or service, it belongs in its own plugin.
```

Replace with:
```
PRs that add optional or required dependencies on third-party projects will not be accepted. Superpowers is a zero-dependency plugin by design. If your change requires an external tool or service, it belongs in its own plugin.
```

- [ ] **Step 2: Remove "New Harness Support" section**

Delete the entire section from `## New Harness Support` through `If you are not sure whether your integration loads the bootstrap at session start, it does not.` (lines 67-86).

- [ ] **Step 3: Simplify "General" section**

Find:
```
## General

- Read `.github/PULL_REQUEST_TEMPLATE.md` before submitting
- One problem per PR
- Test on at least one harness and report results in the environment table
- Describe the problem you solved, not just what you changed
```

Replace with:
```
## General

- Read `.github/PULL_REQUEST_TEMPLATE.md` before submitting
- One problem per PR
- Describe the problem you solved, not just what you changed
```

- [ ] **Step 4: Verify no remaining harness/multi-platform references**

```bash
grep -n "harness\|Codex\|Gemini\|OpenCode\|Copilot\|Cursor" CLAUDE.md
# Expected: no output
```

---

### Task 9: Final verification and commit

**Files:**
- All modified files from Tasks 1-8

- [ ] **Step 1: Run full-repo grep for provider references**

```bash
grep -rn "Codex\|Gemini CLI\|OpenCode\|Copilot\|Cursor\|Factory Droid" --include="*.md" --include="*.json" --include="*.js" . | grep -v ".git/" | grep -v "node_modules/" | grep -v "RELEASE-NOTES.md"
# Expected: no output (RELEASE-NOTES.md excluded as historical changelog)
```

- [ ] **Step 2: Verify Claude plugin files are unchanged**

```bash
git diff .claude-plugin/
# Expected: no output (no changes to Claude plugin)

git diff hooks/hooks.json
# Expected: no output (no changes to Claude hooks)
```

- [ ] **Step 3: Verify git status looks correct**

```bash
git status
# Expected: deleted files from Task 1, modified files from Tasks 2-8
```

- [ ] **Step 4: Commit all changes**

```bash
git add -A
git commit -m "chore: strip non-Claude provider support

Remove Codex, Cursor, OpenCode, Gemini CLI, Copilot CLI, and Factory
Droid support. This fork is Claude Code-only.

Deleted: .codex-plugin/, .cursor-plugin/, .opencode/, GEMINI.md,
AGENTS.md, gemini-extension.json, hooks-cursor.json, references/,
sync-to-codex-plugin.sh, and related docs/plans.

Simplified: README.md, CLAUDE.md, using-superpowers, executing-plans,
writing-skills, package.json, .version-bump.json."
```
